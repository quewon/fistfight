class Game {
    constructor(id, isCustom) {
        this.hidden = {
            locations: {
                "character selection": [
                    "character selection title"
                ],

                "battlefield": [
                ],
            },
            characters: {
                "bill": {
                    text: "bill",
                    lines: [
                        "not for the faint of heart",
                        "warning: WILL MURDER"
                    ],
                    job: "killer",
                    health: 5,
                    strength: 1,
                    max_windup: 3,
                    dodge_chance: .5,
                    home: [

                    ]
                },

                "jim beans": {
                    text: "jim beans",
                    lines: [
                        "professional sneaker",
                        "international super spy"
                    ],
                    job: "spy",
                    health: 5,
                    strength: 1,
                    max_windup: 3,
                    dodge_chance: .5,
                    home: [
                        
                    ]
                }
            }
        }
        this.game = {
            id: id,
            is_custom: isCustom || false,
            map: ['battlefield'],
            characters: ['bill', 'jim beans'],
            phase: 0,
            shared_phase: false,
            shared_time: 0,

            solo_phase_turns: 8,
            shared_phase_turns: 16,
            turns_this_phase: 8,
            shared_phase_timer: 30 //seconds
        }
        this.player1 = {
            opponent: null,
            id: null,
            location: null,
            character: null,
            time: 0,
            log: [],

            health: 0,
            strength: 0,
            windup: 0,
            opponent_info: 0
        }
        this.player2 = {
            opponent: null,
            id: null,
            location: null,
            character: null,
            time: 0,
            log: [],

            health: 0,
            strength: 0,
            windup: 0,
            opponent_info: 0
        }

        this.available_generic_locations = [];
        for (let i=1; i<=10; i++) {
            let name = "apt #" + i;
            this.available_generic_locations.push(name);
            this.hidden.locations[name] = [];
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
            turn = "";
            for (let i=0; i<this.game.turns_this_phase.toString().length + 2; i++) {
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
            players[playerId].game = this.game.id;
            players[playerId].player_what = 'player1';
            this.player2.opponent = playerId;
    
            return 'player1';
        } else if (!this.player2.id) {
            this.player2.id = playerId;
            players[playerId].game = this.game.id;
            players[playerId].player_what = 'player2';
            this.player1.opponent = playerId;
    
            return 'player2';
        }
        
        return false;
    }

    remove_player(playerId) {
        if (this.player1.id == playerId) {
            this.player1.id = null;
            players[playerId].game = null;
            players[playerId].player_what = null;
            this.player2.opponent = null;
    
            return 'player1';
        } else if (this.player2.id == playerId) {
            this.player2.id = null;
            players[playerId].game = null;
            players[playerId].player_what = null;
            this.player1.opponent = null;
    
            return 'player2';
        }
    
        return false;
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
            health: data.health,
            windup: data.windup,
            max_windup: data.max_windup,
            overpowered: data.overpowered,
            command: data.command
        }
    }

    dumb_data(player_what) {
        return {
            game: this.game,
            player: this[player_what],
            opponent: this.game.shared_phase ? this.opponent_data(player_what) : null,
            location: this[player_what].location ? this.hidden.locations[this[player_what].location] : this.hidden.locations['character selection'],
            characters: !this[player_what].character ? this.hidden.characters : null
        }
    }

    update(player_what) {
        if (this.player1.id && (!player_what || player_what == 'player1')) {
            io.to(this.player1.id).emit('game update', this.dumb_data('player1'));
        }
        if (this.player2.id && (!player_what || player_what == 'player2')) {
            io.to(this.player2.id).emit('game update', this.dumb_data('player2'));
        }
    }

    //

    set_character(player_what, character_name) {
        var player = this[player_what];
        var character = this.hidden.characters[character_name];
        for (let property in character) {
            player[property] = character[property];
        }
        player.character = character_name;

        // find home
        var location_name = this.available_generic_locations.splice(Math.random() * this.available_generic_locations.length | 0, 1);
        this.hidden.locations[location_name] = player.home;
        player.home = location_name;
        player.location = player.home;
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
                this.log(player_what, "phase-starter", null, "<em>morning</em> phase begins.");
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

        if (thing == 'opponent') {
            if (!player.overpowered) {
                if (command == 'question') {
                    player.opponent_info++;
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

            this.log(player_what, "self",  (this[player_what].time + 1)+"/"+this.game.turns_this_phase, "<em>" + this[player_what].character + "</em> is <em>overpowered</em>.");
            this.log(opponent_what, "opp", (this[player_what].time + 1)+"/"+this.game.turns_this_phase, "<em>" + this[player_what].character + "</em> is <em>overpowered</em>.");
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

        if (this.game.shared_phase_complete) {
            if (this.player1.command.command == 'select location' &&
                this.player2.command.command == 'select location'
            ) {
                this.process_command('player1');
                this.process_command('player2', { no_timestamping: true });
            }
            return;
        }
        
        if (this.player1.command.thing == 'opponent' && 
            this.player2.command.thing == 'opponent') {

            let c1 = this.player1.command.command;
            let c2 = this.player2.command.command;
            let p1 = this.player1;
            let p2 = this.player2;
            let turn = this.game.shared_time + 1;

            // punch v punch

            if (c1 == 'punch' && c2 == 'punch') {
                // let avg = ( this.punch_power('player1') + this.punch_power('player2') ) / 2;
                this.damage_player('player1', this.punch_power('player2'));
                this.damage_player('player2', this.punch_power('player1'));
                p1.windup = 0;
                p2.windup = 0;
                this.log('player1', "self", turn+"/"+this.game.turns_this_phase, "<em>" + p1.character + "</em> punches <em>" + p2.character + "</em>.");
                this.log('player2', "opp", turn+"/"+this.game.turns_this_phase,  "<em>" + p1.character + "</em> punches <em>" + p2.character + "</em>.");
                this.log('player1', "opp", null, "<em>" + p2.character + "</em> returns the favor.");
                this.log('player2', "self", null, "<em>" + p2.character + "</em> returns the favor.");

                if (p1.overpowered && p2.overpowered) {
                    this.phase_complete();
                } else {
                    
                }
                this.next_turn();
                return;
            }

            // punch v windup

            if (c1 == 'punch' && c2 == 'windup') {
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
                this.log('player1', "self", turn+"/"+this.game.turns_this_phase, "<em>" + p1.character + "</em> punches <em>" + p2.character + "</em>.");
                this.log('player2', "opp", turn+"/"+this.game.turns_this_phase,  "<em>" + p1.character + "</em> punches <em>" + p2.character + "</em>.");
                this.log('player1', "opp", null,  "<em>" + p2.character + "</em> fails to wind up.");
                this.log('player2', "self", null, "<em>" + p2.character + "</em> fails to wind up.");
                this.next_turn();
                return;
            }

            if (c1 == 'windup' && c2 == 'punch') {
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
                this.log('player2', "self", turn+"/"+this.game.turns_this_phase, "<em>" + p2.character + "</em> punches <em>" + p1.character + "</em>.");
                this.log('player1', "opp", turn+"/"+this.game.turns_this_phase, "<em>" + p2.character + "</em> punches <em>" + p1.character + "</em>.");
                this.log('player2', "opp",  null, "<em>" + p1.character + "</em> fails to wind up.");
                this.log('player1', "self", null, "<em>" + p1.character + "</em> fails to wind up.");
                this.next_turn();
                return;
            }

            // punch v block

            if (c1 == 'punch' && c2 == 'block') {
                let reduced = this.blocked_punch_power('player1');
                this.damage_player('player2', reduced);
                p1.windup = 0;
                p2.windup = 1;
                p2.messages.push("block successful -- damage halved");
                p1.messages.push("opponent: blocked punch");

                this.log('player1', "self", turn+"/"+this.game.turns_this_phase, "<em>" + p1.character + "</em> throws a punch--");
                this.log('player2', "opp",  turn+"/"+this.game.turns_this_phase, "<em>" + p1.character + "</em> throws a punch--");
                this.log('player1', "opp",  null, "--<em>" + p2.character + "</em> blocks it.");
                this.log('player2', "self", null, "--<em>" + p2.character + "</em> blocks it.");
                this.next_turn();
                return;
            }

            if (c1 == 'block' && c2 == 'punch') {
                let reduced = this.blocked_punch_power('player2');
                this.damage_player('player1', reduced);
                this.player1.windup = 1;
                this.player2.windup = 0;
                this.player1.messages.push("block successful -- damage halved");
                this.player2.messages.push("opponent: blocked punch");

                this.log('player2', "self", turn+"/"+this.game.turns_this_phase, "<em>" + p2.character + "</em> throws a punch--");
                this.log('player1', "opp",  turn+"/"+this.game.turns_this_phase, "<em>" + p2.character + "</em> throws a punch--");
                this.log('player2', "opp",  null, "--<em>" + p1.character + "</em> blocks it.");
                this.log('player1', "self", null, "--<em>" + p1.character + "</em> blocks it.");
                this.next_turn();
                return;
            }

            // punch v dodge

            if (c1 == 'punch' && c2 == 'dodge') {
                if (this.dodge_success('player2')) {
                    this.player2.messages.push("dodge success!");
                    this.player1.messages.push("opponent: punch dodged");

                    this.log('player1', "opp",  turn+"/"+this.game.turns_this_phase, "<em>" + p2.character + "</em> dodges--");
                    this.log('player2', "self", turn+"/"+this.game.turns_this_phase, "<em>" + p2.character + "</em> dodges--");
                    this.log('player1', "self", null, "--<em>" + p1.character + "</em> misses.");
                    this.log('player2', "opp",  null, "--<em>" + p1.character + "</em> misses.");
                } else {
                    this.process_command('player1', { no_logging: true });

                    this.player2.messages.push("dodge failed");
                    this.player1.messages.push("opponent: dodge failed");

                    this.log('player1', "opp",  turn+"/"+this.game.turns_this_phase, "<em>" + p2.character + "</em> dodges--");
                    this.log('player2', "self", turn+"/"+this.game.turns_this_phase, "<em>" + p2.character + "</em> dodges--");
                    this.log('player1', "self", null, "--only to be hit by <em>" + p1.character + "</em> for " + this.punch_power('player1') + " damage.");
                    this.log('player2', "opp",  null, "--only to be hit by <em>" + p1.character + "</em> for " + this.punch_power('player1') + " damage.");
                }
                this.player1.windup = 0;
                this.next_turn();
                return;
            }

            if (c1 == 'dodge' && c2 == 'punch') {
                if (this.dodge_success('player1')) {
                    this.player1.messages.push("dodge success!");
                    this.player2.messages.push("opponent: punch dodged");
                    
                    this.log('player2', "opp",  turn+"/"+this.game.turns_this_phase, "<em>" + p1.character + "</em> dodges--");
                    this.log('player1', "self", turn+"/"+this.game.turns_this_phase, "<em>" + p1.character + "</em> dodges--");
                    this.log('player2', "self", null, "--<em>" + p2.character + "</em> misses.");
                    this.log('player1', "opp",  null, "--<em>" + p2.character + "</em> misses.");
                } else {
                    this.process_command('player2', { no_logging: true });

                    this.player1.messages.push("dodge failed");
                    this.player1.messages.push("opponent: tried to dodge");

                    this.log('player2', "opp",  turn+"/"+this.game.turns_this_phase, "<em>" + p1.character + "</em> dodges--");
                    this.log('player1', "self", turn+"/"+this.game.turns_this_phase, "<em>" + p1.character + "</em> dodges--");
                    this.log('player2', "self", null, "--only to be hit by <em>" + p2.character + "</em> for " + this.punch_power('player2') + " damage.");
                    this.log('player1', "opp",  null, "--only to be hit by <em>" + p2.character + "</em> for " + this.punch_power('player2') + " damage.");
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
            this[player_what].time++;

            if (this[player_what].time >= this.game.turns_this_phase) {
                this.phase_complete(player_what);
            }

            if (this.check_win(player_what)) {
                this.game.winner = player_what;
                this.end_game();
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
                this.global_log("phase complete. select next location.");
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
            this.log(player_what, null, "phase complete. select next location.");
        }
    }

    next_phase() {
        this.log('player1', "self", (this.player1.time + 1) + "/" + this.game.turns_this_phase, "selected location <em>" + this.player1.next_location + "</em>.");
        this.log('player2', "self", (this.player1.time + 1) + "/" + this.game.turns_this_phase, "selected location <em>" + this.player2.next_location + "</em>.");

        this.player1.time = 0;
        this.player1.phase_complete = false;
        this.player1.location = this.player1.next_location;
        this.player1.next_location = null;
        this.player2.time = 0;
        this.player2.phase_complete = false;
        this.player2.location = this.player2.next_location;
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

        this.global_log("<span class='phase-starter'><em>" + ["morning", "afternoon", "night"][this.game.phase] + "</em> phase begins.</span>");

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
            if (player.opponent_info >= 3) return true;

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

//

const express = require('express')
const app = express()

// socket.io setup
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)

const port = process.env.PORT || 3000;

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/:id', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

server.listen(port, () => {
    console.log(`server listening on port ${port}`)
})

// game

const players = {}
const games = {
    test: new Game("test", true)
}

io.on('connection', (socket) => {
    console.log("user connected : " + socket.id);

    players[socket.id] = {
        game: null,
        player_what: null,

        matchmaking: false,
        match: null,
        match_confirmed: false
    }

    socket.on('disconnect', () => {
        console.log("user disconnected : " + socket.id);

        if (players[socket.id].game && games[players[socket.id].game]) {
            // currently in an online game

            var gameId = players[socket.id].game;
            var opponentId = games[gameId][players[socket.id].player_what].opponent;

            if (!opponentId) {
                if (gameId != "test") {
                    delete games[gameId];
                    console.log("game ended : " + gameId);
                } else {
                    games[gameId].remove_player(socket.id);
                }
            } else {
                games[gameId].remove_player(socket.id);
                io.to(opponentId).emit('player offline');
            }
        } else {
            if (players[socket.id].match) {
                var matchId = players[socket.id].match;
                io.to(matchId).emit('match cancelled');
            }
        }

        delete players[socket.id];
    })

    // matchmaking

    socket.on('look for match', () => {
        players[socket.id].matchmaking = true;
        players[socket.id].match = null;
        players[socket.id].match_confirmed = false;
        socket.emit('potential matches', players);
    })

    socket.on('stop matching', () => {
        players[socket.id].matchmaking = false;
    })

    socket.on('match found', (matchId) => {
        io.to(matchId).emit('create match', socket.id);
        socket.emit('create match', matchId);

        players[matchId].matchmaking = false;
        players[socket.id].matchmaking = false;
        players[matchId].match = socket.id;
        players[socket.id].match = matchId;
    })

    socket.on('confirm match', () => {
        var matchId = players[socket.id].match;

        players[socket.id].match_confirmed = true;
        if (players[matchId].match == socket.id && players[matchId].match_confirmed) {
            var gameId = unique_game_id(socket.id, matchId);
            games[gameId] = new Game(gameId);

            console.log("game started : " + gameId);

            socket.emit('game created', gameId);
            io.to(matchId).emit('game created', gameId);
        }
    })

    socket.on('cancel match', () => {
        var matchId = players[socket.id].match;

        if (matchId) {
            players[matchId].match = null;
            players[matchId].match_confirmed = false;
            io.to(matchId).emit('match cancelled');
        }

        players[socket.id].match = null;
        players[socket.id].match_confirmed = false;
    })

    // create game

    socket.on('create key', (key) => {
        if (games[key]) {
            socket.emit('key is in use');
        } else {
            games[key] = new Game(key, true);
            console.log("game started : " + key);
            socket.emit('game created', key);
        }
    })

    // join game

    socket.on('join game', (gameId) => {
        var game = games[gameId];
        if (game) {
            if (game.add_player(socket.id)) {
                console.log("user (" + socket.id + ") joined game : " + gameId);

                let player_what = players[socket.id].player_what;

                io.to(game[player_what].opponent).emit('player joined');
                game.update(player_what);
            } else {
                socket.emit('tried to join full game');
            }
        } else {
            socket.emit('tried to join nonexistent game');
        }
    })

    // game

    socket.on('game command', (data) => {
        var gameId = players[socket.id].game;
        var game = games[gameId];

        if (!game) return;
        
        var player_what = players[socket.id].player_what;

        if (!player_what) return;

        var player = game[player_what];
        var opponent = game[player_what == 'player1' ? 'player2' : 'player1'];

        player.command = data;

        if (game.game.shared_phase) {
            if (player.command && opponent.command) {
                game.process_simul_commands();

                delete player.command;
                delete opponent.command;
                
                if (game.player1.next_location && game.player2.next_location) {
                    game.next_phase();
                } else if (data.command != 'select location') {
                    game.update();
                }
            }
        } else {
            game.process_command(player_what);

            delete player.command;

            if (game.player1.next_location && game.player2.next_location) {
                game.next_phase();
            } else if (data.command != 'select location') {
                game.update(player_what);
            }
        }
    })

    socket.on('cancel game command', () => {
        var gameId = players[socket.id].game;
        var game = games[gameId];

        if (game) {
            var player_what = players[socket.id].player_what;
            var player = game[player_what];

            if (player.command && player.command.command == 'timed out') return;

            if (game.game.shared_phase) {
                delete player.command;
            } else {
                player.next_location = null;
            }
        }
    })

    socket.on('timer started', (date) => {
        var gameId = players[socket.id].game;
        var game = games[gameId];

        if (game) {
            var player_what = players[socket.id].player_what;
            var player = game[player_what];
            player.timer_started = date;
        }
    })
})

function unique_game_id(player1, player2) {
    var gameId = player1;
    if (games[gameId]) gameId = player2;
    while (games[gameId]) {
        gameId += "a";
    }
    return gameId;
}