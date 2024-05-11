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
        noOpponent: document.getElementById("no-opponent"),
        roomKey: document.getElementById("room-key"),
        invitePrompt: document.getElementById("invite-prompt"),

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