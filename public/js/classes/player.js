class Player extends Thing {
    constructor(data) {
        super(data);

        this.imageButton.element.classList.add("character");

        this.effectsElement = this.createSideElement("effects");

        this.stats = {
            strength: {
                label: "STRENGTH",
                element: this.createStatElement("strength"),
                count: 0,
                icons_count: 3
            },
            windup: {
                label: "WINDUP",
                element: this.createStatElement("windup"),
                count: 0,
                max: 0,
                icons_count: 5
            },
            health: {
                label: "HEALTH",
                element: this.createStatElement("health"),
                count: 0,
                icons_count: 6
            },
            info: {
                label: "INFO (UNDELIVERED)",
                element: this.createSideElement("info"),
                count: 0,
                icons_count: 3
            },
            info_delivered: {
                label: "INFO (DELIVERED)",
                element: this.createSideElement("info-delivered"),
                count: 0,
                icons_count: 3
            }
        }

        for (let statName in this.stats) {
            let stat = this.stats[statName];
            stat.tooltip = attach_tooltip(stat.element, stat.label+": ?");
        }

        this.stats.windup.max = data.max_windup;

        this.updateStats(data);
    }

    createSideElement(className) {
        let element = document.createElement("div");
        element.className = "stat-container " + className;
        this.imageButton.sideElement.appendChild(element);
        return element;
    }

    createStatElement(className) {
        let element = document.createElement("div");
        element.className = "stat-container " + className;
        this.imageButton.overheadElement.appendChild(element);
        return element;
    }

    setStat(statName, count) {
        this.stats[statName].count = count;

        let element = this.stats[statName].element;

        while (element.lastElementChild) {
            element.lastElementChild.remove();
        }

        if (this.stats[statName].max) {
            for (let i=0; i<this.stats[statName].max; i++) {
                let icon = document.createElement("img");
                icon.src = "res/images/icons/"+statName+"/"+(i % this.stats[statName].icons_count + 1)+".png";
                element.appendChild(icon);
                if (i >= count) {
                    icon.classList.add("empty");
                }
            }
        } else {
            for (let i=0; i<count; i++) {
                let icon = document.createElement("img");
                icon.src = "res/images/icons/"+statName+"/"+(i % this.stats[statName].icons_count + 1)+".png";
                element.appendChild(icon);
            }
        }
    }

    updateStats(data) {
        if (this.previousStats) {
            let prev = this.previousStats;
            let curr = data;

            for (let statName in this.stats) {
                let difference = curr[statName] - prev[statName];

                if (difference > 0) {
                    for (let i=0; i<difference; i++) {
                        setTimeout(function() {
                            this.incrementStat(statName)
                        }.bind(this), (i * difference) * 100);
                    }
                } else if (difference < 0) {
                    let amount = -difference;
                    for (let i=0; i<amount; i++) {
                        setTimeout(function() {
                            this.decrementStat(statName)
                        }.bind(this), (i * amount) * 100);
                    }
                }
            }
        } else {
            for (let statName in this.stats) {
                this.setStat(statName, data[statName]);
            }
        }

        if (data.overpowered) {
            this.imageButton.element.classList.add("overpowered");
        } else {
            this.imageButton.element.classList.remove("overpowered");
        }

        if (data.dead) {
            this.imageButton.element.classList.add("ghost");
            this.imageButton.tooltip.className = "ghost";
            this.imageButton.nameElement.textContent = data.character + " (ghost)";
        } else if (this.imageButton.element.classList.contains("ghost")) {
            this.imageButton.element.classList.remove("ghost");
            this.imageButton.tooltip.className = null;
            this.imageButton.nameElement.textContent = data.character;
        }

        this.updateTooltips(data);

        while (this.effectsElement.lastElementChild) {
            this.effectsElement.lastElementChild.remove();
        }

        for (let effect of data.effects) {
            let div = document.createElement("div");
            div.className = effect.duration_unit;
            div.textContent = effect.remaining;

            attach_tooltip(div, "<em>"+effect.name+"</em>\n"+effect.modifiers_string+"\n"+effect.remaining+" "+effect.duration_unit+"(s) left");
            this.effectsElement.appendChild(div);
        }

        this.previousStats = data;
    }

    updateTooltips(data) {
        for (let statName in this.stats) {
            let stat = this.stats[statName];
            let v = data[statName];

            if (stat.max) v += "/"+stat.max;

            if (statName == 'strength') {
                let ratio = game.data.player.strength + "/" + (game.data.player.strength + data.strength);
                v = data.strength+"\nRATIO <i>(to opponent)</i>: "+ratio;
            }

            stat.tooltip.text = stat.label+": "+v;
        }
    }

    decrementStat(statName) {
        let element = this.stats[statName].element;

        if (this.stats[statName].max) {
            this.stats[statName].count--;
            if (this.stats[statName].count < 0) this.stats[statName].count = 0;

            for (let i=0; i<this.stats[statName].max; i++) {
                let icon = element.children[i];
                if (i >= this.stats[statName].count) {
                    icon.classList.add("empty");
                } else {
                    icon.classList.remove("empty");
                }
            }
        } else {
            if (this.stats[statName].count - 1 >= 0) {
                for (let i=this.stats[statName].count-1; i>=0; i--) {
                    let icon = element.children[i];
                    if (icon.classList.contains("decrement")) {
                        continue;
                    } else {
                        icon.classList.add("decrement");
                        icon.onanimationend = function() { this.remove() }
                        break;
                    }
                }
            }
    
            this.stats[statName].count--;
            if (this.stats[statName].count < 0) this.stats[statName].count = 0;   
        }
    }

    incrementStat(statName) {
        if (this.stats[statName].max) {
            let element = this.stats[statName].element;

            this.stats[statName].count++;
            if (this.stats[statName].count > this.stats[statName].max) this.stats[statName].count = this.stats[statName].max;

            for (let i=0; i<this.stats[statName].max; i++) {
                let icon = element.children[i];
                if (i >= this.stats[statName].count) {
                    icon.classList.add("empty");
                } else {
                    icon.classList.remove("empty");
                }
            }
        } else {
            let icon = document.createElement("img");

            let i = this.stats[statName].count % this.stats[statName].icons_count + 1;
            icon.src = "res/images/icons/"+statName+"/"+i+".png";

            this.stats[statName].element.appendChild(icon);
            this.stats[statName].count++;
        }
    }

    remove() {
        this.imageButton.element.remove();
    }
}

