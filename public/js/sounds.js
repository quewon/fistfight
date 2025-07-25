var _sounds = {}

window.addEventListener("load", () => {
    _sounds = {
        click: [
            new Howl({ src: "res/sounds/click/1.wav", volume: .2 }),
            new Howl({ src: "res/sounds/click/2.wav", volume: .2 }),
            new Howl({ src: "res/sounds/click/3.wav", volume: .2 })
        ],
        select: new Howl({ src: "res/sounds/select.wav" }),
        deselect: new Howl({ src: "res/sounds/deselect.wav" }),

        "boxing bell": new Howl({ src: "res/sounds/boxing bell.wav" }),
        ticking: new Howl({ src: "res/sounds/ticking.wav" }),
        dodge: new Howl({ src: "res/sounds/dodge.wav" }),
        "hit 0": new Howl({ src: "res/sounds/hit/0.wav" }),
        "hit 1": new Howl({ src: "res/sounds/hit/1.wav" }),
        "hit 2": new Howl({ src: "res/sounds/hit/2.wav" }),
        "hit 3": new Howl({ src: "res/sounds/hit/3.wav" }),
        kill: new Howl({ src: "res/sounds/kill.wav" }),
        transmit: new Howl({ src: "res/sounds/transmit.wav" })
    };
})

var _music = {
    current: null,
    volume: .8,
    normal_volume: .8,
    volume_on_game_update: .3,
    fadetime: 0,
    fadestep: .05,

    "monotony": new Howl({ src: "res/music/monotony.wav" }),
    "monotony reprise": new Howl({ src: "res/music/monotony reprise.wav" }),

    "bills to pay": new Howl({ src: "res/music/bills to pay.wav" }),
    "the beans out of the can": new Howl({ src: "res/music/the beans out of the can.wav" })
};
  
function sfx(name) {
    let sound = _sounds[name];
    if (sound.constructor === Array) sound = sound[sound.length * Math.random() | 0];
    const id = sound.play();
  
    return id;
}

function music(name) {
    let m = _music[name];

    var is_playing = false;
    if (_music.current && _music.current != m && _music.current.playing()) {
        is_playing = true;
        _music.current.stop();
    }

    if (m) {
        _music.current = m;
        m.loop(true);
        m.volume(_music.volume);

        const id = m.play();
        if (!is_playing) {
            m.stop();
        }

        ui.music.songTitle.textContent = name;

        return id;
    } else {
        ui.music.play.textContent = "|>";
        ui.music.songTitle.textContent = "no song";
        ui.music.durationTime.textContent = "0:00";
        ui.music.currentTime.textContent = "0:00";
    }
}

function update_music_progress() {
    if (!(_music.current && _music.current.playing())) return;

    const duration = _music.current._duration;
    ui.music.progress.max = duration;

    var min = Math.floor(duration / 60);
    var sec = Math.floor(duration % 60);
    if (sec < 10) sec = "0"+sec;

    ui.music.durationTime.textContent = min+":"+sec;

    const current_time = _music.current.seek();

    min = Math.floor(current_time / 60);
    sec = Math.floor(current_time % 60);
    if (sec < 10) sec = "0"+sec;

    ui.music.currentTime.textContent = min+":"+sec;

    if (!ui.music.isSliding) ui.music.progress.value = current_time;
}

function change_music_progress() {
    if (_music.current) {
        _music.current.seek(ui.music.progress.value);
        update_music_progress();
    }
}

function play_pause_music() {
    if (_music.current) {
        if (_music.current.playing()) {
            _music.current.pause();
            ui.music.play.textContent = "|>";
        } else {
            _music.current.play();
            if (!_music.current.playing()) {
                setTimeout(_music.current.play.bind(_music.current), 16);
            }
            ui.music.play.textContent = "||";
        }
    }
}

async function set_music_volume(v) {
    _music.desired_volume = v;
    if (!_music.fading_volume) {
        _music.fading_volume = true;
        while (_music.volume != _music.desired_volume) {
            _music.volume += _music.fadestep * Math.sign(_music.desired_volume - _music.volume);
            if (Math.abs(_music.volume - _music.desired_volume) <= _music.fadestep) {
                _music.volume = _music.desired_volume;
                _music.fading_volume = false;
            }
            if (_music.current) _music.current.volume(_music.volume);
            await wait(30);
        }
    }
}

setInterval(update_music_progress, 500);