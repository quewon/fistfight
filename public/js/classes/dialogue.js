async function say(text, x, y) {
    var dialogue = new Dialogue({
        text: text,
        mute: true,
        x: x,
        y: y
    });
    await wait(dialogue.get_total_duration());
    return dialogue;
}

class Dialogue {
    constructor(p) {
        p = p || {};

        this.mute = p.mute;

        var elementContainer = document.createElement("div");
        elementContainer.className = "dialogue-container";
        document.body.appendChild(elementContainer);
        this.elementContainer = elementContainer;

        var element = document.createElement("div");
        element.className = "dialogue";
        elementContainer.appendChild(element);
        this.element = element;

        var text = p.text || "";

        // calculate width
        element.innerHTML = text;
        this.width = element.offsetWidth;
        this.height = element.offsetHeight;
        element.innerHTML = "";

        var thing = p.thing;

        if (thing) {
            thing.imageButton.buttonWrapper.appendChild(elementContainer);
            thing.imageButton.dialogue = this;
            this.imageButton = thing.imageButton;
            this.position_in_imagebutton(thing.imageButton);
            setTimeout(function() {
                this.position_in_imagebutton(this.imageButton);
            }.bind(this), 1);
        } else {
            this.setPosition(p.x || mouse.x, p.y || mouse.y);
        }

        // break down text
        var syllables = [];

        if (thing && text[0] == "<") {
            let dedication = text.match(/<(.+)>/g)[0]+" ";
            text = text.substring(dedication.length);
            syllables.push(dedication);
            this.dedication = dedication;
        }

        for (let word of text.split(" ")) {
            let syls = word.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi);
            if (syls) {
                for (let syl of syls) {
                    syllables.push(syl);
                }
                syllables.push(" ");
            } else {
                syllables.push(word+" ");
            }
        }

        this.syllables = syllables;
        this.syllableIndex = -1;

        this.update();
    }

    position_in_imagebutton(imagebutton) {
        let rect = imagebutton.buttonElement.getBoundingClientRect();
        let y = -this.height;

        if (rect.left + rect.width/2 > ui.game.container.clientWidth/2) {
            // dialogue on its left
            this.elementContainer.style.right = "unset";
            this.elementContainer.style.left = "0";
            this.element.classList.remove("arrow-left");
            this.element.classList.add("arrow-right");
        } else {
            // dialogue on its right
            if (imagebutton.width) {
                this.elementContainer.style.left = (imagebutton.width)+"px";
            } else {
                this.elementContainer.style.left = "unset";
                this.elementContainer.style.right = "0";
            }
            this.element.classList.remove("arrow-right");
            this.element.classList.add("arrow-left");
        }

        this.elementContainer.style.top = y+"px";
    }

    setPosition(x, y) {
        x = Math.min(x, window.innerWidth + window.scrollX - this.width);
        y = Math.min(y, window.innerHeight + window.scrollY - this.height);

        this.elementContainer.style.left = x+"px";
        this.elementContainer.style.top = y+"px";
    }

    get_total_duration() {
        let duration = 0;
        for (let syllable of this.syllables) {
            if (syllable == " ") {
                duration += 100;
            } else {
                duration += syllable.length * 40;
            }
        }
        duration += 500;
        return duration;
    }

    update() {
        this.syllableIndex++;
        if (this.imageButton && draggingElement != this.imageButton.element && this.imageButton.container.contains(this.imageButton.element)) {
            this.imageButton.container.appendChild(this.imageButton.element);
        }

        if (this.syllableIndex < this.syllables.length) {
            let string = "";
            for (let i=0; i<=this.syllableIndex; i++) {
                string += this.syllables[i];
            }

            this.element.innerHTML = string;

            let currentSyllable = this.syllables[this.syllableIndex];
            let duration = currentSyllable.length * 40;

            if (this.syllableIndex == this.syllables.length - 1) {
                duration += 3000;
            } else if (currentSyllable == " ") {
                duration = 100;
            }

            if (currentSyllable == this.dedication) {
                duration = 700;
            }

            if (currentSyllable != this.dedication && currentSyllable.trim() != "" && !this.mute) {
                sfx("click");
            }

            this.timeout = setTimeout(this.update.bind(this), duration);
        } else {
            this.destroy();
        }
    }

    destroy() {
        clearTimeout(this.timeout);
        this.elementContainer.remove();
    }
}