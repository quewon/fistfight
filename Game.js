const dictionary = require('./dictionary')

class Game {
    constructor(server, id, isCustom) {
        this.server = server;
        this.thing_count = 0;

        this.npcs = [
            this.create_npc("chef"),
            this.create_npc("librarian")
        ];
        this.locations = {
            "character selection": [
                this.create_thing("character selection title")
            ],

            "lounge": [
                this.create_thing("gentlepeople's lounge title"),
                this.create_thing("no fighting sign"),
                // this.create_thing("lounge chair 1"),
                // this.create_thing("lounge chair 2"),
            ],

            "library": [
                this.create_thing("laptop"),
                this.create_thing("generic book"),
                this.create_thing("generic open book")
            ],

            "diner": [
                this.create_thing("knife"),
                this.create_thing("water and breadsticks"),
            ]
        }
        this.game = {
            id: id,
            is_custom: isCustom || false,
            phases: ["morning", "afternoon", "evening"],
            characters: ['bill', 'jim beans'],
            phase: 0,
            shared_phase: false,
            shared_time: 0,
            shared_encounters: 0,

            solo_phase_turns: 8,
            shared_phase_turns: 8,
            turns_this_phase: 8,
            shared_phase_timer: 60, //seconds
            // shared_phase_timer: -1
        }
        this.player1 = this.create_player();
        this.player2 = this.create_player();

        //

        this.game.map = Object.keys(this.locations);
        this.game.map.splice(this.game.map.indexOf('character selection'), 1);

        // generic locations

        var homes_needed = 2 + this.npcs.length + Math.random() * 10;
        var available_generic_locations = [];
        
        for (let i=1; i<=homes_needed; i++) {
            let name = "apt #" + i;
            available_generic_locations.push(name);
            this.locations[name] = [];
            this.game.map.push(name);
        }

        this.player1.assigned_generic_location = available_generic_locations.splice(Math.random() * available_generic_locations.length | 0, 1)[0];
        this.player2.assigned_generic_location = available_generic_locations.splice(Math.random() * available_generic_locations.length | 0, 1)[0];

        for (let npc of this.npcs) {
            var assigned_generic_location = available_generic_locations.splice(Math.random() * available_generic_locations.length | 0, 1)[0];
            for (let i=0; i<npc.schedule.length; i++) {
                if (npc.schedule[i] == "home") {
                    npc.schedule[i] = assigned_generic_location;
                }
            }
        }

        var generic_npcs = ['dude', 'guy', 'old man', 'girl', 'old woman'];
        for (let location_name of available_generic_locations) {
            let random_npc = generic_npcs[Math.random() * generic_npcs.length | 0];
            let npc = this.create_npc(random_npc);
            npc.schedule = [location_name];
            this.npcs.push(npc);
        }

        //
        
        this.update_npcs();

        this.global_log("game created with key <em>" + this.game.id + "</em>.");
        this.global_log("<span class='phase-starter'><em>character selection</em> phase begins.</span>");

        // debug scenario
        if (this.game.id == "test") {
            this.set_character('player1', 'jim beans');
            this.set_character('player2', 'bill');
            this.player1.location = 'diner';
            this.player2.location = 'diner';
            this.player2.health = 0;
            this.player2.overpowered = true;
            this.player1.info = 3;
            this.game.shared_phase = true;
        }
    }

    create_player() {
        return {
            opponent: null,
            id: null,
            location: null,
            character: null,
            time: 0,
            log: [],
            messages: [],
            things: [],
            effects: [],

            info: 0,
            info_delivered: 0,
            opponent_dead: false,

            windup: 0,
            health: 0,
            strength: 0
        }
    }

    create_thing(name) {
        var thing = JSON.parse(JSON.stringify(dictionary.things[name]));
        thing.name = name;
        thing.id = this.thing_count++;
        return thing;
    }

    create_npc(name) {
        var npc = JSON.parse(JSON.stringify(dictionary.npcs[name]));
        npc.id = this.thing_count++;
        return npc;
    }

    update_npcs() {
        var phase = this.game.phase;
        for (let npc of this.npcs) {
            npc.location = npc.schedule[phase % npc.schedule.length];
        }
    }

