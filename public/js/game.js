const socket = io();

var lockedButton;

var game = {
    matchmaking: false,
    data: null,
    waiting_for_response: false
}

game.start = async function(data) {
    console.log("game start!");

    window.onbeforeunload = function() {
        if (!game.data.player.opponent) {
            if (game.data.game.id != "test")
                return "if you leave now, this game will be closed for good!";
        }
    };

    ui.game.roomKey.textContent = data.game.id;
    if (!data.game.is_custom) {
        ui.game.invitePrompt.classList.add("gone");
    }

    if (data.player.opponent) {
        ui.game.noOpponent.classList.add("gone");
    } else {
        ui.game.noOpponent.classList.remove("gone");
    }

    ui.game.location.classList.add("ui-blink");
    ui.game.phase.classList.add("ui-blink");
    ui.game.time.classList.add("ui-blink");
    ui.game.timeLabel = attach_label(ui.game.time, "");

    game.data = data;
    ui.game.phase.textContent = ["morning", "afternoon", "night"][data.game.phase] + ", ";
    ui.game.location.textContent = data.player.location;

    if (data.player.command || data.player.next_location) {
        socket.emit('cancel game command');
    }

    //

    await init_location(data);
}

async function init_location(data) {
    var locationThings = [];

    if (data.player.location) {
        if (!game.map) {
            game.map = new Map(data);
        } else {
            game.map.updateData(data);
            close_action_menu();
        }
        locationThings.push(game.map);
    } else {
        game.map = null;
    }

    for (let thingName of data.location) {
        var thingData = dictionary.things[thingName];
        var thing = new dictionary.classLookup[thingData.class](thingData.construction);
        locationThings.push(thing);
    }

    if (data.game.shared_phase) {
        game.opponent = new Opponent(data.opponent);
        locationThings.push(game.opponent);
    } else {
        game.opponent = null;
    }

    if (data.player.character) {
        game.player = new You(data.player);
        locationThings.push(game.player);
    } else {
        game.player = null;
    }
    
    // character select
    if (data.characters) {
        for (let character_name of data.game.characters) {
            locationThings.push(new PlayerSelector(character_name, data.characters[character_name]));
        }
    }

    game.location_name = data.player.location;
    game.location = new Location({ things: locationThings });
    await game.location.enter();
}

socket.on('player joined', () => {
    console.log("player joined");
    ui.game.noOpponent.classList.add("gone");
})

socket.on('player offline', () => {
    console.log("player offline");
    ui.game.noOpponent.classList.remove("gone");
})

socket.on('game update', update_game);

