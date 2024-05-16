function say(text, x, y) {
    return new Dialogue(text, x, y);
}

class Dialogue {
    constructor(text, x, y, ondestroy) {
        this.ondestroy = ondestroy;

        x = x || mouse.x;
        y = y || mouse.y;

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
        this.element.textContent = text;
        this.width = this.element.offsetWidth;
        this.height = this.element.offsetHeight;
        this.element.textContent = "";

        this.setPosition(x, y);

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

    setPosition(x, y) {
        x = Math.min(x, window.innerWidth + window.scrollX - this.width);
        y = Math.min(y, window.innerHeight + window.scrollY - this.height);

        this.elementContainer.style.left = x+"px";
        this.elementContainer.style.top = y+"px";
    }

    update() {
        this.syllableIndex++;

        if (this.syllableIndex < this.syllables.length) {
            let string = "";
            for (let i=0; i<=this.syllableIndex; i++) {
                string += this.syllables[i];
            }

            this.element.textContent = string;

            let currentSyllable = this.syllables[this.syllableIndex];
            let duration = currentSyllable.length * 40;

            if (this.syllableIndex == this.syllables.length - 1) {
                duration += 1000;
            } else if (currentSyllable == " ") {
                duration = 100;
            }

            if (currentSyllable.trim() != "") {
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
        if (this.ondestroy) {
            this.ondestroy();
            this.ondestroy = null;
        }
    }
}