    update_player_effects(player_what) {
        var player = this[player_what];
        for (let i=player.effects.length-1; i>=0; i--) {
            var effect = player.effects[i];
            effect.elapsed_turns++;
            if (effect.duration_unit == 'phase') {
                if (this.game.phase - effect.created_phase >= effect.duration) {
                    player.effects.splice(i, 1);
                }
            } else if (effect.duration_unit == 'turn') {
                if (effect.elapsed_turns >= effect.duration) {
                    player.effects.splice(i, 1);
                }
            }   
        }
    }

    update_players() {
        this.update_player_effects('player1');
        this.update_player_effects('player2');
    }

    get_npcs_in_location(location) {
        var npcs = [];

        for (let npc of this.npcs) {
            if (npc.location == location) {
                npcs.push(npc);
            }
        }

        return npcs;
    }

    global_log(message) {
        this.player1.log.push(message);
        this.player2.log.push(message);
    }

    log(player_what, class_name, turn, message) {
        if (this[player_what].dead) return;

        let opponent_what = player_what == 'player1' ? 'player2' : 'player1';
        let opp = this[opponent_what];
        
        if (turn) {
            this[player_what].log.push("<span class='has-turn-info "+class_name+"'><span>[turn " + turn + "]</span><span>" + message + "</span>");
            if (opp.dead) opp.log.push("<span class='has-turn-info opp "+class_name+"'><span>[turn " + turn + "]</span><span>" + message + "</span>");
        } else if (class_name == "self" || class_name == "opp") {
            let whitespaces = this.game.turns_this_phase.toString().length + 1 + (turn ? turn.toString().length : (this[player_what].time + 1).toString().length);
            turn = "";
            for (let i=0; i<whitespaces; i++) {
                turn += " ";
            }
            this[player_what].log.push("<span class='has-turn-info "+class_name+"'><span>      " + turn + " </span><span>" + message + "</span>");
            if (opp.dead) opp.log.push("<span class='has-turn-info opp "+class_name+"'><span>      " + turn + " </span><span>" + message + "</span>");
        } else {
            this[player_what].log.push("<span class='"+class_name+"'>" + message + "</span>");
            if (opp.dead) opp.log.push("<span class='opp "+class_name+"'>" + message + "</span>");
        }
    }

