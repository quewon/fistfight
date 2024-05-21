async function say(text) {
    var dialogue = new Dialogue({
        text: text,
        mute: true
    });
    await wait(dialogue.get_total_duration());
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
        this.element.onclick = function(e) {
            this.destroy();
            e.stopPropagation();
        }.bind(this);

        // calculate width
        this.elementContainer.appendChild(this.element);
        this.element.innerHTML = text;
        this.width = this.element.offsetWidth;
        this.height = this.element.offsetHeight;
        this.element.innerHTML = "";

        if (p.thing) {
            p.thing.imageButton.element.appendChild(this.elementContainer);
            this.position_in_imagebutton(p.thing.imageButton);
            p.thing.imageButton.dialogue = this;
        } else {
            this.setPosition(mouse.x, mouse.y);
        }

        // break down text
        this.syllables = [];
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
        let x;
        let y = -this.height;

        if (rect.left + rect.width/2 > ui.game.container.clientWidth/2) {
            // dialogue on its left
            x = 0;
            this.element.classList.remove("arrow-left");
            this.element.classList.add("arrow-right");
        } else {
            // dialogue on its right
            x = rect.width;
            this.element.classList.remove("arrow-right");
            this.element.classList.add("arrow-left");
        }
        
        this.setPosition(x, y);
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

        if (this.syllableIndex < this.syllables.length) {
            let string = "";
            for (let i=0; i<=this.syllableIndex; i++) {
                string += this.syllables[i];
            }

            this.element.innerHTML = string;

            let currentSyllable = this.syllables[this.syllableIndex];
            let duration = currentSyllable.length * 40;

            if (this.syllableIndex == this.syllables.length - 1) {
                duration += 1000;
            } else if (currentSyllable == " ") {
                duration = 100;
            }

            if (currentSyllable.trim() != "" && !this.mute) {
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