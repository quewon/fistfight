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

    await init_location(data);
    init_pockets(data);

    update_log(data.player.log);
}

function init_pockets(data) {
    game.pockets = new Location({ container: ui.game.pockets });
    game.opponent_pockets = new Location({ container: ui.game.pockets });
    
    for (let thing_data of data.player.things) {
        var thing = new classLookup[thing_data.class](thing_data);
        thing.pocket('self');
    }

    for (let thing_data of data.opponent.things) {
        var thing = new classLookup[thing_data.class](thing_data);
        thing.pocket('opp');
    }
}

async function init_location(data) {
    console.log("initializing location.");
    
    var locationThings = [];

    for (let thing_data of data.location) {
        var thing = new classLookup[thing_data.class](thing_data);
        locationThings.push(thing);
    }

    for (let npc_data of data.npcs) {
        var npc = new NPC(npc_data);
        locationThings.push(npc);
    }
    
    // character select
    if (data.characters) {
        for (let character_name of data.game.characters) {
            locationThings.push(new PlayerSelector(character_name, data.characters[character_name]));
        }
    }

    if (data.game.shared_phase) {
        document.body.classList.remove("solo-phase");
        document.body.classList.add("shared-phase");
        if (!game.opponent) game.opponent = new Opponent(data.opponent);
        locationThings.push(game.opponent);
    } else {
        document.body.classList.add("solo-phase");
        document.body.classList.remove("shared-phase");
        game.opponent = null;
    }

    if (data.player.character) {
        if (!game.player) game.player = new You(data.player);
        locationThings.push(game.player);
    } else {
        game.player = null;
    }

    game.location_name = data.player.location;
    game.location = new Location({ things: locationThings });
    document.title = game.location_name || 'character selection';

    if (game.location_name) {
        ui.game.data.classList.remove("gone");
        ui.game.timeLabel = attach_label(ui.game.time.parentElement, "");
        ui.game.timeLabel.classList.add("monospace");
    } else {
        ui.game.data.classList.add("gone");
        document.body.classList.remove("solo-phase");
    }

    update_turn_info(data);

    close_pockets();

    game.map = null;
    if (game.player) game.player.mapButton.classList.remove("gone");

    await game.location.enter();
}

