var _sounds = {
    "boxing bell": new Howl({ src: "res/sounds/boxing bell.wav" }),
    ticking: new Howl({ src: "res/sounds/ticking.wav" }),
    dodge: new Howl({ src: "res/sounds/dodge.wav" }),
    click: [
        new Howl({ src: "res/sounds/click/1.wav", volume: .2 }),
        new Howl({ src: "res/sounds/click/2.wav", volume: .2 }),
        new Howl({ src: "res/sounds/click/3.wav", volume: .2 })
    ],
    select: new Howl({ src: "res/sounds/select.wav" }),
    deselect: new Howl({ src: "res/sounds/deselect.wav" }),

    "hit 0": new Howl({ src: "res/sounds/hit/0.wav" }),
    "hit 1": new Howl({ src: "res/sounds/hit/1.wav" }),
    "hit 2": new Howl({ src: "res/sounds/hit/2.wav" }),
    "hit 3": new Howl({ src: "res/sounds/hit/3.wav" })
};
  
function sfx(name) {
    console.log(name);
    console.trace();
    let sound = _sounds[name];
    if (sound.constructor === Array) sound = sound[sound.length * Math.random() | 0];
    const id = sound.play();
  
    return id;
}