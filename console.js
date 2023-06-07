const PLAYER_DIR = "_ ";

const consoleElement = document.getElementById("console");
const consoleOutput = document.getElementById("console-output");
const consoleInput = document.getElementById("console-input");
var currentLine;
var consoleDisabled = false;
var commandHistory = [];
var tempHistory = [""];
var historyIndex = 1;

function consoleEffect(className) {
  consoleElement.className = "";
  consoleElement.offsetHeight;
  consoleElement.classList.add(className);
}

function pause(duration) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, duration);
  });
}

function line(dir, html) {
  if (currentLine) {
    const caret = currentLine.querySelector("span");
    if (caret) caret.remove();
  }

  const div = document.createElement("div");
  div.dataset.dir = dir || "";

  if (html) div.innerHTML = html;

  currentLine = div;
  consoleOutput.appendChild(div);
}

function updateLine() {
  if (consoleDisabled) return;

  var text = consoleInput.value;
  const start = consoleInput.selectionStart;
  const end = consoleInput.selectionEnd;
  const length = text.length;

  var caret = "_";
  if (start != end) {
    caret = text.substring(start, end);
  } else if (end != length) {
    caret = text.substring(start, end + 1);
  }

  var html =
    text.substring(0, start) +
    "<span class='caret'>"+caret+"</span>" +
    text.substring(start != end ? end : end + 1);

  currentLine.innerHTML = html;

  tempHistory[historyIndex] = consoleInput.value;
}

function clearConsole() {
  while (consoleOutput.lastElementChild) {
    consoleOutput.lastElementChild.remove();
  }
}

function commitTempToHistory() {
  if (tempHistory[historyIndex] == commandHistory[historyIndex]) {
    commandHistory.splice(historyIndex, 1);
  } else if (commandHistory.indexOf(tempHistory[historyIndex]) != -1) {
    commandHistory.splice(commandHistory.indexOf(tempHistory[historyIndex]), 1);
  }
  commandHistory.push(tempHistory[historyIndex]);

  tempHistory.length = 0;
  for (let string of commandHistory) {
    tempHistory.push(string);
  }

  tempHistory.push("");
  historyIndex = commandHistory.length;
}

consoleInput.addEventListener("blur", function() {
  consoleInput.focus();
  updateLine();
});

consoleInput.addEventListener("keydown", async function(e) {
  if (consoleDisabled) return;

  switch (e.key) {
    case "Enter":

      const _input = consoleInput.value.trim();

      consoleInput.value = "";

      consoleDisabled = true;
      if (_input != "") {
        commitTempToHistory();
        
        const _command = _input.split(" ")[0];

        if (_command in COMMANDS) {
          await COMMANDS[_command](_input);
        } else if (_command in SHORTCUTS) {
          await COMMANDS[SHORTCUTS[_command]](_input);
        } else {
          await UNKNOWN_COMMAND(_input);
        }
      }

      consoleDisabled = false;
      line(PLAYER_DIR);
      updateLine();

      break;

    case "ArrowUp":

      if (historyIndex > 0) {
        historyIndex--;
        consoleInput.value = tempHistory[historyIndex];
        setTimeout(function() {
          consoleInput.setSelectionRange(consoleInput.value.length, consoleInput.value.length);
          updateLine();
        }, 0);
      }

      break;

    case "ArrowDown":

      if (historyIndex < tempHistory.length - 1) {
        historyIndex++;
        consoleInput.value = tempHistory[historyIndex];
        setTimeout(function() {
          consoleInput.setSelectionRange(consoleInput.value.length, consoleInput.value.length);
          updateLine();
        }, 0);
      }

      break;
  }
});

consoleInput.addEventListener("input", function() {
  updateLine();
});

document.addEventListener("selectionchange", function(e) {
  if (e.target.activeElement == consoleInput) {
    updateLine();
  }
});
