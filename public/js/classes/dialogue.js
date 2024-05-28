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
        var text = p.text || "";

        this.mute = p.mute;

        this.elementContainer = document.createElement("div");
        this.elementContainer.className = "dialogue-container";
        document.body.appendChild(this.elementContainer);

        this.element = document.createElement("div");
        this.element.className = "dialogue";

        // calculate width
        this.elementContainer.appendChild(this.element);
        this.element.innerHTML = text;
        this.width = this.element.offsetWidth;
        this.height = this.element.offsetHeight;
        this.element.innerHTML = "";

        if (p.thing) {
            p.thing.imageButton.buttonWrapper.appendChild(this.elementContainer);
            p.thing.imageButton.dialogue = this;
            this.imageButton = p.thing.imageButton;
            this.position_in_imagebutton(this.imageButton);
            setTimeout(function() {
                this.position_in_imagebutton(this.imageButton);
            }.bind(this), 1);
        } else {
            this.setPosition(p.x || mouse.x, p.y || mouse.y);
        }

        // break down text
        this.syllables = [];

        if (p.thing && text[0] == "<") {
            let dedication = text.match(/<(.+)>/g)[0]+" ";
            text = text.substring(dedication.length);
            this.syllables.push(dedication);
            this.dedication = dedication;
        }

        for (let word of text.split(" ")) {
            let syllables = word.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi);
            if (syllables) {
                for (let syl of syllables) {
                    this.syllables.push(syl);
                }
                this.syllables.push(" ");
            } else {
                this.syllables.push(word+" ");
            }
        }

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