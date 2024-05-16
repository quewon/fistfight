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