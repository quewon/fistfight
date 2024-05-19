const dictionary = require('./dictionary')

class Game {
    constructor(server, id, isCustom) {
        this.server = server;
        this.thing_count = 0;

        this.locations = {
            "character selection": [
                this.create_thing("character selection title")
            ],

            "battlefield": [
            ],
        }
        this.game = {
            id: id,
            is_custom: isCustom || false,
            phases: ["morning", "afternoon", "evening"],
            map: ['battlefield'],
            characters: ['bill', 'jim beans'],
            phase: 0,
            shared_phase: false,
            shared_time: 0,

            solo_phase_turns: 8,
            shared_phase_turns: 8,
            turns_this_phase: 8,
            shared_phase_timer: 60 //seconds
        }
        this.player1 = {
            opponent: null,
            id: null,
            location: null,
            character: null,
            time: 0,
            log: [],

            things: [],
            health: 0,
            strength: 0,
            windup: 0,
            info: 0
        }
        this.player2 = {
            opponent: null,
            id: null,
            location: null,
            character: null,
            time: 0,
            log: [],

            things: [],
            health: 0,
            strength: 0,
            windup: 0,
            info: 0
        }

        this.available_generic_locations = [];
        for (let i=1; i<=10; i++) {
            let name = "apt #" + i;
            this.available_generic_locations.push(name);
            this.locations[name] = [];
            this.game.map.push(name);
        }
        
        this.global_log("game created with key <em>" + this.game.id + "</em>.");
        this.global_log("<span class='phase-starter'><em>character selection</em> phase begins.</span>");
    }

    global_log(message) {
        this.player1.log.push(message);
        this.player2.log.push(message);
    }

    log(player_what, class_name, turn, message) {
        if (turn) {
            this[player_what].log.push("<span class='has-turn-info "+class_name+"'><span>[turn " + turn + "]</span><span>" + message + "</span>");
        } else if (class_name == "self" || class_name == "opp") {
            let whitespaces = this.game.turns_this_phase.toString().length + 1 + (turn ? turn.toString().length : (this[player_what].time + 1).toString().length);
            turn = "";
            for (let i=0; i<whitespaces; i++) {
                turn += " ";
            }
            this[player_what].log.push("<span class='has-turn-info "+class_name+"'><span>      " + turn + " </span><span>" + message + "</span>");
        } else {
            this[player_what].log.push("<span class='"+class_name+"'>" + message + "</span>");
        }
    }

    add_player(playerId) {
        if (!this.player1.id) {
            this.player1.id = playerId;
            this.player2.opponent = playerId;
    
            return 'player1';
        } else if (!this.player2.id) {
            this.player2.id = playerId;
            this.player1.opponent = playerId;
    
            return 'player2';
        }
        
        return false;
    }

    remove_player(playerId) {
        if (this.player1.id == playerId) {
            this.player1.id = null;
            this.player2.opponent = null;
    
            return 'player1';
        } else if (this.player2.id == playerId) {
            this.player2.id = null;
            this.player1.opponent = null;
    
            return 'player2';
        }
    
        return false;
    }

    create_thing(name) {
        var thing = JSON.parse(JSON.stringify(dictionary.things[name]));
        thing.name = name;
        thing.id = this.thing_count++;
        return thing;
    }

    opponent_data(player_what) {
        var data;
        if (player_what == 'player1') {
            data = this.player2;
        } else if (player_what == 'player2') {
            data = this.player1;
        }

        return {
            character: data.character,
            image: data.image,
            health: data.health,
            windup: data.windup,
            max_windup: data.max_windup,
            command: data.command,
            things: data.things,

            overpowered: data.overpowered,
            dodge_successful: data.dodge_successful
        }
    }

    player_data(player_what) {
        var data = {};
        for (let p in this[player_what]) {
            data[p] = this[player_what][p];
        }
        return data;
    }

    dumb_data(player_what) {
        var characters;
        if (!this[player_what].character) {
            characters = {};
            for (let character of this.game.characters) {
                characters[character] = dictionary.characters[character];
            }
        }

        return {
            game: this.game,
            player: this.player_data(player_what),
            opponent: this.game.shared_phase ? this.opponent_data(player_what) : null,
            location: this.locations[this[player_what].location || 'character selection'],
            characters: characters
        }
    }