async function update_game(data) {
    if (!game.data) {
        game.start(data);
    }

    const prev = game.data;

    console.log("game updated.");

    clearTimeout(game.turn_timer);
    document.body.classList.remove("timer-active");
    game.timer_active = false;

    stop_waiting_for_response();
    close_action_menu();
    game.disable_actions = true;
    document.body.classList.add("actions-disabled");

    if (data.game.over) console.log("game over!");

    if (data.game.phase != prev.game.phase) {
        document.body.classList.remove("phase-ended");
    }

    if (data.player.phase_complete && !game.map) {
        toggle_map();
    }
    
    //

    if (data.player.overpowered) {
        document.body.classList.add("overpowered");
    } else {
        document.body.classList.remove("overpowered");
    }

    update_moved_things(prev, data);

    if (game.player && data.player) {
        game.player.updateStats(data.player);

        let past = prev.player;
        let curr = data.player;

        if (curr.health < past.health) {
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

    //

    if (data.player.phase_complete) document.body.classList.add("phase-ended");

    if (data.game.shared_phase_complete) {
        console.log("phase complete. select next location");
        sfx("boxing bell");
        await wait(1000);
    }

    if (data.game.phase != prev.game.phase) {
        if (data.game.shared_phase) {
            update_log(data.player.log.slice(0, -2));
        } else {
            update_log(data.player.log.slice(0, -1));
        }

        if (ui.game.timeLabel) {
            ui.game.timeLabel.textContent = "time passes...";
            for (let time=prev.player.time+1; time<prev.game.turns_this_phase; time++) {
                ui.game.time.textContent = turn_to_time(prev.game.phase, time, prev.game.turns_this_phase);
                ui.game.time.classList.remove("ui-blink");
                ui.game.time.offsetWidth;
                ui.game.time.classList.add("ui-blink");

                if (prev.game.turns_this_phase == 8 || prev.game.turns_this_phase == 16 && time%2==0) sfx("ticking");
                if (prev.game.turns_this_phase == 8) {
                    await wait(500);
                } else if (prev.game.turns_this_phase == 16) {
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

        play_messages(data.player.messages);
    } else {
        play_messages(data.player.messages);

        if (ui.game.timeLabel) {
            ui.game.timeLabel.textContent = "time passes...";
            for (let time=prev.player.time+1; time<=data.player.time; time++) {
                sfx("ticking");
                // ui.game.time.textContent = (game.data.game.phase * 8 + time) + ":00";
                ui.game.time.textContent = turn_to_time(prev.game.phase, time, prev.game.turns_this_phase);
                ui.game.time.classList.remove("ui-blink");
                ui.game.time.offsetWidth;
                ui.game.time.classList.add("ui-blink");
                await wait(500);
            }
        }

        // for now, only applies at the beginning of the game
        // with the character selection location, you know
        if (prev.player.location != data.player.location) {
            if (game.location) await game.location.exit();

            sfx("ticking");

            await init_location(data);
        }

        update_turn_info(data);

        update_log(data.player.log);
    }

    if (!data.game.over && data.game.shared_phase && !data.game.shared_phase_complete && data.game.shared_phase_timer != -1 && !data.opponent.dead) {
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

    if (!data.player.dead && !data.game.over) {
        game.disable_actions = false;
        document.body.classList.remove("actions-disabled");
    }

    game.data = data;
}

function update_moved_things(prev, data) {
    game.item_capacity = data.player.item_capacity || "?";

    var things_removed_from_location = get_removed(prev.location, data.location);
    var things_added_to_location = get_added(prev.location, data.location);
    var things_removed_from_pockets = get_removed(prev.player.things, data.player.things);
    var things_added_to_pockets = get_added(prev.player.things, data.player.things);
    var things_removed_from_opp_pockets = get_removed(prev.opponent.things, data.opponent.things);
    var things_added_to_opp_pockets = get_added(prev.opponent.things, data.opponent.things);

    var pocketed_count = things_added_to_pockets.length;
    var unpocketed_count = things_removed_from_pockets.length;

    if (prev.player.location == data.player.location && prev.phase == data.phase) {
        for (let thing_data of things_removed_from_location) {
            var thing = game.location.remove_thing(thing_data);
            check: if (thing) {
                for (let i=0; i<things_added_to_pockets.length; i++) {
                    let ptd = things_added_to_pockets[i];
                    if (ptd.id == thing_data.id) {
                        thing.pocket('self');
                        things_added_to_pockets.splice(i, 1);
                        break check;
                    }
                }

                for (let i=0; i<things_added_to_opp_pockets.length; i++) {
                    let otd = things_added_to_opp_pockets[i];
                    if (otd.id == thing_data.id) {
                        thing.pocket('opp');
                        things_added_to_opp_pockets.splice(i, 1);
                        break check;
                    }
                }
            }
        }
    }

    for (let thing_data of things_removed_from_opp_pockets) {
        var thing = game.opponent_pockets.remove_thing(thing_data);
        check: if (thing) {
            for (let i=0; i<things_added_to_pockets.length; i++) {
                let ptd = things_added_to_pockets[i];
                if (ptd.id == thing_data.id) {
                    thing.pocket('self');
                    things_added_to_pockets.splice(i, 1);
                    break check;
                }
            }

            for (let i=0; i<things_added_to_location.length; i++) {
                let ltd = things_added_to_location[i];
                if (ltd.id == thing_data.id) {
                    thing.unpocket();
                    things_added_to_location.splice(i, 1);
                    break check;
                }
            }
        }
    }

    for (let thing_data of things_removed_from_pockets) {
        var thing = game.pockets.remove_thing(thing_data);
        check: if (thing) {
            for (let i=0; i<things_added_to_location.length; i++) {
                let ltd = things_added_to_location[i];
                if (ltd.id == thing_data.id) {
                    thing.unpocket();
                    things_added_to_location.splice(i, 1);
                    break check;
                }
            }

            for (let i=0; i<things_added_to_opp_pockets.length; i++) {
                let otd = things_added_to_opp_pockets[i];
                if (otd.id == thing_data.id) {
                    thing.pocket('opp');
                    things_added_to_opp_pockets.splice(i, 1);
                    break check;
                }
            }
        }
    }

    for (let thing_data of things_added_to_pockets) {
        var thing = thing_data.is_constructed ? thing_data : new classLookup[thing_data.class](thing_data);
        thing.pocket('self');
    }

    for (let thing_data of things_added_to_opp_pockets) {
        var thing = thing_data.is_constructed ? thing_data : new classLookup[thing_data.class](thing_data);
        thing.pocket('opp');
    }

    if (prev.player.location == data.player.location && prev.phase == data.phase) {
        for (let thing_data of things_added_to_location) {
            var thing = thing_data.is_constructed ? thing_data : new classLookup[thing_data.class](thing_data);
            game.location.add_thing(thing);
        }
    }

    if (!data.game.shared_phase) {
        if (pocketed_count > 0) {
            look_in_pockets('self');
        } else if (unpocketed_count > 0) {
            close_pockets();
        }
    } else {
        close_pockets();
    }

    if (game.player) {
        game.player.pocketButton.classList.remove("gone");
        if (data.game.phase_complete || data.player.overpowered) {
            game.player.pocketButton.classList.add("gone");
        }
    }
}

function play_messages(messages) {
    if (messages) {
        var thing_messages = [];
        var mouse_messages = [];

        for (let message of messages) {
            if (message.includes(": ")) {
                thing_messages.push(message);
            } else {
                mouse_messages.push(message);
            }
        }

        play_mouse_messages(mouse_messages);
        play_thing_messages(thing_messages);
    }
}

async function play_mouse_messages(mouse_messages) {
    for (let message of mouse_messages) {
        if (message == "overwound") {
            var lines = [
                "nothing left to pack in this punch",
                "can't wind up any further",
                "no more winding up"
            ];
            message = lines[Math.random() * lines.length | 0];
        }

        await say(message);
    }
}

async function play_thing_messages(thing_messages) {
    for (let message of thing_messages) {
        let split = message.split(": ");
        let speaker = split[0];
        let msg = split.length > 1 ? split[1] : split[0];

        if (speaker == 'opp') {
            await game.opponent.say(msg);
        } else if (speaker == 'self') {
            await game.player.say(msg);
        } else {
            for (let thing of game.location.things) {
                if (thing.id == speaker) {
                    await thing.say(msg);
                    break;
                }
            }
        }
    }
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

function look_in_pockets(subject) {
    if (game.disable_actions) return;

    if (subject == 'self') {
        if (!game.data.player) return;
        if (game.data.player.overpowered) return;

        ui.game.pocketOwner.textContent = "your";
        ui.game.pocketCapacity.textContent = game.data.player.item_capacity - game.data.player.things.length;
        ui.game.pockets.classList.remove("opponent");
        game.opponent_pockets.exit({ immediate: true });
        game.pockets.enter({ immediate: true });
    } else if (subject == 'opp') {
        if (!game.data.opponent) return;

        ui.game.pocketOwner.textContent = "their";
        ui.game.pocketCapacity.textContent = game.data.opponent.item_capacity - game.data.opponent.things.length;
        ui.game.pockets.classList.add("opponent");
        game.pockets.exit({ immediate: true });
        game.opponent_pockets.enter({ immediate: true });
    }
    
    ui.game.pockets.classList.remove("gone");
}

function close_pockets() {
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

function check_weapon(data) {
    for (let thing of data.player.things) {
        if (thing.tags && thing.tags.includes("weapon")) {
            return true;
        }
    }
    // for (let thing of data.location) {
    //     if (thing.tags.includes("weapon")) {
    //         return true;
    //     }
    // }
    return false;
}