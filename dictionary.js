const dictionary = {
    characters: {
        "bill": {
            name: "bill",
            image: "characters/bill.png",
            lines: [
                "not for the faint of heart",
                "warning: WILL MURDER"
            ],
            job: "killer",
            health: 10,
            strength: 1,
            max_windup: 3,
            dodge_chance: .5,
            item_capacity: 3,
            home: [
                "note for bill"
            ]
        },

        "jim beans": {
            name: "jim beans",
            image: "characters/jim beans.png",
            lines: [
                "professional sneaker",
                "international super spy"
            ],
            job: "spy",
            health: 10,
            strength: 1,
            max_windup: 3,
            dodge_chance: .5,
            item_capacity: 3,
            home: [
                "note for jim beans"
            ]
        }
    },

    things: {
        "character selection title": {
            class: "Thing",
            construction: {
                image: "character select.png",
                alt: "select your character",
                keep_in_back: true
            }
        },

        "note for bill": {
            class: "MissionPrompt",
            construction: {
                to: "bill",
                issued: "days ago",
                from: "bosswoman",
                content: "otherside is active in your town. procure a WEAPON and KILL the agent."
            }
        },

        "note for jim beans": {
            class: "MissionPrompt",
            construction: {
                to: "jim beans",
                issued: "right now",
                from: "bossman",
                content: "enemy has intel. collect all (3) INFO and relay with INTERNET-CONNECTED DEVICE."
            }
        }
    }
}

module.exports = dictionary;