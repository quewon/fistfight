class PainManager {
  constructor() {
    this.active = null;
    this.array = [];
  }

  update() {
    for (let pain of this.array) {
      pain.update();
    }
  }

  updateActivePain() {

  }

  newPain() {
    this.array.push(new Pain());
  }
}

class Pain {
  constructor() {
    this.attack = 0;
    this.sustain = 3;
    this.time = 0;
    this.active = false;
  }

  update() {
    this.time++;
    if (this.time > this.sustain + this.attack) {
      this.active = false;
    } else if (this.time > this.attack) {
      this.active = true;
    }
  }
}