    update(player_what) {
        if (this.player1.id && (!player_what || player_what == 'player1')) {
            this.server.to(this.player1.id).emit('game update', this.dumb_data('player1'));
        }
        if (this.player2.id && (!player_what || player_what == 'player2')) {
            this.server.to(this.player2.id).emit('game update', this.dumb_data('player2'));
        }
    }

    //

    set_character(player_what, character_name) {
        var player = this[player_what];
        var character = JSON.parse(JSON.stringify(dictionary.characters[character_name]));
        for (let property in character) {
            player[property] = character[property];
        }
        player.character = character_name;

        // find home
        var location_name = this.available_generic_locations.splice(Math.random() * this.available_generic_locations.length | 0, 1)[0];
        this.locations[location_name] = [];
        for (let thing_name of character.home) {
            this.locations[location_name].push(this.create_thing(thing_name));
        }

        player.home = location_name;
        player.location = location_name;
    }

    take_thing(player_what, thing_id) {
        var player = this[player_what];
        var location = this.locations[player.location];

        var thing;
        var thing_index = -1;
        for (let i=0; i<location.length; i++) {
            if (location[i].id == thing_id) {
                thing_index = i;
                thing = location[i];
                break;
            }
        }

        if (thing && thing.portable) {
            location.splice(thing_index, 1);
            player.things.push(thing);
            return thing;
        }
        return false;
    }

    drop_thing(player_what, thing_id) {
        var player = this[player_what];

        var thing;
        var thing_index = -1;
        for (let i=0; i<player.things.length; i++) {
            if (player.things[i].id == thing_id) {
                thing_index = i;
                thing = player.things[i];
                break;
            }
        }

        if (thing) {
            var location = this.locations[player.location];
            player.things.splice(thing_index, 1);
            location.push(thing);
            return thing;
        }

        return false;
    }

