class Player extends Thing {
    constructor(data) {
        super(data);

        this.statsElement = document.createElement("div");
        this.statsElement.className = "stats";
        this.imageButton.element.appendChild(this.statsElement);
        this.imageButton.element.classList.add("character");

        this.stats = {
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
                icon.src = "res/images/stats/"+statName+"/"+(i % this.stats[statName].icons_count + 1)+".png";
                element.appendChild(icon);
                if (i >= count) {
                    icon.classList.add("empty");
                }
            }
        } else {
            for (let i=0; i<count; i++) {
                let icon = document.createElement("img");
                icon.src = "res/images/stats/"+statName+"/"+(i % this.stats[statName].icons_count + 1)+".png";
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
        }

        if (data.overpowered) {
            this.imageButton.element.classList.add("overpowered");
        } else {
            this.imageButton.element.classList.remove("overpowered");
        }

        this.previousStats = data;
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

            let i = this.stats[statName].count % this.stats[className].icons_count + 1;
            icon.src = "res/images/stats/"+statName+"/"+i+".png";

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
        data.position = { x: random(30, 70) + "%", y: random(30, 70) + "%" };
        data.text = data.name;
        data.image = data.image;
        data.label = data.job;
        super(data);

        this.imageButton.setActions({
            inspect: function() {
                this.say(data.lines[Math.random() * data.lines.length | 0])
            }.bind(this),
            select: function() { game_command(name, 'select character', this) }
        });

        this.setStat('health', data.health);
        this.stats.windup.max = data.max_windup;
        this.setStat('windup', 0);
    }
}

class You extends Player {
    constructor(data) {
        data.name = "you";
        data.position = { x: "20%", y: "30%" };
        data.label = "you";
        data.text = data.character;
        data.image = data.image;
        data.actions = {
            "look in <em>p</em>ockets": {
                description: "does not cost a turn",
                function: function() {
                    look_in_pockets();
                }
            }
        };
        super(data);

        this.setStat('health', data.health);
        this.stats.windup.max = data.max_windup;
        this.setStat('windup', data.windup);
        this.updateStats(data);
    }
}

class Opponent extends Player {
    constructor(data) {
        var fightActions = {
            "wind up punch": {
                description: "packs extra power into a punch.",
                function: function() { game_command('opponent', 'windup', this) }
            },
            "punch": {
                description: "damages your opponent",
                function: function() {
                    game_command('opponent', 'punch', this);
                }
            },
            block: {
                description: "get hit for half damage (rounded down). puts you on 1 WINDUP if hit.",
                function: function() { game_command('opponent', 'block', this) }
            },
            dodge: {
                description: "chance (depending on STRENGTH ratio) of avoiding a punch completely.",
                function: function() { game_command('opponent', 'dodge', this) }
            }
        }

        var playerOverpoweredActions = {
            struggle: {
                description: "chance (depending on STRENGTH ratio) of recovering 1 HEALTH",
                function: function() {
                    game_command('opponent', 'struggle', this);
                }
            }
        }

        var opponentOverpoweredActions = {
            question: {
                description: "+1 INFORMATION.",
                function: function() { game_command('opponent', 'question', this) }
            }
        }

        data.name = "opponent";
        data.position = { x: "80%", y: "70%" };
        data.label = "opponent";
        data.text = data.character;
        data.label = data.image;
        data.actions = fightActions;
        super(data);

        this.fightActions = fightActions;
        this.playerOverpoweredActions = playerOverpoweredActions;
        this.opponentOverpoweredActions = opponentOverpoweredActions;
        
        this.setStat('health', data.health);
        this.stats.windup.max = data.max_windup;
        this.setStat('windup', data.windup);
        this.updateStats(data);
    }
}