class PlayerSelector extends Player {
    constructor(name, data) {
        data.name = name;
        data.text = data.name;
        data.image = data.image;
        data.label = data.job;
        data.windup = 0;
        data.position = { x: random(20, 80), y: random(30, 60) }
        super(data);

        this.imageButton.setActions({
            inspect: function() {
                this.say(data.lines[Math.random() * data.lines.length | 0])
            }.bind(this),
            select: function() { game_command(name, 'select character', this) }
        });
    }
}

class You extends Player {
    constructor(data) {
        data.spacing_priority = true;
        data.name = "you";
        data.position = { x: 20, y: 30 };
        data.label = "you";
        data.text = data.character;
        data.actions = {
            "look in <em>p</em>ockets": {
                description: "<i>(free action)</i>",
                function: function() { look_in_pockets('self'); close_action_menu() }
            },
            "open <em>m</em>ap": {
                description: "end the phase early\n<i>(free action)</i>",
                function: function() {
                    toggle_map();
                    close_action_menu();
                }
            }
        };

        super(data);

        this.pocketButton = this.imageButton.actionsMenu.firstElementChild;
        this.mapButton = this.imageButton.actionsMenu.lastElementChild;
    }
}

class Opponent extends Player {
    constructor(data) {
        data.spacing_priority = true;

        var fightActions = {
            "wind up punch": {
                description: "+1 punch power",
                function: function() { game_command('opponent', 'windup', this) }
            },
            "punch": {
                description: "damages your opponent",
                function: function() {
                    game_command('opponent', 'punch', this);
                }
            },
            block: {
                description: "if hit:\n- halves damage <i>(rounded down)</i>\n- puts you on 1 WINDUP",
                function: function() { game_command('opponent', 'block', this) }
            },
            dodge: {
                description: (game.data.player.dodge_chance * 100) + "% chance of avoiding a hit",
                function: function() { game_command('opponent', 'dodge', this) }
            }
        }

        var playerOverpoweredActions = {
            struggle: {
                description: "chance <i>(depending on STRENGTH ratio)</i>\nof recovering +1 HEALTH",
                function: function() {
                    game_command('opponent', 'struggle', this);
                }
            }
        }

        var opponentOverpoweredActions = {
            question: {
                description: "+1 INFORMATION",
                function: function() { game_command('opponent', 'question', this) }
            },

            pickpocket: {
                description: "steal something\nor steal a glance <i>for free</i>",
                function: function() { look_in_pockets('opp'); close_action_menu() }
            }
        }

        data.name = "opponent";
        data.position = { x: 80, y: 60 };
        data.label = "opponent";
        data.text = data.character;
        data.actions = data.dead ? null : fightActions;
        super(data);

        this.fightActions = fightActions;
        this.playerOverpoweredActions = playerOverpoweredActions;
        this.opponentOverpoweredActions = opponentOverpoweredActions;
    }
}

class DeadPlayer extends Thing {
    constructor(data) {
        data.spacing_priority = true;
        data.actions = {
            pickpocket: {
                description: "steal something\nor steal a glance <i>for free</i>",
                function: function() { look_in_pockets('opp'); close_action_menu() }
            }
        };
        data.text = data.name;
        data.label = "corpse";

        super(data);
        
        var player_thing;

        if (game.player && game.data.player.player_what == data.player) {
            player_thing = game.player;
        } else if (game.opponent && game.data.opponent.player_what == data.player) {
            player_thing = game.opponent;
        }

        if (player_thing) {
            const position = player_thing.get_position();
            this.set_position(position);
            player_thing.set_position({
                x: position.x > 50 ? position.x - 5 : position.x + 5,
                y: position.y > 50 ? position.y - 5 : position.y + 5
            });
        }
    }
}