    process_command(player_what, conditions) {
        if (this.game.over) return;

        conditions = conditions || {};

        var player = this[player_what];

        var thing = player.command.thing;
        var command = player.command.command;

        if (!player.character) {
            if (command == 'select character') {
                this.set_character(player_what, thing);
                this.log(player_what, "self", null, "selected <em>" + thing + "</em>.");
                this.log(player_what, "phase-starter", null, "<em>" + this.game.phases[0] + "</em> phase begins.");
            }
            return;
        }

        if (command == 'select location') {
            player.next_location = thing;
            return;
        }

        if (player.phase_complete) return;

        var opponent_what = player_what == 'player1' ? 'player2' : 'player1';
        var opponent = this[opponent_what];
        var turn = conditions.no_timestamping ? null : (player.time + 1) + "/" + this.game.turns_this_phase;

        if (command == 'timed out') {
            this.log(player_what, "self", turn, "<em>" + player.character + "</em> waits</em>.");
            this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> waits</em>.");
            this.next_turn(player_what);
            return;
        }

        if (command == 'take') {
            var taken_thing = this.take_thing(player_what, thing);
            if (taken_thing) {
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> picks up <em>" + taken_thing.name + "</em>.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> picks up <em>" + taken_thing.name + "</em>.");
                } else {
                    this.log(player_what, "self", turn, "picked up <em>" + taken_thing.name + "</em>.");
                }
            } else {
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> tries to take something that isn't there.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> tries to take something that isn't there.");
                } else {
                    this.log(player_what, "self", turn, "tried to take something that isn't there.");
                }
            }
            this.next_turn(player_what);
        }

        if (command == 'drop') {
            var dropped_thing = this.drop_thing(player_what, thing);
            if (dropped_thing) {
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> drops <em>" + dropped_thing.name + "</em>.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> drops <em>" + dropped_thing.name + "</em>.");
                } else {
                    this.log(player_what, "self", turn, "dropped <em>" + dropped_thing.name + "</em>.");
                }
            } else {
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> tries to drop something they don't have.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> tries to drop something they don't have.");
                } else {
                    this.log(player_what, "self", turn, "tried to drop something you don't have.");
                }
            }
            this.next_turn(player_what);
        }

        if (thing == 'opponent') {
            if (!player.overpowered) {
                if (command == 'question') {
                    player.info++;
                    this.log(player_what, "self", turn, "<em>" + player.character + "</em> questions <em>" + opponent.character + "</em>.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> questions <em>" + opponent.character + "</em>.");
                    this.next_turn(player_what);
                    return;
                }

                if (command == 'punch') {
                    if (opponent.health <= 0) {
                        player.messages.push("opponent already overpowered");
                        this.log(player_what, "self", turn, "<em>" + player.character + "</em> attempts to punch <em>" + opponent.character + "</em>.");
                        this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> attempts to punch <em>" + opponent.character + "</em>.");
                    } else {
                        let pp = this.punch_power(player_what);
                        this.damage_player(opponent_what, pp);
                        if (opponent.windup > 0) {
                            opponent.messages.push("me: got hit -- windups lost");
                        }
                        opponent.windup = 0;
                        player.windup = 0;
                        if (!conditions.no_logging) {
                            this.log(player_what, "self", turn, "<em>" + player.character + "</em> hits <em>" + opponent.character + "</em> for " + pp + " damage.");
                            this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> hits <em>" + opponent.character + "</em> for " + pp + " damage.");
                        }
                    }
                    this.next_turn(player_what);
                    return;
                }
    
                if (command == 'windup') {
                    player.windup++;
                    if (player.windup > player.max_windup) {
                        player.windup = player.max_windup;
                        player.messages.push("overwound");
                    }
                    this.log(player_what, "self", turn, "<em>" + player.character + "</em> winds up.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> winds up.");
                    this.next_turn(player_what);
                    return;
                }
    
                if (command == 'block') {
                    // player.windup = 1;
                    player.messages.push("blocked air -- no windup");
                    this.log(player_what, "self", turn, "<em>" + player.character + "</em> blocks nothing.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> blocks nothing.");
                    this.next_turn(player_what);
                    return;
                }
    
                if (command == 'dodge') {
                    player.dodge_successful = true;
                    player.messages.push("dodged air");
                    this.log(player_what, "self", turn, "<em>" + player.character + "</em> dodges nothing.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> dodges nothing.");
                    this.next_turn(player_what);
                    return;
                }
            }

            if (player.overpowered) {
                if (command == 'struggle') {
                    if (this.struggle_success(player_what)) {
                        player.overpowered = false;
                        player.health = 1;
                        player.messages.push("me: ESCAPED HOLD");
                        opponent.messages.push("opponent: ESCAPED HOLD");
                        this.log(player_what, "self", turn, "<em>" + player.character + "</em> struggles free.");
                        this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> struggles free.");
                    } else {
                        this.log(player_what, "self", turn, "<em>" + player.character + "</em> struggles.");
                        this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> struggles.");
                    }
                    this.next_turn(player_what);
                    return;
                }
            }
        }
    }

    punch_power(player_what) {
        var p = this[player_what];
        return p.strength * (Math.min(p.windup, p.max_windup) + 1);
    }

    blocked_punch_power(player_what) {
        var pp = this.punch_power(player_what);
        return Math.floor(pp/2);
    }

    damage_player(player_what, amount) {
        this[player_what].health -= amount;
        if (this[player_what].health <= 0) {
            this[player_what].health = 0;
            this[player_what].windup = 0;
            this[player_what].overpowered = true;
            this[player_what].messages.push("OPPONENT DOWN");
            this[player_what].messages.push("opponent: OVERPOWERED");

            var opponent_what = player_what == 'player1' ? 'player2' : 'player1';

            this[opponent_what].messages.push("me: OVERPOWERED");

            this.log(player_what, "self",  null, "<em>" + this[player_what].character + "</em> is <em>overpowered</em>.");
            this.log(opponent_what, "opp", null, "<em>" + this[player_what].character + "</em> is <em>overpowered</em>.");
        }
    }

    dodge_success(player_what) {
        return Math.random() <= this[player_what].dodge_chance;
    }

    struggle_success(player_what) {
        var player = this[player_what];
        var opponent_what = player_what == 'player1' ? 'player2' : 'player1';
        var opponent = this[opponent_what];

        let strengthSum = player.strength + opponent.strength;
        let escapeChance = player.strength / strengthSum;
        return Math.random() <= escapeChance;
    }
    
    process_simul_commands() {
        if (this.game.over) return;

        this.player1.messages = [];
        this.player2.messages = [];

        let c1 = this.player1.command.command;
        let c2 = this.player2.command.command;
        let p1 = this.player1;
        let p2 = this.player2;
        let turn = this.game.shared_time + 1;
        let turn_string = turn+"/"+this.game.turns_this_phase;

        if (c1 == 'select location' && c2 != 'select location') {
            this.log('player1', "self", turn_string, "<em>" + p1.character + "</em> attempts to leave.");
            this.log('player2',  "opp", turn_string, "<em>" + p1.character + "</em> attempts to leave.");
            this.process_command('player2', { no_timestamping: true });
            this.next_turn();
            return;
        }

        if (c1 != 'select location' && c2 == 'select location') {
            this.process_command('player1');
            this.log('player2', "self", null, "<em>" + p2.character + "</em> attempts to leave.");
            this.log('player1',  "opp", null, "<em>" + p2.character + "</em> attempts to leave.");
            this.next_turn();
            return;
        }

        if (c1 == 'take' && c2 == 'take' && p1.command.thing == p2.command.thing) {
            this.log('player1', "self", turn_string, "<em>" + p1.character + "</em> reaches for <em>" + p1.command.thing + "</em>...");
            this.log('player2',  "opp", turn_string, "<em>" + p1.character + "</em> reaches for <em>" + p1.command.thing + "</em>...");
            this.log('player1',  "opp", null, "... and so does <em>" + p1.character + "</em>. meet cute :)");
            this.log('player2', "self", null, "... and so does <em>" + p1.character + "</em>. meet cute :)");
            this.next_turn();
            return;
        }
        
        if (p1.command.thing == 'opponent' && 
            p2.command.thing == 'opponent') {

            // punch v punch

            if (c1 == 'punch' && c2 == 'punch') {
                this.log('player1', "self", turn_string, "<em>" + p1.character + "</em> punches <em>" + p2.character + "</em>.");
                this.log('player2',  "opp", turn_string,  "<em>" + p1.character + "</em> punches <em>" + p2.character + "</em>.");
                this.log('player1',  "opp", null, "<em>" + p2.character + "</em> returns the favor.");
                this.log('player2', "self", null, "<em>" + p2.character + "</em> returns the favor.");
                
                this.damage_player('player1', this.punch_power('player2'));
                this.damage_player('player2', this.punch_power('player1'));
                p1.windup = 0;
                p2.windup = 0;

                if (p1.overpowered && p2.overpowered) {
                    this.phase_complete();
                }
                this.next_turn();
                return;
            }

            // punch v windup

            if (c1 == 'punch' && c2 == 'windup') {
                this.log('player1', "self", turn_string, "<em>" + p1.character + "</em> punches <em>" + p2.character + "</em>.");
                this.log('player2', "opp", turn_string,  "<em>" + p1.character + "</em> punches <em>" + p2.character + "</em>.");
                this.log('player1', "opp", null,  "<em>" + p2.character + "</em> fails to wind up.");
                this.log('player2', "self", null, "<em>" + p2.character + "</em> fails to wind up.");

                this.damage_player('player2', this.punch_power('player1'));
                p1.windup = 0;
                if (p2.windup > 0) {
                    p2.windup = 0;
                    p2.messages.push("me: got hit -- windups lost");
                    p1.messages.push("opponent: got hit -- windups lost");
                } else {
                    p2.messages.push("me: got hit -- windup failed");
                    p1.messages.push("opponent: got hit -- windup failed");
                }
                if (p1.overpowered && p2.overpowered) {
                    this.phase_complete();
                }
                this.next_turn();
                return;
            }

            if (c1 == 'windup' && c2 == 'punch') {
                this.log('player2', "self", turn_string, "<em>" + p2.character + "</em> punches <em>" + p1.character + "</em>.");
                this.log('player1', "opp", turn_string, "<em>" + p2.character + "</em> punches <em>" + p1.character + "</em>.");
                this.log('player2', "opp",  null, "<em>" + p1.character + "</em> fails to wind up.");
                this.log('player1', "self", null, "<em>" + p1.character + "</em> fails to wind up.");

                this.damage_player('player1', this.punch_power('player2'));
                p2.windup = 0;
                if (p1.windup > 0) {
                    p1.windup = 0;
                    p1.messages.push("me: got hit -- windups lost");
                    p2.messages.push("opponent: got hit -- windups lost");
                } else {
                    p1.messages.push("me: got hit -- windup failed");
                    p2.messages.push("opponent: got hit -- windup failed");
                }
                this.next_turn();
                return;
            }

            // punch v block

            if (c1 == 'punch' && c2 == 'block') {
                this.log('player1', "self", turn_string, "<em>" + p1.character + "</em> throws a punch--");
                this.log('player2', "opp",  turn_string, "<em>" + p1.character + "</em> throws a punch--");
                this.log('player1', "opp",  null, "--<em>" + p2.character + "</em> blocks it.");
                this.log('player2', "self", null, "--<em>" + p2.character + "</em> blocks it.");

                let reduced = this.blocked_punch_power('player1');
                this.damage_player('player2', reduced);
                p1.windup = 0;
                p2.windup = 1;
                p2.messages.push("block successful -- damage halved");
                p1.messages.push("opponent: blocked punch");

                this.next_turn();
                return;
            }

            if (c1 == 'block' && c2 == 'punch') {
                this.log('player2', "self", turn_string, "<em>" + p2.character + "</em> throws a punch--");
                this.log('player1', "opp",  turn_string, "<em>" + p2.character + "</em> throws a punch--");
                this.log('player2', "opp",  null, "--<em>" + p1.character + "</em> blocks it.");
                this.log('player1', "self", null, "--<em>" + p1.character + "</em> blocks it.");

                let reduced = this.blocked_punch_power('player2');
                this.damage_player('player1', reduced);
                this.player1.windup = 1;
                this.player2.windup = 0;
                this.player1.messages.push("block successful -- damage halved");
                this.player2.messages.push("opponent: blocked punch");

                this.next_turn();
                return;
            }

            // punch v dodge

            if (c1 == 'punch' && c2 == 'dodge') {
                if (this.dodge_success('player2')) {
                    this.log('player1', "opp",  turn_string, "<em>" + p2.character + "</em> dodges--");
                    this.log('player2', "self", turn_string, "<em>" + p2.character + "</em> dodges--");
                    this.log('player1', "self", null, "--<em>" + p1.character + "</em> misses.");
                    this.log('player2', "opp",  null, "--<em>" + p1.character + "</em> misses.");
                    
                    p2.dodge_successful = true;
                    this.player2.messages.push("dodge success!");
                    this.player1.messages.push("opponent: punch dodged");
                } else {
                    this.log('player1', "opp",  turn_string, "<em>" + p2.character + "</em> dodges--");
                    this.log('player2', "self", turn_string, "<em>" + p2.character + "</em> dodges--");
                    this.log('player1', "self", null, "--only to be hit by <em>" + p1.character + "</em> for " + this.punch_power('player1') + " damage.");
                    this.log('player2', "opp",  null, "--only to be hit by <em>" + p1.character + "</em> for " + this.punch_power('player1') + " damage.");

                    p2.dodge_successful = false;
                    this.process_command('player1', { no_logging: true });

                    this.player2.messages.push("dodge failed");
                    this.player1.messages.push("opponent: dodge failed");
                }
                this.player1.windup = 0;
                this.next_turn();
                return;
            }

            if (c1 == 'dodge' && c2 == 'punch') {
                if (this.dodge_success('player1')) {
                    this.log('player2', "opp",  turn_string, "<em>" + p1.character + "</em> dodges--");
                    this.log('player1', "self", turn_string, "<em>" + p1.character + "</em> dodges--");
                    this.log('player2', "self", null, "--<em>" + p2.character + "</em> misses.");
                    this.log('player1', "opp",  null, "--<em>" + p2.character + "</em> misses.");

                    p1.dodge_successful = true;
                    this.player1.messages.push("dodge success!");
                    this.player2.messages.push("opponent: punch dodged");
                } else {
                    this.log('player2', "opp",  turn_string, "<em>" + p1.character + "</em> dodges--");
                    this.log('player1', "self", turn_string, "<em>" + p1.character + "</em> dodges--");
                    this.log('player2', "self", null, "--only to be hit by <em>" + p2.character + "</em> for " + this.punch_power('player2') + " damage.");
                    this.log('player1', "opp",  null, "--only to be hit by <em>" + p2.character + "</em> for " + this.punch_power('player2') + " damage.");

                    p1.dodge_successful = false;
                    this.process_command('player2', { no_logging: true });

                    this.player1.messages.push("dodge failed");
                    this.player1.messages.push("opponent: tried to dodge");
                }
                this.player2.windup = 0;
                this.next_turn();
                return;
            }
        }
        
        this.process_command('player1');
        this.process_command('player2', { no_timestamping: true });
        this.next_turn();
    }

    next_turn(player_what) {
        if (this.game.over) return;

        if (player_what) {
            this[player_what].timer_started = null;
            if (!this.game.shared_phase) {
                this[player_what].time++;

                if (this[player_what].time >= this.game.turns_this_phase) {
                    this.phase_complete(player_what);
                }

                if (this.check_win(player_what)) {
                    this.game.winner = player_what;
                    this.end_game();
                }
            }
        } else if (this.game.shared_phase) {
            this.game.shared_time++;
            this.player1.time = this.game.shared_time;
            this.player2.time = this.game.shared_time;
            this.player1.timer_started = null;
            this.player2.timer_started = null;
            if (this.game.shared_time >= this.game.turns_this_phase) {
                this.phase_complete();
            }

            let p1wins = this.check_win('player1');
            let p2wins = this.check_win('player2');

            if (p1wins || p2wins) {
                if (p1wins && p2wins) {
                    this.game.winner = null;
                    this.game.winners_tied = true;
                } else {
                    this.game.winner = p1wins ? 'player1' : 'player2';
                }
                this.end_game();
            }
        }
    }

    phase_complete(player_what) {
        if (this.game.shared_phase) {
            if (!this.game.shared_phase_complete) {
                this.global_log("phase complete.");
            }

            this.game.shared_time = this.game.turns_this_phase;
            this.game.shared_phase_complete = true;
            
            this.player1.time = this.game.turns_this_phase;
            this.player1.phase_complete = true;
            this.player2.time = this.game.turns_this_phase;
            this.player2.phase_complete = true;
        } else if (player_what) {
            this[player_what].time = this.game.turns_this_phase;
            this[player_what].phase_complete = true;
            this.log(player_what, null, null, "phase complete.");
        }
    }

    next_phase() {
        this.log('player1', "self", null, "selected location <em>" + this.player1.next_location + "</em>.");
        this.log('player2', "self", null, "selected location <em>" + this.player2.next_location + "</em>.");

        this.player1.time = 0;
        this.player2.time = 0;

        this.player1.windup = 0;
        this.player2.windup = 0;

        this.player1.phase_complete = false;
        this.player2.phase_complete = false;
        this.player1.location = this.player1.next_location;
        this.player2.location = this.player2.next_location;
        this.player1.next_location = null;
        this.player2.next_location = null;

        this.game.shared_phase = this.player1.location == this.player2.location;
        this.game.shared_time = 0;
        this.game.shared_phase_complete = false;
        this.game.turns_this_phase = this.game.shared_phase ? this.game.shared_phase_turns : this.game.solo_phase_turns;

        // escaped hold
        if (this.player1.overpowered) {
            this.player1.overpowered = false;
            this.player1.health = 1;
        }
        if (this.player2.overpowered) {
            this.player2.overpowered = false;
            this.player2.health = 1;
        }

        this.game.phase++;
        if (this.game.phase >= 3) this.game.phase = 0;

        this.global_log("<span class='phase-starter'><em>" + this.game.phases[this.game.phase] + "</em> phase begins.</span>");

        if (this.game.shared_phase) {
            this.global_log("<em>" + this.player1.character + "</em> meets <em>" + this.player2.character + "</em>.");
        }

        this.update();
    }

    check_win(player_what) {
        var player = this[player_what];

        if (player.job == "killer") {
            if (player.opponent_dead) return true;

            return false;
        }

        if (player.job == "spy") {
            if (player.info >= 3) return true;

            return false;
        }

        return false;
    }

    end_game() {
        this.game.over = true;

        this.global_log("<span class='phase-starter'>game ended.</span>");
        this.global_log(this[this.game.winner].character + " wins.");
    }
}

module.exports = Game;