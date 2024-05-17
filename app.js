const express = require('express')
const app = express()

// socket.io setup
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)

const port = process.env.PORT || 3000;

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/:id', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

server.listen(port, () => {
    console.log(`server listening on port ${port}`)
})

// game

const Game = require('./Game')

const players = {}
const games = {
    test: new Game("test", true)
}

io.on('connection', (socket) => {
    console.log("user connected : " + socket.id);

    players[socket.id] = {
        game: null,
        player_what: null,

        matchmaking: false,
        match: null,
        match_confirmed: false
    }

    socket.on('disconnect', () => {
        console.log("user disconnected : " + socket.id);

        if (players[socket.id].game && games[players[socket.id].game]) {
            // currently in an online game

            var gameId = players[socket.id].game;
            var opponentId = games[gameId][players[socket.id].player_what].opponent;

            if (!opponentId) {
                if (gameId != "test") {
                    delete games[gameId];
                    console.log("game ended : " + gameId);
                } else {
                    games[gameId].remove_player(socket.id);
                    players[socket.id].game = null;
                    players[socket.id].player_what = null;
                }
            } else {
                games[gameId].remove_player(socket.id);
                players[socket.id].game = null;
                players[socket.id].player_what = null;
                io.to(opponentId).emit('player offline');
            }
        } else {
            if (players[socket.id].match) {
                var matchId = players[socket.id].match;
                io.to(matchId).emit('match cancelled');
            }
        }

        delete players[socket.id];
    })

    // matchmaking

    socket.on('look for match', () => {
        players[socket.id].matchmaking = true;
        players[socket.id].match = null;
        players[socket.id].match_confirmed = false;
        socket.emit('potential matches', players);
    })

    socket.on('stop matching', () => {
        players[socket.id].matchmaking = false;
    })

    socket.on('match found', (matchId) => {
        io.to(matchId).emit('create match', socket.id);
        socket.emit('create match', matchId);

        players[matchId].matchmaking = false;
        players[socket.id].matchmaking = false;
        players[matchId].match = socket.id;
        players[socket.id].match = matchId;
    })

    socket.on('confirm match', () => {
        var matchId = players[socket.id].match;

        players[socket.id].match_confirmed = true;
        if (players[matchId].match == socket.id && players[matchId].match_confirmed) {
            var gameId = unique_game_id(socket.id, matchId);
            games[gameId] = new Game(gameId);

            console.log("game started : " + gameId);

            socket.emit('game created', gameId);
            io.to(matchId).emit('game created', gameId);
        }
    })

    socket.on('cancel match', () => {
        var matchId = players[socket.id].match;

        if (matchId) {
            players[matchId].match = null;
            players[matchId].match_confirmed = false;
            io.to(matchId).emit('match cancelled');
        }

        players[socket.id].match = null;
        players[socket.id].match_confirmed = false;
    })

    // create game

    socket.on('create key', (key) => {
        if (games[key]) {
            socket.emit('key is in use');
        } else {
            games[key] = new Game(key, true);
            console.log("game started : " + key);
            socket.emit('game created', key);
        }
    })

    // join game

    socket.on('join game', (gameId) => {
        var game = games[gameId];
        if (game) {
            let player_what = game.add_player(socket.id);

            if (player_what) {
                players[socket.id].game = gameId;
                players[socket.id].player_what = player_what;

                console.log("user (" + socket.id + ") joined game : " + gameId);

                io.to(game[player_what].opponent).emit('player joined');
                game.update(io, player_what);
            } else {
                socket.emit('tried to join full game');
            }
        } else {
            socket.emit('tried to join nonexistent game');
        }
    })

    // game

    socket.on('game command', (data) => {
        var gameId = players[socket.id].game;
        var game = games[gameId];

        if (!game) return;
        
        var player_what = players[socket.id].player_what;

        if (!player_what) return;

        var player = game[player_what];
        var opponent = game[player_what == 'player1' ? 'player2' : 'player1'];

        player.command = data;

        if (game.game.shared_phase) {
            if (player.command && opponent.command) {
                game.process_simul_commands();

                delete player.command;
                delete opponent.command;
                
                if (game.player1.next_location && game.player2.next_location) {
                    game.next_phase();
                } else if (data.command != 'select location') {
                    game.update(io);
                }
            }
        } else {
            game.process_command(player_what);

            delete player.command;

            if (game.player1.next_location && game.player2.next_location) {
                game.next_phase();
            } else if (data.command != 'select location') {
                game.update(io, player_what);
            }
        }
    })

    socket.on('cancel game command', () => {
        var gameId = players[socket.id].game;
        var game = games[gameId];

        if (game) {
            var player_what = players[socket.id].player_what;
            var player = game[player_what];

            if (player.command && player.command.command == 'timed out') return;

            if (game.game.shared_phase) {
                delete player.command;
            } else {
                player.next_location = null;
            }
        }
    })

    socket.on('timer started', (date) => {
        var gameId = players[socket.id].game;
        var game = games[gameId];

        if (game) {
            var player_what = players[socket.id].player_what;
            var player = game[player_what];
            player.timer_started = date;
        }
    })
})

function unique_game_id(player1, player2) {
    var gameId = player1;
    if (games[gameId]) gameId = player2;
    while (games[gameId]) {
        gameId += "a";
    }
    return gameId;
}