async function update_game(data) {
    if (!game.data) {
        game.start(data);
    }

    console.log("game updated");

    stop_waiting_for_response();
    close_action_menu();
    game.disable_actions = true;
    document.body.classList.add("actions-disabled");

    if (data.game.over) console.log("game over!");

    if (data.game.phase != game.data.game.phase) {
        document.body.classList.remove("phase-ended");
    }

    //

    if (game.player && data.player) {
        game.player.updateStats(data.player);

        let prev = game.data.player;
        let curr = data.player;

        if (curr.health < prev.health) {
            document.body.classList.add("hit");
            sfx("hit");
            await wait(300);
            document.body.classList.remove("hit");
        }
    }

    if (game.opponent && data.opponent) {
        game.opponent.updateStats(data.opponent);

        if (data.player.overpowered) {
            game.opponent.setActions(game.opponent.playerOverpoweredActions);
        } else if (data.opponent.overpowered) {
            game.opponent.setActions(game.opponent.opponentOverpoweredActions);
        } else {
            game.opponent.setActions(game.opponent.fightActions);
        }
    }

    if (data.player.messages) {
        for (let message of data.player.messages) {
            let split = message.split(": ");
            let speaker = split[0];
            let msg = split.length > 1 ? split[1] : split[0];

            if (msg == "overwound") {
                var lines = [
                    "nothing left to pack in this punch",
                    "can't wind up any further",
                    "no more winding up"
                ];
                msg = lines[Math.random() * lines.length | 0];
            }

            if (speaker == 'opponent') {
                game.opponent.say(msg);
            } else if (speaker == 'me') {
                game.player.say(msg);
            } else {
                say(msg);
            }
        }
    }

    //

    if (data.player.phase_complete) document.body.classList.add("phase-ended");

    if (data.game.shared_phase_complete) {
        console.log("phase complete. select next location");
        sfx("boxing bell");
        await wait(1000);
    }

    if (data.game.phase != game.data.game.phase) {
        // phase changed

        if (game.map) {
            ui.game.timeLabel.textContent = "time passes...";
            for (let time=game.data.player.time+1; time<=7; time++) {
                sfx("ticking");
                ui.game.time.textContent = (game.data.game.phase * 8 + time) + ":00";
                ui.game.time.classList.remove("ui-blink");
                ui.game.time.offsetWidth;
                ui.game.time.classList.add("ui-blink");
                await wait(500);
            }
        }

        // if (data.player.location != game.data.player.location) {
        //     if (game.location) await game.location.exit();
    
        //     ui.game.phase.textContent = ["morning", "afternoon", "night"][data.game.phase] + ", ";
        //     ui.game.location.textContent = data.player.location;
        //     ui.game.time.textContent = (data.game.phase * 8 + data.player.time) + ":00";
    
        //     await init_location(data);
        // } else {
        //     ui.game.phase.textContent = ["morning", "afternoon", "night"][data.game.phase] + ", ";
    
        //     if (data.game.shared_phase) {
        //         game.opponent = new Opponent(data.opponent);
        //         game.location.things.push(game.opponent);
        //         await game.location.enter();
        //     } else if (game.opponent) {
        //         game.location.things.splice(game.location.things.indexOf(game.opponent), 1);
        //         game.opponent.remove();
        //         game.opponent = null;
        //     }
        // }

        if (game.location) await game.location.exit();
    
        ui.game.phase.textContent = ["morning", "afternoon", "night"][data.game.phase] + ", ";
        ui.game.location.textContent = data.player.location;
        ui.game.time.textContent = (data.game.phase * 8 + data.player.time) + ":00";
        sfx("ticking");

        await init_location(data);
    } else {
        if (game.map) {
            ui.game.timeLabel.textContent = "time passes...";
            for (let time=game.data.player.time+1; time<=data.player.time; time++) {
                sfx("ticking");
                ui.game.time.textContent = (game.data.game.phase * 8 + time) + ":00";
                ui.game.time.classList.remove("ui-blink");
                ui.game.time.offsetWidth;
                ui.game.time.classList.add("ui-blink");
                await wait(500);
            }
        }

        if (game.data.player.location != data.player.location) {
            if (game.location) await game.location.exit();
    
            ui.game.phase.textContent = ["morning", "afternoon", "night"][data.game.phase] + ", ";
            ui.game.location.textContent = data.player.location;
            ui.game.time.textContent = (data.game.phase * 8 + data.player.time) + ":00";
            sfx("ticking");

            await init_location(data);
        }
    }

    ui.game.timeLabel.textContent = (8 - data.player.time) + "/8 turns left this phase";

    game.data = data;
    game.disable_actions = false;
    document.body.classList.remove("actions-disabled");
}

function game_command(thing, command, button) {
    if (game.disable_actions) return;

    stop_waiting_for_response();

    socket.emit('game command', {
        thing: thing,
        command: command
    });
    
    if (game.data.game.shared_phase || command == 'select location') {
        start_waiting_for_response(button);
    }
}

function stop_waiting_for_response() {
    if (game.waiting_for_response) {
        socket.emit('cancel game command');
        document.body.classList.remove("waiting");
        if (lockedButton) {
            lockedButton.classList.remove("locked");
            lockedButton = null;
        }
        game.waiting_for_response = false;
    }
}

function start_waiting_for_response(button) {
    document.body.classList.add("waiting");
    if (button) {
        lockedButton = button;
        button.classList.add("locked");
    }
    game.waiting_for_response = true;
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}