    msg(player_what, message) {
        if (this[player_what].dead) return;

        this[player_what].messages.push(message);
        let opponent_what = player_what == 'player1' ? 'player2' : 'player1';
        let opp = this[opponent_what];
        if (opp.dead) opp.messages.push(message);
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

    opponent_data(player_what) {
        var opponent_what = player_what == 'player1' ? 'player2' : 'player1';
        var data = this.player_data(opponent_what);
        
        if (this.game.shared_phase) {
            return {
                character: data.character,
                image: data.image,
                
                item_capacity: data.item_capacity,
                strength: data.strength,
                health: data.health,
                windup: data.windup,
                max_windup: data.max_windup,
                command: data.command,
                things: data.things,

                overpowered: data.overpowered,
                dodge_successful: data.dodge_successful,
                dead: data.dead
            }
        } else {
            return {
                things: [],
                item_capacity: data.item_capacity
            }
        }
    }

    player_data(player_what) {
        var player = this[player_what];
        var data = {};

        for (let p in player) {
            data[p] = player[p];
        }

        for (let effect of player.effects) {
            for (let modifier of effect.modifiers) {
                data[modifier.property] += modifier.value;
            }
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
            opponent: this.opponent_data(player_what),
            location: this.locations[this[player_what].location || 'character selection'],
            npcs: this.get_npcs_in_location(this[player_what].location),
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
        var location_name = player.assigned_generic_location;
        this.locations[location_name] = [];
        for (let thing_name of character.home) {
            this.locations[location_name].push(this.create_thing(thing_name));
        }

        player.home = location_name;
        player.location = location_name;
    }

    get_thing_by_id(from, thing_id) {
        for (let thing of from) {
            if (thing.id == thing_id) return thing;
        }
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

    steal_thing(player_what, thing_id) {
        var opponent_what = player_what == 'player1' ? 'player2' : 'player1';
        var opponent = this[opponent_what];

        var thing;
        var thing_index = -1;
        for (let i=0; i<opponent.things.length; i++) {
            if (opponent.things[i].id == thing_id) {
                thing_index = i;
                thing = opponent.things[i];
                break;
            }
        }

        if (thing && thing.portable) {
            opponent.things.splice(thing_index, 1);
            this[player_what].things.push(thing);
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

    talk_to_npc(player_what, npc_id) {
        let player = this[player_what];
        let location = player.location;
        for (let npc of this.get_npcs_in_location(location)) {
            if (npc.id == npc_id) {
                let dialogue = npc.dialogue.shift();
                npc.dialogue.push(dialogue);

                if (this.game.shared_phase) {
                    let message = npc_id + ": <i>(to <em>" + player.character + "</em>)</i> " + dialogue;

                    let opponent_what = player_what == 'player1' ? 'player2' : 'player1';
                    this.msg(opponent_what, message);
                    this.msg(player_what, message);
                } else {
                    this.msg(player_what, npc_id + ": " + dialogue);
                }

                return npc;
            }
        }
        return false;
    }

    check_tag_in_vicinity(player_what, tag) {
        for (let thing of this[player_what].things) {
            if (thing.tags && thing.tags.includes(tag)) {
                return true;
            }
        }
        for (let thing of this.locations[this[player_what].location]) {
            if (thing.tags && thing.tags.includes(tag)) {
                return true;
            }
        }
        return false;
    }

    check_tag_reachable(player_what, tag) {
        for (let thing of this[player_what].things) {
            if (thing.tags && thing.tags.includes(tag)) {
                return true;
            }
        }
        for (let location in this.locations) {
            for (let thing of this.locations[location]) {
                if (thing.tags && thing.tags.includes(tag)) {
                    return true;
                }
            }
        }
        return false;
    }

    check_thing_in_vicinity(player_what, thing_id) {
        var player = this[player_what];
        for (let thing of player.things) {
            if (thing.id == thing_id) {
                return thing;
            }
        }
        for (let thing of this.locations[player.location]) {
            if (thing.id == thing_id) {
                return thing;
            }
        }
        return false;
    }

    consume_thing(player_what, thing_id) {
        var player = this[player_what];

        for (let i=0; i<player.things.length; i++) {
            if (player.things[i].id == thing_id) {
                var thing = player.things[i];
                player.things.splice(i, 1);
                return thing;
            }
        }

        var location = this.locations[player.location];
        
        for (let i=0; i<location.length; i++) {
            if (location[i].id == thing_id) {
                var thing = location[i];
                location.splice(i, 1);
                return thing;
            }
        }
        
        return null;
    }

    create_effect(player_what, effect) {
        effect.creation_phase = this.game.phase;
        effect.elapsed_turns = 0;
        effect.modifiers = effect.modifiers || [];

        this[player_what].effects.push(effect);
        this.msg(player_what, "<em>" + effect.name + "</em> in effect for " + effect.duration + " " + effect.duration_unit + "(s)");
        return effect;
    }

    process_command(player_what, conditions) {
        if (this.game.over) return;

        if (!this.game.shared_phase) {
            this[player_what].messages = [];
        }

        conditions = conditions || {};

        var player = this[player_what];
        var opponent_what = player_what == 'player1' ? 'player2' : 'player1';
        var opponent = this[opponent_what];

        if (player.dead) {
            player.location = opponent.location;
            player.next_location = opponent.next_location;
            return;
        }

        var thing = player.command.thing;
        var command = player.command.command;

        if (command == 'select location') {
            player.next_location = thing;
            return;
        }

        if (player.phase_complete) return;

        if (!player.character) {
            if (command == 'select character') {
                this.set_character(player_what, thing);
                this.log(player_what, "self", null, "selected <em>" + thing + "</em>.");
                this.log(player_what, "phase-starter", null, "<em>" + this.game.phases[0] + "</em> phase begins.");
            }
            return;
        }

        var turn = conditions.no_timestamping ? null : (player.time + 1) + "/" + this.game.turns_this_phase;

        if (command == 'timed out') {
            this.log(player_what, "self", turn, "<em>" + player.character + "</em> waits</em>.");
            this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> waits</em>.");
            this.next_turn(player_what);
            return;
        }

        // opponent

        if (thing == 'opponent') {
            if (!player.overpowered) {
                if (opponent.overpowered) {
                    if (command == 'question') {
                        if (opponent.dead) {
                            this.log(player_what, "self", turn, "<em>" + player.character + "</em> tries to question <em>" + opponent.character + "</em>'s corpse.");
                            this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> tries to question <em>" + opponent.character + "</em>'s corpse.");
                        } else {
                            player.info++;
                            this.log(player_what, "self", turn, "<em>" + player.character + "</em> questions <em>" + opponent.character + "</em>.");
                            this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> questions <em>" + opponent.character + "</em>.");
                        }
                        this.next_turn(player_what);
                        return;
                    }

                    return;
                }

                if (command == 'punch') {
                    if (opponent.health <= 0) {
                        this.msg(player_what, "opponent already overpowered");
                        this.log(player_what, "self", turn, "<em>" + player.character + "</em> attempts to punch <em>" + opponent.character + "</em>.");
                        this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> attempts to punch <em>" + opponent.character + "</em>.");
                    } else {
                        let pp = this.punch_power(player_what);
                        this.damage_player(opponent_what, pp);
                        // if (opponent.windup > 0) {
                        //     opponent.messages.push("self: got hit -- windups lost");
                        // }
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
                        this.msg(player_what, "overwound");
                    }
                    this.log(player_what, "self", turn, "<em>" + player.character + "</em> winds up.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> winds up.");
                    this.next_turn(player_what);
                    return;
                }
    
                if (command == 'block') {
                    // player.windup = 1;
                    this.msg(player_what, "blocked air -- no windup");
                    this.log(player_what, "self", turn, "<em>" + player.character + "</em> blocks nothing.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> blocks nothing.");
                    this.next_turn(player_what);
                    return;
                }
    
                if (command == 'dodge') {
                    player.dodge_successful = true;
                    this.msg(player_what, "dodged air");
                    this.log(player_what, "self", turn, "<em>" + player.character + "</em> dodges nothing.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> dodges nothing.");
                    this.next_turn(player_what);
                    return;
                }
            }

            if (player.overpowered) {
                if (command == 'struggle') {
                    if (this.struggle_success(player_what)) {
                        this.recover_player(player_what);
                        this.msg(player_what, "ESCAPED HOLD");
                        this.msg(opponent_what, "OPPONENT ESCAPES HOLD");
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

        if (player.overpowered) return;

        // things

        if (command == 'take') {
            if (player.things.length >= player.item_capacity) {
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> tries to take <em>" + taken_thing.name + "</em> with full pockets.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> tries to take <em>" + taken_thing.name + "</em> with full pockets.");
                } else {
                    this.log(player_what, "self", turn, "tried to take something at full pocket capacity.");
                }

                this.next_turn(player_what);
                return;
            }

            var taken_thing = this.take_thing(player_what, thing);
            if (taken_thing) {
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> pockets <em>" + taken_thing.name + "</em>.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> pockets <em>" + taken_thing.name + "</em>.");
                } else {
                    this.log(player_what, "self", turn, "took <em>" + taken_thing.name + "</em>.");
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
            return;
        }

        if (command == 'steal') {
            var taken_thing = this.steal_thing(player_what, thing);
            if (taken_thing) {
                this.log(player_what,  "self", turn, "<em>" + player.character + "</em> steals <em>" + taken_thing.name + "</em> from <em>" + opponent.character + "</em>.");
                this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> steals <em>" + taken_thing.name + "</em> from <em>" + opponent.character + "</em>.");
                this.msg(opponent_what, "<em>" + taken_thing.name + "</em> got stolen!");
            } else {
                this.log(player_what,  "self", turn, "<em>" + player.character + "</em> tried to steal something that isn't there.");
                this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> tried to steal something that isn't there.");
            }
            this.next_turn(player_what);
            return;
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
            return;
        }

        if (command == 'transmit') {
            var thing_used = this.check_thing_in_vicinity(player_what, thing);
            if (thing_used && (!thing_used.tags || !thing_used.tags.includes("internet-connected"))) thing_used = null;

            if (thing_used) {
                if (player.job == "spy") {
                    if (player.info == 0) {
                        this.msg(player_what, thing + ": this office does not take social calls.");
                        if (this.game.shared_phase) {
                            this.log(player_what,  "self", turn, "<em>" + player.character + "</em> tries to transmit info, but has none.");
                            this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> tries to transmit info, but has none.");
                        } else {
                            this.log(player_what, "self", turn, "tried to transmit info you don't have.");
                        }
                    } else {
                        player.info_delivered += player.info;
                        player.info = 0;

                        this.msg(player_what, thing + ": good work!");

                        if (this.game.shared_phase) {
                            this.log(player_what,  "self", turn, "<em>" + player.character + "</em> transmits info.");
                            this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> transmits info.");
                        } else {
                            this.log(player_what, "self", turn, "info transmitted.");
                        }
                    }
                } else {
                    this.msg(player_what, thing + ": stick to your mission.");
                    if (this.game.shared_phase) {
                        this.log(player_what,  "self", turn, "<em>" + player.character + "</em> fails to transmit info -- not a spy.");
                        this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> fails to transmit info -- not a spy.");
                    } else {
                        this.log(player_what, "self", turn, "failed to transmit info -- not a spy.");
                    }
                }
            } else {
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> fails to transmit info -- no device found.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> fails to transmit info -- no device found.");
                } else {
                    this.log(player_what, "self", turn, "failed to transmit info -- device not found.");
                }
            }
 
            this.next_turn(player_what);
            return;
        }

        if (command == 'eat') {
            var thing_eaten = this.check_thing_in_vicinity(player_what, thing);
            if (thing_eaten && !thing_eaten.tags.includes("food")) thing_eaten = null;

            if (thing_eaten) {
                this.consume_thing(player_what, thing);
                this.create_effect(player_what, {
                    name: thing_eaten.name,
                    duration_unit: 'phase',
                    duration: 3,
                    modifiers: [{
                        property: 'strength',
                        value: 1
                    }]
                });
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> eats <em>" + thing_eaten.name + "</em>.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> eats <em>" + thing_eaten.name + "</em>.");
                } else {
                    this.log(player_what, "self", turn, "ate <em>" + thing_eaten.name + "</em>.");
                }
            } else {
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> must be hungry.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> must be hungry.");
                } else {
                    this.log(player_what, "self", turn, "dreamed up some food.");
                }
            }

            this.next_turn(player_what);
            return;
        }

        if (command == 'kill') {
            var weapon = this.check_thing_in_vicinity(player_what, thing);

            if (weapon) {
                if (!this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "tested the feel of <em>" + weapon.name + "</em>.");
                } else if (!opponent.overpowered) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> tries to use <em>" + weapon.name + "</em>, but <em>" + opponent.character + "</em> isn't overpowered.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> tries to use <em>" + weapon.name + "</em>, but <em>" + opponent.character + "</em> isn't overpowered.");
                } else if (opponent.dead) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> tries to use <em>" + weapon.name + "</em>, but <em>" + opponent.character + "</em> is already dead.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> tries to use <em>" + weapon.name + "</em>, but <em>" + opponent.character + "</em> is already dead.");
                } else {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> kills <em>" + opponent.character + "</em>.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> kills <em>" + opponent.character + "</em>.");
                    opponent.dead = true;
                }
            } else {
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> lusts for <em>" + opponent.character + "</em>'s blood.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> lusts for <em>" + opponent.character + "</em>'s blood.");
                } else {
                    this.log(player_what,  "self", turn, "</em> lusted for <em>" + opponent.character + "</em>'s blood.");
                }
            }
            this.next_turn(player_what);
            return;
        }

        // npcs

        if (command == 'talk') {
            var npc = this.talk_to_npc(player_what, thing);
            if (npc) {
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> talks to <em>" + npc.name + "</em>.");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> talks to <em>" + npc.name + "</em>.");
                } else {
                    this.log(player_what, "self", turn, "talked to <em>" + npc.name + "</em>.");
                }
            } else {
                if (this.game.shared_phase) {
                    this.log(player_what,  "self", turn, "<em>" + player.character + "</em> tries to talk to someone...?");
                    this.log(opponent_what, "opp", turn, "<em>" + player.character + "</em> tries to talk to someone...?");
                } else {
                    this.log(player_what, "self", turn, "tried to talk to someone...?");
                }
            }
            this.next_turn(player_what);
            return;
        }
    }

