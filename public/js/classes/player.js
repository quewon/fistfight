class Player extends Thing {
    constructor(p) {
        super(p);

        this.statsElement = document.createElement("div");
        this.statsElement.className = "stats";
        this.imageButton.element.appendChild(this.statsElement);

        this.stats = {
            windup: {
                element: this.createStatElement("windup"),
                count: 0,
                max: 0
            },
            health: {
                element: this.createStatElement("health"),
                count: 0
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
                let dot = document.createElement("div");
                element.appendChild(dot);
                if (i >= count) {
                    dot.classList.add("empty");
                }
            }
        } else {
            for (let i=0; i<count; i++) {
                let dot = document.createElement("div");
                element.appendChild(dot);
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
                let dot = element.children[i];
                if (i >= this.stats[statName].count) {
                    dot.classList.add("empty");
                } else {
                    dot.classList.remove("empty");
                }
            }
        } else {
            if (this.stats[statName].count - 1 >= 0) {
                for (let i=this.stats[statName].count-1; i>=0; i--) {
                    let dot = element.children[i];
                    if (dot.classList.contains("decrement")) {
                        continue;
                    } else {
                        dot.classList.add("decrement");
                        dot.onanimationend = function() { this.remove() }
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
                let dot = element.children[i];
                if (i >= this.stats[statName].count) {
                    dot.classList.add("empty");
                } else {
                    dot.classList.remove("empty");
                }
            }
        } else {
            let dot = document.createElement("div");
            this.stats[statName].element.appendChild(dot);
            this.stats[statName].count++;
        }
    }

    remove() {
        this.imageButton.element.remove();
    }
}

class PlayerSelector extends Player {
    constructor(name, data) {
        super({
            position: { x: random(20, 80) + "%", y: random(20, 80) + "%" },
            text: data.text,
            label: data.job,
        });

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
        super({
            position: { x: "20%", y: "20%" },
            label: "you",
            text: data.character
        });

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
            "punch": function() {
                game_command('opponent', 'punch', this);
            },
            block: {
                description: "only get hit for -1 HEALTH. puts you on 1 WINDUP.",
                function: function() { game_command('opponent', 'block', this) }
            },
            dodge: {
                description: "chance (depending on STRENGTH ratio) of avoiding a punch completely.",
                function: function() { game_command('opponent', 'dodge', this) }
            }
        }

        var playerOverpoweredActions = {
            escape: function() {
                game_command('opponent', 'escape', this);
            }
        }

        var opponentOverpoweredActions = {
            question: {
                description: "+1 INFORMATION.",
                function: function() { game_command('opponent', 'question', this) }
            }
        }

        super({
            position: { x: "60%", y: "50%" },
            label: "opponent",
            text: data.character,
            actions: fightActions
        })

        this.fightActions = fightActions;
        this.playerOverpoweredActions = playerOverpoweredActions;
        this.opponentOverpoweredActions = opponentOverpoweredActions;
        
        this.setStat('health', data.health);
        this.stats.windup.max = data.max_windup;
        this.setStat('windup', data.windup);
        this.updateStats(data);
    }
}