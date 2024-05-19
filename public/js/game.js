const socket = io();

const classLookup = {
    "Thing": Thing,
    "MissionPrompt": MissionPrompt
}

var game = {
    matchmaking: false,

    data: null,
    waiting_for_response: false,

    map: null,
    player: null,
    opponent: null,
    location_name: null,
    location: null,
    pockets: null,

    disable_actions: false,
    timer_active: false,
    made_command: false,
    turn_timer: null,
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
    ui.game.log.classList.remove("gone");
    ui.game.logButton.classList.remove("gone");

    game.data = data;

    if (data.player.command || data.player.next_location) {
        socket.emit('cancel game command');
    }

    //

    init_pockets(data);
    await init_location(data);

    update_log(data.player.log);
}

function init_pockets(data) {
    var pocketsThings = [];
    for (let thing_data of data.player.things) {
        thing_data.in_pockets = true;
        var thing = new classLookup[thing_data.class](thing_data);
        pocketsThings.push(thing);
    }
    game.pockets = new Location({ container: ui.game.pockets, things: pocketsThings });
    game.pockets.enter();
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

    update_turn_info(data);

    for (let thing_data of data.location) {
        var thing = new classLookup[thing_data.class](thing_data);
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

    close_pockets();

    game.location_name = data.player.location;
    game.location = new Location({ things: locationThings });
    document.title = game.location_name || 'character selection';
    await game.location.enter();
}

async function update_game(data) {
    if (!game.data) {
        game.start(data);
    }

    console.log("game updated");

    clearTimeout(game.turn_timer);
    document.body.classList.remove("timer-active");
    game.timer_active = false;

    stop_waiting_for_response();
    close_action_menu();
    game.disable_actions = true;
    document.body.classList.add("actions-disabled");

    if (data.game.over) console.log("game over!");

    if (data.game.phase != game.data.game.phase) {
        document.body.classList.remove("phase-ended");
    }

    //

    var things_removed_from_location = get_removed(game.data.location, data.location);
    var things_added_to_location = get_added(game.data.location, data.location);
    var things_removed_from_pockets = get_removed(game.data.player.things, data.player.things);
    var things_added_to_pockets = get_added(game.data.player.things, data.player.things);

    if (game.location_name == data.player.location && game.data.phase == data.phase) {
        for (let thing_data of things_removed_from_location) {
            var thing = game.location.remove_thing_by_data(thing_data);
            if (thing) {
                for (let i=0; i<things_added_to_pockets.length; i++) {
                    let ptd = things_added_to_pockets[i];
                    if (ptd.id == thing_data.id) {
                        ptd.position = thing.get_position();
                        break;
                    }
                }
            }
        }
    }

    for (let thing_data of things_added_to_pockets) {
        thing_data.in_pockets = true;
        var thing = new classLookup[thing_data.class](thing_data);
        game.pockets.things.push(thing);
        game.pockets.enter_thing(thing);
    }

    for (let thing_data of things_removed_from_pockets) {
        var thing = game.pockets.remove_thing_by_data(thing_data);
        if (thing) {
            for (let i=0; i<things_added_to_location.length; i++) {
                let ltd = things_added_to_location[i];
                if (ltd.id == thing_data.id) {
                    ltd.position = thing.get_position();
                    break;
                }
            }
        }
    }

    if (game.location_name == data.player.location && game.data.phase == data.phase) {
        for (let thing_data of things_added_to_location) {
            var thing = new classLookup[thing_data.class](thing_data);
            game.location.things.push(thing);
            game.location.enter_thing(thing);
        }
    }

    if (things_added_to_pockets.length > 0) {
        look_in_pockets();
    } else if (things_removed_from_pockets.length > 0) {
        close_pockets();
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

        if (data.player.command) {
            let c = data.player.command.command;
            if (c == 'dodge' && curr.dodge_successful) {
                sfx("dodge");
                await wait(300);
            }
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

        let curr = data.opponent;

        if (data.opponent.command) {
            let c = data.opponent.command.command;
            if (c == 'dodge' && curr.dodge_successful) {
                sfx("dodge");
                await wait(300);
            }
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
        if (data.game.shared_phase) {
            update_log(data.player.log.slice(0, -2));
        } else {
            update_log(data.player.log.slice(0, -1));
        }

        if (game.map) {
            ui.game.timeLabel.textContent = "time passes...";
            for (let time=game.data.player.time+1; time<game.data.game.turns_this_phase; time++) {
                ui.game.time.textContent = turn_to_time(game.data.game.phase, time, game.data.game.turns_this_phase);
                ui.game.time.classList.remove("ui-blink");
                ui.game.time.offsetWidth;
                ui.game.time.classList.add("ui-blink");

                if (game.data.game.turns_this_phase == 8 || game.data.game.turns_this_phase == 16 && time%2==0) sfx("ticking");
                if (game.data.game.turns_this_phase == 8) {
                    await wait(500);
                } else if (game.data.game.turns_this_phase == 16) {
                    await wait(250);
                }
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
    
        update_turn_info(data);
        sfx("ticking");

        await init_location(data);

        update_log(data.player.log);
    } else {
        if (game.map) {
            ui.game.timeLabel.textContent = "time passes...";
            for (let time=game.data.player.time+1; time<=data.player.time; time++) {
                sfx("ticking");
                // ui.game.time.textContent = (game.data.game.phase * 8 + time) + ":00";
                ui.game.time.textContent = turn_to_time(game.data.game.phase, time, game.data.game.turns_this_phase);
                ui.game.time.classList.remove("ui-blink");
                ui.game.time.offsetWidth;
                ui.game.time.classList.add("ui-blink");
                await wait(500);
            }
        }

        // for now, only applies at the beginning of the game
        // with the character selection location, you know
        if (game.data.player.location != data.player.location) {
            if (game.location) await game.location.exit();

            sfx("ticking");

            await init_location(data);
        }

        update_turn_info(data);

        update_log(data.player.log);
    }

    if (data.game.shared_phase && !data.game.shared_phase_complete && data.game.shared_phase_timer != -1) {
        let timer_duration = data.game.shared_phase_timer * 1000;
        let remaining_time = timer_duration;
        if (data.player.timer_started) {
            remaining_time -= new Date().getTime() - data.player.timer_started;
        } else {
            socket.emit('timer started', new Date().getTime());
        }

        game.made_command = false;
        document.body.classList.add("timer-active");
        game.timer_active = true;

        if (remaining_time <= 0) {
            resolve_timer();
        } else {
            ui.game.timer.animate(
                [
                    { height: (remaining_time / timer_duration * 100) + "%" },
                    { height: "0" }
                ],
                { duration: remaining_time }
            );
            game.turn_timer = setTimeout(resolve_timer, remaining_time);
        }
    }

    game.data = data;
    game.disable_actions = false;
    document.body.classList.remove("actions-disabled");
}

function resolve_timer() {
    if (game.timer_active) {
        document.body.classList.remove("timer-active");
        game.timer_active = false;
        if (!game.made_command) {
            socket.emit('game command', {
                thing: null,
                command: 'timed out'
            });
        }
    }
}

function update_turn_info(data) {
    ui.game.phase.textContent = data.game.phases[data.game.phase] + ", ";
    ui.game.location.textContent = data.player.location;
    ui.game.time.textContent = turn_to_time(data.game.phase, data.player.time, data.game.turns_this_phase);
    if (ui.game.timeLabel) ui.game.timeLabel.textContent = (data.game.turns_this_phase - data.player.time) + "/" + data.game.turns_this_phase + " turns left this phase";
}

function update_log(log) {
    for (let i=ui.game.log.children.length-1; i>=0; i--) {
        let el = ui.game.log.children[i];
        if (i >= log.length) {
            el.remove();
        } else if (el.innerHTML != log[i]) {
            el.innerHTML = log[i];
        }
    }

    if (ui.game.log.children.length < log.length) {
        for (let i=ui.game.log.children.length; i<log.length; i++) {
            let el = document.createElement("div");
            el.innerHTML = log[i];
            ui.game.log.appendChild(el);
        }
    }

    ui.game.log.scrollTop = ui.game.log.scrollHeight;
}

function game_command(thing, command, button) {
    if (game.disable_actions) return;

    stop_waiting_for_response();

    socket.emit('game command', {
        thing: thing,
        command: command
    });

    game.made_command = true;
    
    if (game.data.game.shared_phase || command == 'select location') {
        start_waiting_for_response(button);
    }
}

function stop_waiting_for_response() {
    if (game.waiting_for_response) {
        socket.emit('cancel game command');
        game.made_command = false;
        document.body.classList.remove("waiting");
        if (lockedButton) {
            lockedButton.classList.remove("locked");
            lockedButton = null;
            game.saved_command = null;
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

function look_in_pockets() {
    if (game.data.phase_complete) return;
    
    ui.game.pockets.classList.remove("gone");
    // game.pockets.enter();
}

function close_pockets() {
    // game.pockets.exit();
    ui.game.pockets.classList.add("gone");
    close_action_menu();
}

//

function turn_to_time(phase, turn, turns_this_phase) {
    let time = phase * 8 + turn * 8/turns_this_phase;
    let hour = Math.floor(time);
    let min = time % 1 * 60;

    if (hour < 10) hour = "0" + hour;
    if (min < 10) min = "0" + min;

    return hour + ":" + min;
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function get_removed(prev, curr) {
    let removed = [];

    for (let thing_data of prev) {
        let in_curr = false;
        for (let ctd of curr) {
            if (ctd.id == thing_data.id) {
                in_curr = true;
                break;
            }
        }
        if (in_curr) {
            continue;
        } else {
            removed.push(thing_data);
        }
    }

    return removed;
}

function get_added(prev, curr) {
    let added = [];

    for (let thing_data of curr) {
        let in_prev = false;
        for (let ptd of prev) {
            if (ptd.id == thing_data.id) {
                in_prev = true;
                break;
            }
        }
        if (in_prev) {
            continue;
        } else {
            added.push(thing_data);
        }
    }

    return added;
}