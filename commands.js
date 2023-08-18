var UNKNOWN_COMMAND = function(input) {
  line(input+" is an invalid command.");
  line();
};

var SHORTCUTS = {
  "h": "help",
  "s": "status",

  "p": "punch",

  "w": "windup",
  "wind": "windup"
};

var commandCategories = {
  "system": ["help", "clear", "status"],
  "action": ["windup", "punch", "block", "dodge", "cry", "wait"]
};

var COMMANDS = {
  "credits": function() {
    line("", "fistfight v0.0");
    line("", "by q1");
    line("", "last updated on 2023/6/7");
    line();
  },
  "help": function() {
    for (let category in commandCategories) {
      line(category);
      var string = listArray(commandCategories[category], { columns: 3, inset: 4, maxLength: 7 });
      for (let cmd in SHORTCUTS) {
        string = string.replace(SHORTCUTS[cmd], SHORTCUTS[cmd].replace(cmd, "<u>"+cmd+"</u>"));
      }
      line("", string);
    }
  },
  "clear": function() {
    clearConsole();
  },

  "status": function() {
    PLAYER.readStatus([PLAYER, OPPONENT]);

    line();
  },

  "windup": async function(input) {
    var property = input.split(" ")[1];

    if (!COMMANDS[property] && property in SHORTCUTS) {
      property = SHORTCUTS[property];
    }

    await PLAYER.wind(property);

    line();
  },

  "punch": async function() {
    await PLAYER.punch();

    line();
  },

  "block": function() {

  },
  "dodge": function() {

  },

  "cry": async function() {
    await PLAYER.cry();

    line();
  },

  "wait": async function() {
    await PLAYER.wait();

    line();
  }
};

function randomFromArray(array) {
  return array[Math.random() * array.length | 0];
}

function listArray(array, p) {
  const spacing = 4;
  var maxLength = p.maxLength || 0;
  if (maxLength == 0) {
    for (let item of array) {
      if (item.length > maxLength) {
        maxLength = item.length;
      }
    }
  }

  let string = "";
  if (p.inset) {
    for (let x=0; x<p.inset; x++) { string += " " }
  }
  if (p.columns && p.columns > 1) {
    let i=0;
    for (let item of array) {
      string += item;

      i++;
      if (i==array.length) continue;
      if (i < p.columns) {
        for (let x=0; x<maxLength + spacing - item.length; x++) {
          string += " ";
        }
      } else {
        i=0;
        string += "\n";
        if (p.inset) {
          for (let x=0; x<p.inset; x++) { string += " " }
        }
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