    punch_power(player_what) {
        var p = this.player_data(player_what);
        return p.strength + p.windup;
    }

    blocked_punch_power(player_what) {
        var pp = this.punch_power(player_what);
        return Math.floor(pp/2);
    }

    damage_player(player_what, amount) {
        this[player_what].health -= amount;
        if (this[player_what].health <= 0) {
            this[player_what].health = 0;
            this[player_what].overpowered_this_turn = true;
            this.msg(player_what, "OVERPOWERED");

            var opponent_what = player_what == 'player1' ? 'player2' : 'player1';
            this.msg(opponent_what, "OPPONENT DOWN");

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

    recover_player(player_what) {
        if (this[player_what].dead) return;
        this[player_what].overpowered = false;
        this[player_what].health = 1;
        this[player_what].windup = 0;
    }
    
    process_simul_commands() {
        if (this.game.over) return;

        this.player1.messages = [];
        this.player2.messages = [];

        if (this.player1.dead || this.player2.dead) {
            this.player1.command = this.player1.command || {
                command: 'spectate',
                thing: null
            }
            this.player2.command = this.player2.command || {
                command: 'spectate',
                thing: null
            }
            this.process_command('player1');
            this.process_command('player2');
            this.next_turn();
            return;
        }

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

        // commands that use a portable thing
        var incompatible_commands = ['eat', 'take', 'transmit', 'kill'];

        if (incompatible_commands.includes(c1) && incompatible_commands.includes(c2) &&
            p1.command.thing == p2.command.thing) {
            var thing = this.get_thing_by_id(this.locations[p1.location], p1.command.thing);
            var thing_name = thing ? thing.name : "?";
            this.log('player1', "self", turn_string, "<em>" + p1.character + "</em> reaches for <em>" + thing_name + "</em>...");
            this.log('player2',  "opp", turn_string, "<em>" + p1.character + "</em> reaches for <em>" + thing_name + "</em>...");
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

                if (p1.overpowered_this_turn && p2.overpowered_this_turn) {
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
                    // p2.messages.push("self: got hit -- windups lost");
                    // p1.messages.push("opp: got hit -- windups lost");
                } else {
                    // p2.messages.push("self: got hit -- windup failed");
                    // p1.messages.push("opp: got hit -- windup failed");
                }
                if (p1.overpowered_this_turn && p2.overpowered_this_turn) {
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
                    // p1.messages.push("self: got hit -- windups lost");
                    // p2.messages.push("opp: got hit -- windups lost");
                } else {
                    // p1.messages.push("self: got hit -- windup failed");
                    // p2.messages.push("opp: got hit -- windup failed");
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
                this.msg('player2', "block successful -- damage halved");
                // p1.messages.push("opp: blocked punch");

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
                this.msg('player1', "block successful -- damage halved");
                // this.player2.messages.push("opp: blocked punch");

                this.next_turn();
                return;
            }

            // punch v dodge

            if (c1 == 'punch' && c2 == 'dodge') {
                this.log('player1', "opp",  turn_string, "<em>" + p2.character + "</em> moves to dodge--");
                this.log('player2', "self", turn_string, "<em>" + p2.character + "</em> moves to dodge--");
                
                if (this.dodge_success('player2')) {
                    this.log('player1', "self", null, "--<em>" + p1.character + "</em> misses.");
                    this.log('player2', "opp",  null, "--<em>" + p1.character + "</em> misses.");
                    
                    p2.dodge_successful = true;
                    this.msg('player2', "dodge success!");
                    // this.player1.messages.push("opp: punch dodged");
                } else {
                    this.log('player1', "self", null, "--only to be hit by <em>" + p1.character + "</em> for " + this.punch_power('player1') + " damage.");
                    this.log('player2', "opp",  null, "--only to be hit by <em>" + p1.character + "</em> for " + this.punch_power('player1') + " damage.");

                    p2.dodge_successful = false;
                    this.process_command('player1', { no_logging: true });

                    this.msg('player2', "dodge failed");
                    // this.player1.messages.push("opp: dodge failed");
                }
                this.player1.windup = 0;
                this.next_turn();
                return;
            }

            if (c1 == 'dodge' && c2 == 'punch') {
                this.log('player2', "opp",  turn_string, "<em>" + p1.character + "</em> moves to dodge--");
                this.log('player1', "self", turn_string, "<em>" + p1.character + "</em> moves to dodge--");

                if (this.dodge_success('player1')) {
                    this.log('player2', "self", null, "--<em>" + p2.character + "</em> misses.");
                    this.log('player1', "opp",  null, "--<em>" + p2.character + "</em> misses.");

                    p1.dodge_successful = true;
                    this.msg('player1', "dodge success!");
                    // this.player2.messages.push("opp: punch dodged");
                } else {
                    this.log('player2', "self", null, "--only to be hit by <em>" + p2.character + "</em> for " + this.punch_power('player2') + " damage.");
                    this.log('player1', "opp",  null, "--only to be hit by <em>" + p2.character + "</em> for " + this.punch_power('player2') + " damage.");

                    p1.dodge_successful = false;
                    this.process_command('player2', { no_logging: true });

                    this.msg('player1', "dodge failed");
                    // this.player1.messages.push("opp: tried to dodge");
                }
                this.player2.windup = 0;
                this.next_turn();
                return;
            }
        }

        // struggle v anything

        if (p1.overpowered && c1 == 'struggle') {
            this.process_command('player2');
            if (!p1.dead) {
                if (this.struggle_success('player1')) {
                    this.recover_player('player1');
                    this.msg('player1', "ESCAPED HOLD");
                    this.msg('player2', "OPPONENT ESCAPED HOLD");
                    this.log('player1', "self", null, "<em>" + p1.character + "</em> struggles free.");
                    this.log('player2',  "opp", null, "<em>" + p1.character + "</em> struggles free.");
                } else {
                    this.log('player1', "self", null, "<em>" + p1.character + "</em> struggles.");
                    this.log('player2',  "opp", null, "<em>" + p1.character + "</em> struggles.");
                }
            }
            this.next_turn();
            return;
        }

        if (p2.overpowered && c2 == 'struggle') {
            this.process_command('player1');
            if (!p2.dead) {
                if (this.struggle_success('player2')) {
                    this.recover_player('player2');
                    this.msg('player2', "ESCAPED HOLD");
                    this.msg('player1', "OPPONENT ESCAPED HOLD");
                    this.log('player2', "self", null, "<em>" + p2.character + "</em> struggles free.");
                    this.log('player1',  "opp", null, "<em>" + p2.character + "</em> struggles free.");
                } else {
                    this.log('player2', "self", null, "<em>" + p2.character + "</em> struggles.");
                    this.log('player1',  "opp", null, "<em>" + p2.character + "</em> struggles.");
                }
            }
            this.next_turn();
            return;
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

            if (this.player1.overpowered_this_turn) {
                this.player1.overpowered = true;
                this.player1.overpowered_this_turn = false;
            }
            if (this.player2.overpowered_this_turn) {
                this.player2.overpowered = true;
                this.player2.overpowered_this_turn = false;
            }

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
            } else {
                // both are dead, none have won
                if (this.player1.dead && this.player2.dead) {
                    this.end_game();
                    return;
                }
                
                // one is dead
                if (
                    this.player1.dead && !this.player2.dead ||
                    this.player2.dead && !this.player1.dead
                ) {
                    let living_what = this.player1.dead ? 'player2' : 'player1';
                    var living_player = this[living_what];
                    
                    if (
                        living_player.job == 'spy' && living_player.info > 0
                        && living_player.info + living_player.info_delivered >= living_player.info_goal
                        // && this.check_tag_reachable(living_what, "internet-connected")
                    ) {
                        // player could win
                    } else {
                        this.end_game();
                        return;
                    }
                }
            }
        }
    }

    dialogue(player_what, key) {
        let array = this[player_what].dialogue[key];
        let first_line = array.shift();
        array.push(first_line);
        return first_line;
    }

    share_dialogue(key) {
        if (this.player1.dead || this.player2.dead) return;

        let d1 = this.dialogue('player1', key);
        let d2 = this.dialogue('player2', key);

        this.msg('player1', "self: " + d1);
        this.msg('player1',  "opp: " + d2);
        this.msg('player2',  "opp: " + d1);
        this.msg('player2', "self: " + d2);
    }

    monologue(player_what, key) {
        this.msg(player_what, "self: " + this.dialogue(player_what, key));
    }

    phase_complete(player_what) {
        if (this.game.shared_phase) {
            if (!this.game.shared_phase_complete) {
                this.player1.messages = [];
                this.player2.messages = [];

                this.global_log("fight adjourned.");
                this.share_dialogue('fight adjourned');
                this.msg('player1', "FIGHT ADJOURNED");
                this.msg('player2', "FIGHT ADJOURNED");
                this.msg('player1', "pick next location!");
                this.msg('player2', "pick next location!");
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
            this.msg(player_what, "PHASE COMPLETE");
            this.msg(player_what, "pick next location!");
        }
    }

    next_phase() {
        this.player1.messages = [];
        this.player2.messages = [];

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

        if (this.player1.overpowered) {
            this.recover_player('player1');
        }
        if (this.player2.overpowered) {
            this.recover_player('player2');
        }

        this.game.phase++;
        if (this.game.phase >= 3) this.game.phase = 0;

        this.global_log("<span class='phase-starter'><em>" + this.game.phases[this.game.phase] + "</em> phase begins.</span>");

        if (this.game.shared_phase) {
            this.global_log("<em>" + this.player1.character + "</em> meets <em>" + this.player2.character + "</em>.");
            if (this.game.shared_encounters == 0) {
                this.share_dialogue('initial encounter');
            } else {
                this.share_dialogue('repeated encounter');
            }
            this.game.shared_encounters++;
        }

        this.update_npcs();
        this.update_players();

        this.update();
    }

    check_win(player_what) {
        var player = this[player_what];
        var opponent_what = player_what == 'player1' ? 'player2' : 'player1';
        var opponent = this[opponent_what];

        if (player.job == "killer") {
            return opponent.dead;
        }

        if (player.job == "spy") {
            return player.info_delivered >= player.info_goal;
        }

        return false;
    }

    end_game() {
        this.game.over = true;

        this.global_log("<span class='phase-starter'>game ended.</span>");

        if (this.game.winner) {
            this.global_log(this[this.game.winner].character + " wins.");
        } else if (this.game.winners_tied) {
            this.global_log("both players win.");
        } else {
            this.global_log("no winners.");
        }
        
        if (this.game.shared_phase) {
            if (this.game.winner) {
                let line = this.dialogue(this.game.winner, 'win');
                let opponent_what = this.game.winner == 'player1' ? 'player2' : 'player1';
                this.msg(this.game.winner, "self: " + line);
                this.msg(opponent_what, "opp: " + line);  
            }
            
            if (this.game.winners_tied) {
                let l1 = this.dialogue('player1', 'win');
                let l2 = this.dialogue('player2', 'win');
                this.msg('player1', "self: " + l1);
                this.msg('player2',  "opp: " + l1);
                this.msg('player1',  "opp: " + l2);
                this.msg('player2', "self: " + l2);
            }
        } else {
            if (this.game.winner) {
                this.monologue(this.game.winner, 'win');
            }

            if (this.game.winners_tied) {
                this.monologue('player1', 'win');
                this.monologue('player2', 'win');
            }
        }

        this.msg('player1', "GAME OVER, GO HOME EVERYBODY!!");
        this.msg('player2', "GAME OVER, GO HOME EVERYBODY!!");
    }
}

module.exports = Game;