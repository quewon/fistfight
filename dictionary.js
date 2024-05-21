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
            health: 7,
            strength: 1,
            max_windup: 3,
            dodge_chance: .5,
            item_capacity: 5,
            home: [
                "note for bill"
            ],

            dialogue: {
                'initial encounter': [
                    "guess you're the one from the memo"
                ],

                'repeated encounter': [
                    "are you lost",
                    "i missed you too",
                    "i like this town, it's quiet"
                ],

                'fight adjourned': [
                    "i think i left my oven on",
                    "i'm tired can we go now",
                    "zzzz"
                ],

                'win': [
                    "i win :)"
                ]
            }
        },

        "jim beans": {
            name: "jim beans",
            image: "characters/jim beans.png",
            lines: [
                "professional sneaker"
            ],
            job: "spy",
            info_goal: 3,
            health: 7,
            strength: 1,
            max_windup: 3,
            dodge_chance: .5,
            item_capacity: 5,
            home: [
                "note for jim beans",
            ],

            dialogue: {
                'initial encounter': [
                    "you must be the intel!"
                ],

                'repeated encounter': [
                    "it's nothing personal",
                    "if it isn't whatever your name is!",
                    "how's the pay over there?"
                ],

                'fight adjourned': [
                    "well, that's my 8 contracted hours",
                    "let's do this at my place next time",
                    "nice to meet you, too"
                ],

                'win': [
                    "that's done, then"
                ]
            }
        }
    },

    npcs: {
        // generic

        "dude": {
            name: "dude",
            image: "npcs/generic 1.png",
            dialogue: [
                "woah you scared me!",
                "hello there",
                "hmm"
            ]
        },

        "guy": {
            name: "guy",
            image: "npcs/generic 2.png",
            dialogue: [
                "sup",
                "yo",
                "who are you"
            ]
        },

        "old man": {
            name: "old man",
            image: "npcs/generic 3.png",
            dialogue: [
                "get out of my home",
                "i don't get company very often",
                "how's the weather these days i can't see too good"
            ]
        },

        "girl": {
            name: "girl",
            image: "npcs/generic 4.png",
            dialogue: [
                "hi",
                "hullo",
                "i'm just chillin"
            ]
        },

        "old woman": {
            name: "old woman",
            image: "npcs/generic 5.png",
            dialogue: [
                "don't disturb me, dear",
                "can't talk busy reading some huge book",
                "i probably believe in god"
            ]
        },

        //

        "chef": {
            name: "chef",
            image: "npcs/chef.png",
            dialogue: [
                "enjoying the food?",
                "welcome to this lovely dinery",
                "compliments to the chef ? that's me!"
            ],
            schedule: ["home", "diner", "diner"]
        },

        "librarian": {
            name: "librarian",
            image: "npcs/librarian.png",
            dialogue: [
                "i'm really into books",
                "looking for something?",
                "you're looking for ... a book? buddy..."
            ],
            schedule: ["library", "library", "home"]
        }
    },

    things: {
        "character selection title": {
            class: "Thing",
            
            position: { x: "30%", y: "20%" },
            image: "things/character select.png",
            alt: "select your character",
            keep_in_back: true
        },

        "note for bill": {
            class: "MissionPrompt",
            
            to: "bill",
            issued: "days ago",
            from: "bosswoman",
            content: "otherside is active in your town. procure a WEAPON and KILL the agent.",
            portable: true
        },

        "note for jim beans": {
            class: "MissionPrompt",
            
            to: "jim beans",
            issued: "right now",
            from: "bossman",
            content: "enemy has intel. collect all (3) INFO and relay with INTERNET-CONNECTED DEVICE.",
            portable: true
        },

        // gentlepeople's lounge

        "gentlepeople's lounge title": {
            class: "Thing",

            position: { x: "50%", y: "17%" },
            image: "things/gentlepeoples lounge.png",
            alt: "gentlepeople's lounge",
            keep_in_back: true
        },

        "no fighting sign": {
            class: "Thing",

            position: { x: "65%", y: "20%" },
            image: "things/no fighting.png",
            alt: "no fighting!",
            portable: true
        },

        "lounge chair 1": {
            class: "Thing",

            position: { x: "0%", y: "0%" },
            image: "things/gentlepeoples lounge sign.png"
        },

        "lounge chair 2": {
            class: "Thing",

            position: { x: "0%", y: "0%" },
            image: "things/gentlepeoples lounge sign.png"
        },

        //

        "laptop": {
            class: "Thing",

            image: "things/laptop.png",
            tags: ["internet-connected"],
            portable: true
        },

        "generic book": {
            class: "Thing",
            image: "things/book.png",
            portable: true
        },

        "generic open book": {
            class: "Thing",
            image: "things/open book.png",
            portable: true
        },

        "knife": {
            class: "Thing",
            image: "things/knife.png",
            tags: ["weapon"],
            portable: true
        },

        "water and breadsticks": {
            class: "Thing",
            image: "things/breadsticks.png",
            tags: ["food"],
            portable: true
        }
    }
}

module.exports = dictionary;