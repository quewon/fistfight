var _sounds = {
    "boxing bell": new Howl({ src: "res/sounds/boxing bell.wav" }),
    ticking: new Howl({ src: "res/sounds/ticking.wav" }),
    hit: new Howl({ src: "res/sounds/hit.wav" }),
    click: [
        new Howl({ src: "res/sounds/click/1.wav", volume: .2 }),
        new Howl({ src: "res/sounds/click/2.wav", volume: .2 }),
        new Howl({ src: "res/sounds/click/3.wav", volume: .2 })
    ]
};
  
function sfx(name) {
    let sound = _sounds[name];
    if (sound.constructor === Array) sound = sound[sound.length * Math.random() | 0];
    const id = sound.play();
  
    return id;
}