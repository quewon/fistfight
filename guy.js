var PLAYER;

class Guy {
  constructor(p) {
    this.name = p.name || "GUY";

    this.status = p.status || "neutral.";

    this.focus = 0;
    this.desperation = 0;
    this.hitsTaken = 0;
    this.hitsLanded = 0;
    this.painManager = new PainManager();
    this.isPlayer = p.isPlayer || false;
  }

  async update() {
    this.painManager.update();
  }

  addFocus(value) {
    const prev = this.focus;
    const curr = this.focus + value;

    if (value > 0) {
      line("focus honed.");
    } else if (value < 0) {

    }

    this.focus += value;
  }

  async landHit(msg) {
    if (this.isPlayer) {
      consoleEffect("contact", 100 * (this.windcount + 1));
      await pause(100 * this.windcount);
      line("", msg || "landed.");
    }

    this.hitsLanded++;
  }

  async takeHit(msg) {
    if (this.isPlayer) {
      consoleEffect("hit");
      await pause(100);
      line("", msg || "you take a hit.");
      // if (this.winding) {
      //   await pause(300);
      //   line("", "lost your punch.");
      //   this.winding = false;
      //   await pause(300);
      // }
    }

    this.painManager.newPain();

    this.hitsTaken++;
  }

  async punch(guy) {
    if (this.winding) {
      await this.landHit(randomFromArray([
        "your knuckles sting.",
        "a whistling blow.",
        "landed.",
        "knock 'em dead.",
      ]));
    } else {
      await pause(100);
      line("", randomFromArray([
        "missed.",
        "slippery."
      ]));
    }

    this.winding = null;
    this.windcount = -1;

    await this.update();
  }

  async setWind() {
    this.winding = true;
    this.windcount = -1;
  }

  async wind() {
    if (!this.winding) {
      await this.setWind();
    }

    if (this.winding) {
      this.windcount++;
    }

    if (this.isPlayer) {
      var dialogue;
      switch (this.windcount) {
        case 0:
          dialogue = "one. you're lined up.";
          break;
        case 1:
          dialogue = "two. knuckles tight.";
          break;
        case 2:
          dialogue = "three. elbows raised. punch is fully wound.";
          break;
        default:
          dialogue = "can't put any more power on this punch.";
          break;
      }

      if (dialogue) line("", dialogue);
    }

    this.update();
  }

  async cry() {
    if (this.isPlayer) {
      if (this.cried && this.cried > 0) {
        line("", "you sob.");
        await pause(600);
        await this.takeHit("it fails to faze them.");
      } else {
        line("", "you sob.");
        await pause(600);
        line("", "they hesitate.");
        await pause(600);
      }
    } else {
      await this.takeHit();
    }

    this.cried = 1;

    await this.update();
  }

  async wait() {
    await this.takeHit();
    await this.update();
  }

  getStatusArray(clarity) {
    var array = [];

    array.push(this.name);
    if (this.winding) {
      array.push("winding up a "+this.winding+".");
    } else if (this.pain > 0) {
      array.push("pain:        "+this.pain);
    } else {
      array.push(this.status);
    }

    array.push("");
    array.push("hits landed/taken | "+this.hitsLanded+"/"+this.hitsTaken);
    array.push("focus             | "+this.focus);
    array.push("desperation       | "+this.desperation);

    return array;
  }

  readStatus(guys) {
    line(": ", "<u>status check</u>");

    var arrays = [];
    var longestArrayLength = 0;
    for (let guy of guys) {
      const list = guy.getStatusArray();
      if (list.length > longestArrayLength) {
        longestArrayLength = list.length;
      }
      arrays.push(list);
    }

    var array = [];
    for (let y=0; y<longestArrayLength; y++) {
      for (let list of arrays) {
        if (list[y]) {
          array.push(list[y]);
        } else {
          array.push("");
        }
      }
    }

    line(listArray(array, { columns: arrays.length }));
  }
}

PLAYER = new Guy({ name: "YOU", status: "in pain.", isPlayer: true });
OPPONENT = new Guy({ name: "THEM", status: "grinning." });
