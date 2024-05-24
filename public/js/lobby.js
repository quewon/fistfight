// lobby

function reset_lobby() {
    stop_matchmaking();
    ui.lobby.hostForm.classList.add("gone");
    ui.lobby.joinForm.classList.add("gone");
    ui.lobby.matchForm.classList.add("gone");
    ui.lobby.matchText.classList.remove("gone");
    ui.lobby.matchConfirmButton.disabled = false;
    ui.lobby.matchConfirmButton.textContent = "play";
}

// find match

function start_matchmaking(button) {
    if (!game.matchmaking) {
        if (button) ui.lobby.matchmakingButton = button;

        game.matchmaking = true;
        ui.lobby.matchmakingButton.classList.add("matchmaking");
        ui.lobby.matchmakingButton.textContent = "stop looking for match";

        console.log("looking for players...");
        socket.emit('look for match');
    }
}

function stop_matchmaking() {
    game.opponentId = null;

    if (game.matchmaking) {
        game.matchmaking = false;
        ui.lobby.matchmakingButton.classList.remove("matchmaking");
        ui.lobby.matchmakingButton.textContent = "find match";

        console.log("stopped looking for players.");
        socket.emit('stop matching');
    }
}

var matchmakingButton = new Thing({
    label: "find match",
    position: { x: 40, y: 30 },
    image: "lobby/clock.png",
    actions: {
        "find match": function() {
            if (!game.matchmaking) {
                reset_lobby();
                start_matchmaking(this);
            } else {
                stop_matchmaking();
            }
        },
    }
});
{
    let date = new Date();
    let hour = date.getHours();
    let minute = date.getMinutes();

    let img = document.createElement("img");
    img.style.position = "absolute";
    img.src = "res/images/lobby/minute hand.png";
    matchmakingButton.imageButton.buttonWrapper.appendChild(img);

    img.style.rotate = (minute * 6)+"deg";
    
    img = document.createElement("img");
    img.style.position = "absolute";
    img.src = "res/images/lobby/hour hand.png";
    matchmakingButton.imageButton.buttonWrapper.appendChild(img);

    img.style.rotate = (hour * 30)+"deg";
}

// match found

socket.on('potential matches', (players) => {
    var matchId = null;

    for (let playerId in players) {
        if (playerId == socket.id) continue;
        if (players[playerId].matchmaking && players[playerId].opponent == null) {
            matchId = playerId;
            break;
        }
    }

    if (!matchId) {
        console.log("no match found. retrying...");

        setTimeout(() => {
            if (game.matchmaking && !game.opponentId) socket.emit('look for match');
        }, 500);
    } else {
        socket.emit('match found', matchId);
        sfx("hit");
    }
})

socket.on('create match', (opponentId) => {
    stop_matchmaking();
    game.opponentId = opponentId;
    console.log("match found: " + opponentId);
    ui.lobby.matchForm.classList.remove("gone");
    close_action_menu();
})

function confirm_match() {
    socket.emit('confirm match');
    ui.lobby.matchConfirmButton.disabled = true;
    ui.lobby.matchConfirmButton.textContent = "waiting for other player...";
}

function cancel_match() {
    if (game.opponentId) {
        console.log("cancelled match.");
        socket.emit('cancel match');
        game.opponentId = null;
    }
}

socket.on('game created', async function(gameId) {
    window.history.pushState('game', '', '/' + gameId);

    await game.lobby.exit();

    socket.emit('join game', gameId);
})

socket.on('match cancelled', () => {
    game.opponentId = null;
    
    console.log("match cancelled.");
    ui.lobby.matchConfirmButton.disabled = true;
    ui.lobby.matchText.classList.add("gone");
    ui.lobby.matchConfirmButton.textContent = "match cancelled.";
})

//

var hostButton = new Thing({
    label: "host game",
    position: { x: 60, y: 55 },
    image: "lobby/computer.png",
    actions: {
        "host game": function(e) {
            reset_lobby();

            ui.lobby.hostForm.style.left = e.pageX+"px";
            ui.lobby.hostForm.style.top = e.pageY+"px";
            ui.lobby.hostForm.classList.remove("gone");
            document.body.appendChild(ui.lobby.hostForm);

            ui.lobby.hostForm.querySelector("input").focus();
        },
    }
});

var joinButton = new Thing({
    label: "join game",
    position: { x: 40, y: 70 },
    image: "lobby/telephone.png",
    actions: {
        "join game": function(e) {
            reset_lobby();

            ui.lobby.joinForm.style.left = e.pageX+"px";
            ui.lobby.joinForm.style.top = e.pageY+"px";
            ui.lobby.joinForm.classList.remove("gone");
            document.body.appendChild(ui.lobby.joinForm);

            ui.lobby.joinForm.querySelector("input").focus();
        },
    }
});

function create_key(key) {
    var trimmed = key.trim();
    if (trimmed == "") return;

    socket.emit('create key', trimmed);
}

socket.on('key is in use', () => {
    alert("this key is currently in use!");
})

async function join_game(key) {
    var trimmed = key.trim();
    if (trimmed == "") return;

    window.history.pushState('game', '', '/' + trimmed);

    await game.lobby.exit();

    socket.emit('join game', trimmed);
}

game.lobby = new Location({
    things: [
        matchmakingButton,
        hostButton,
        joinButton,
        new Thing({
            text: ":-)",
            position: { x: 60, y: 38 },
            actions: {
                "talk": function() {
                    game.lobby.things[3].say("hello welcome to the prototype !!!");
                    close_action_menu();
                }
            }
        })
    ],
    onenter: reset_lobby,
    onexit: reset_lobby
})

//

socket.on('tried to join nonexistent game', () => {
    alert("this game does not exist!");
    window.location.href = "/";
})

socket.on('tried to join full game', () => {
    alert("this game is full!");
    window.location.href = "/";
})