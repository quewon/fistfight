class Player extends Thing {
    constructor(data) {
        super(data);

        this.statsElement = document.createElement("div");
        this.statsElement.className = "stats";
        this.imageButton.overheadElement.appendChild(this.statsElement);
        this.imageButton.element.classList.add("character");

        this.stats = {
            strength: {
                element: this.createStatElement("strength"),
                count: 0,
                icons_count: 3
            },
            windup: {
                element: this.createStatElement("windup"),
                count: 0,
                max: 0,
                icons_count: 5
            },
            health: {
                element: this.createStatElement("health"),
                count: 0,
                icons_count: 6
            }
        }

        this.stats.windup.max = data.max_windup;
        this.strengthTooltip = attach_tooltip(this.stats.strength.element, "STRENGTH: ?");

        this.updateStats(data);
    }

    createStatElement(className) {
        let element = document.createElement("div");
        element.className = className;
        this.statsElement.appendChild(element);
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
        } else {
            this.imageButton.element.classList.remove("ghost");
        }

        this.updateStrengthTooltip(data);

        this.previousStats = data;
    }

    updateStrengthTooltip(data) {
        this.strengthTooltip.text = "STRENGTH: "+data.strength;
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
        data.position = { x: random(10, 90) + "%", y: random(45, 80)+"%" };
        data.text = data.name;
        data.image = data.image;
        data.label = data.job;
        data.windup = 0;
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
        data.name = "you";
        data.position = { x: "20%", y: "30%" };
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
        data.position = { x: "80%", y: "60%" };
        data.label = "opponent";
        data.text = data.character;
        data.actions = data.dead ? null : fightActions;
        super(data);

        this.fightActions = fightActions;
        this.playerOverpoweredActions = playerOverpoweredActions;
        this.opponentOverpoweredActions = opponentOverpoweredActions;
    }

    updateStrengthTooltip(data) {
        let ratio = game.data.player.strength + "/" + (game.data.player.strength + data.strength);
        this.strengthTooltip.text = "STRENGTH: "+data.strength+"\nratio: "+ratio;
    }
}