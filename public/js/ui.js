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
        noOpponent: document.getElementById("no-opponent"),
        roomKey: document.getElementById("room-key"),
        gameLost: document.getElementById("game-lost"),
        disconnected: document.getElementById("disconnected"),

        timer: document.getElementById("timer-background"),
        container: document.getElementById("things"),
        pockets: document.getElementById("pockets"),

        invitePrompt: document.getElementById("invite-prompt"),

        log: document.getElementById("game-log"),
        logButton: document.getElementById("log-toggle-button"),

        data: document.getElementById("gamedata"),
        location: document.getElementById("game-location"),
        phase: document.getElementById("game-phase"),
        time: document.getElementById("game-time"),
        
        pocketCapacity: document.getElementById("pocket-capacity"),
        pocketOwner: document.getElementById("pocket-owner"),
    },

    music: {
        play: document.getElementsByClassName("play")[0],
        songTitle: document.getElementsByClassName("song-title")[0],
        progress: document.querySelector("#music-player input"),
        isSliding: false,
        currentTime: document.querySelector(".current-time"),
        durationTime: document.querySelector(".duration-time")
    }
}

ui.music.progress.addEventListener("mousedown", function() {
    ui.music.isSliding = true;
});
ui.music.progress.addEventListener("mouseup", function() {
    ui.music.isSliding = false;
});
ui.music.progress.addEventListener("blur", function() {
    ui.music.isSliding = false;
});