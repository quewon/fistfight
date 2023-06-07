var VARS = {};

var UNKNOWN_COMMAND = function(input) {
  line(input+" is an invalid command.");
  line();
};

var SHORTCUTS = {
  "h": "help",
  "c": "clear",
};

var COMMANDS = {
  "credits": function() {
    line("fistfight v0.0");
    line("by q1");
    line("last updated on 2023/6/7");
    line();
  },

  "help": function() {
    var string = listArray(Object.keys(COMMANDS));
    for (let cmd in SHORTCUTS) {
      string = string.replace(SHORTCUTS[cmd], SHORTCUTS[cmd].replace(cmd, "<u>"+cmd+"</u>"));
    }

    line("", string);
    line();
  },
  "clear": function() {
    clearConsole();
  },

  "punch": async function() {
    await landHit(randomFromArray([
      "your knuckles sting.",
      "a whistling blow.",
      "landed.",
      "missed.",
      "knock 'em dead.",
      "slippery."
    ]));

    line();
  },
  "kick": async function() {
    await landHit(randomFromArray([
      "sweep em off their feet.",
      "direct hit.",
    ]));

    line();
  },

  "block": function() {

  },
  "dodge": function() {

  },

  "grab": async function(input) {
    if (VARS["grabbing"]) {
      line("you're already grabbing their "+VARS["grabbing"]+".");
    } else {
      input = input.split(" ");
      if (input.length > 1) {
        property = input[1];
        VARS["grabbing"] = property;
        line("you grab their "+property+".");
      } else {
        line("grab what?");
      }
    }

    line();
  },

  "release": function() {
    VARS["grabbing"] = null;
  },

  "cry": async function() {
    if (VARS["cried"]) {
      line("you sob.");
      await pause(600);
      await takeHit("it fails to faze them.");
    } else {
      VARS["cried"] = true;
      line("you sob.");
      await pause(500);
      line("they hesitate.");
      await pause(600);
    }

    line();
  },

  "wait": async function() {
    await takeHit();
    line();
  }
};

async function landHit(msg) {
  consoleEffect("contact");
  await pause(100);
  line(msg || "landed.");
}

async function takeHit(msg) {
  consoleEffect("hit");
  await pause(100);
  line(msg || "you take a hit.");
}

function randomFromArray(array) {
  return array[Math.random() * array.length | 0];
}

function listArray(array) {
  const spacing = 4;
  var maxLength = 0;
  for (let item of array) {
    if (item.length > maxLength) {
      maxLength = item.length;
    }
  }

  let string = "";
  if (array.length >= 6) {
    let i=0;
    for (let item of array) {
      string += item;

      i++;
      if (i==1) {
        for (let x=0; x<maxLength + spacing - item.length; x++) {
          string += " ";
        }
      } else {
        i=0;
        string += "\n";
      }
    }
  } else {
    for (let i=0; i<array.length; i++) {
      string += array[i];
      if (i < array.length - 1) {
        string += "\n";
      }
    }
  }

  return string;
}
