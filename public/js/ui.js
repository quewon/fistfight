// global ui

var ui = {
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

        location: document.createElement("span"),
        phase: document.createElement("span"),
        time: document.createElement("span")
    }
}

ui.lobby.joinForm.querySelector("input").addEventListener("keypress", function(e) {
    if (e.code == 'Enter') {
        ui.lobby.joinForm.querySelector("button").click();
    }
});

ui.lobby.hostForm.querySelector("input").addEventListener("keypress", function(e) {
    if (e.code == 'Enter') {
        ui.lobby.hostForm.querySelector("button").click();
        this.value = "";
    }
});


document.addEventListener("keydown", async function(e) {
    if (!ui.game.pockets.classList.contains("gone")) {
        if (e.code == 'Escape') {
            close_pockets();

            e.stopPropagation();
            e.preventDefault();
            return false;
        }
    }
})

document.addEventListener("keypress", async function(e) {
    if (e.code == 'KeyP') {
        if (ui.game.pockets.classList.contains("gone")) {
            look_in_pockets();
        } else {
            close_pockets();
        }
        return;
    }
})

ui.game.pockets.addEventListener("click", close_pockets);