class Thing {
    constructor(p) {
        p = p || {};

        this.imageButton = new ImageButton({
            position: p.position || { x: "20%", y: "20%" },
            image: p.image,
            text: p.text,
            label: p.label,
            tags: p.tags,
            actions: p.actions,
            keep_in_back: p.keep_in_back
        });
    }

    say(message) {
        if (this.dialogue) this.dialogue.destroy();

        let dialogue = new Dialogue(message);

        let rect = this.imageButton.buttonElement.getBoundingClientRect();
        let x;
        let y = -dialogue.height;

        if (rect.left + rect.width/2 > window.innerWidth/2) {
            // dialogue on its left
            x = 0;
            dialogue.element.classList.add("arrow-right");
        } else {
            // dialogue on its right
            x = rect.width;
            dialogue.element.classList.add("arrow-left");
        }
        
        this.imageButton.element.appendChild(dialogue.elementContainer);
        dialogue.setPosition(x, y);

        this.dialogue = dialogue;
    }

    setActions(actions) {
        this.imageButton.setActions(actions);
    }

    remove() {
        this.imageButton.element.remove();
    }
}

class MissionPrompt extends Thing {
    constructor(prompt) {
        super({
            position: { x: "50%", y: "30%" },
            image: "mission prompt.png",
            actions: {
                "take": {
                    description: "hold up to 3 things",
                    function: function() { }
                }
            }
        });

        let to = document.createElement("div");
        to.textContent = prompt.to;
        let issued = document.createElement("div");
        issued.textContent = prompt.issued;
        let from = document.createElement("div");
        from.textContent = prompt.from;
        let content = document.createElement("div");
        content.textContent = prompt.content;

        to.style.position = 
        issued.style.position =
        from.style.position =
        content.style.position = "absolute";

        // to.style.fontFamily = 
        // issued.style.fontFamily =
        // from.style.fontFamily =
        // content.style.fontFamily = "monospace";

        to.style.top = "29%";
        issued.style.top = "35.5%";
        from.style.top = "42%";
        content.style.top = "61%";

        to.style.left = "30%";
        issued.style.left = "48%";
        from.style.left = "39%";
        content.style.left = "14%";

        content.style.width = "80%";
        // content.style.height = "30%"
        // content.style.overflow = "scroll";
        // content.style.pointerEvents = "auto";

        this.imageButton.buttonWrapper.appendChild(to);
        this.imageButton.buttonWrapper.appendChild(issued);
        this.imageButton.buttonWrapper.appendChild(from);
        this.imageButton.buttonWrapper.appendChild(content);
    }
}