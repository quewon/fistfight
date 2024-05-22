// global ui

var ui = {
    tooltip: document.getElementById("tooltip"),
    
    lobby: {
        matchForm: document.getElementById("match-form"),
        matchText: document.getElementById("match-text"),
        matchConfirmButton: document.getElementById("match-confirm-button"),
        hostForm: document.getElementById("host-form"),
        joinForm: document.getElementById("join-form")
    },

    game: {
        uiContainer: document.getElementById("ui-container"),
        timer: document.getElementById("timer-background"),
        container: document.getElementById("things"),
        pockets: document.getElementById("pockets"),

        noOpponent: document.getElementById("no-opponent"),
        roomKey: document.getElementById("room-key"),
        invitePrompt: document.getElementById("invite-prompt"),

        log: document.getElementById("game-log"),
        logButton: document.getElementById("log-toggle-button"),

        data: document.getElementById("gamedata"),
        location: document.getElementById("game-location"),
        phase: document.getElementById("game-phase"),
        time: document.getElementById("game-time"),
        
        pocketCapacity: document.getElementById("pocket-capacity"),
        pocketOwner: document.getElementById("pocket-owner"),
    }
}