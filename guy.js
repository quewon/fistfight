var PLAYER;

class Guy {
  constructor() {
  }

  async landHit(msg) {
    consoleEffect("contact", 50 * (this.windcount + 1));
    await pause(50 * this.windcount);
    line("", msg || "landed.");
  }

  async takeHit(msg) {
    consoleEffect("hit");
    await pause(100);
    line("", msg || "you take a hit.");
  }

  async punch(guy) {
    if (this.winding == "punch") {
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
      await pause(200);
      if (this.winding) line("", "lost your "+this.winding+".");
    }

    this.winding = null;
    this.windcount = -1;
  }

  async kick(guy) {
    if (this.winding == "kick") {
      await this.landHit(randomFromArray([
        "sweep them off their feet.",
        "direct hit.",
      ]));
    } else {
      await pause(100);
      line("", randomFromArray([
        "fumbled.",
        "a swing into the air."
      ]));
      await pause(200);
      if (this.winding) line("", "lost your "+this.winding+".");
    }

    this.winding = null;
    this.windcount = -1;
  }

  async setWind(action) {
    if (this.winding && this.winding != action) {
      line("", "lost your "+this.winding+".");
      await pause(200);
    }

    this.winding = action;
    this.windcount = -1;
  }

  async wind(action) {
    if (action == "punch" || action == "kick") {
      if (this.winding != action) await this.setWind(action);
    } else if (!this.winding) {
      if (action == undefined) {
        line("", "wind up what?");
      } else {
        line("", "you can't wind up a(n) "+action+".");
      }
      return;
    }

    if (this.winding) {
      this.windcount++;
    }

    var dialogue;
    switch (this.winding) {
      case "punch":

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

        break;

      case "kick":

        switch (this.windcount) {
          case 0:
            dialogue = "one. in position.";
            break;
          case 1:
            dialogue = "two. you shift your weight.";
            break;
          case 2:
            dialogue = "three. foot planted. kick is fully wound.";
            break;
          default:
            dialogue = "can't make this kick any sturdier.";
            break;
        }

        break;
    }

    if (dialogue) line("", dialogue);
  }

  async cry() {
    if (this.cried && this.cried > 0) {
      line("", "you sob.");
      await pause(600);
      await takeHit("it fails to faze them.");
    } else {
      this.cried = 1;
      line("", "you sob.");
      await pause(600);
      line("", "they hesitate.");
      await pause(600);
    }
  }

  async wait() {
    await this.takeHit();
  }
}

function printGuysStatus(guys) {
  line(": ", "<u>status check</u>");
  line(listArray([
    "YOU", "THEM",
    "in pain.", "grinning.",
  ], { columns: 2 }));
}

PLAYER = new Guy();
OPPONENT = new Guy();
