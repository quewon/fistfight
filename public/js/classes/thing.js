class Thing {
    constructor(data) {
        this.name = data.name;
        this.id = data.id;

        let p = data;
        
        var actions = p.actions || {};

        const id = this.id;
        if (p.portable) {
            if (p.in_pockets) {
                actions["drop"] = function() { game_command(id, 'drop', this) }
            } else {
                actions["take"] = {
                    description: "hold up to 3 things",
                    function: function() { game_command(id, 'take', this) }
                }
            }
        }

        this.imageButton = new ImageButton({
            position: p.position || { x: random(20, 80)+"%", y: random(20, 80)+"%" },
            image: p.image,
            text: p.text,
            label: p.label,
            tags: p.tags,
            actions: actions,
            keep_in_back: p.keep_in_back
        });
    }
    
    get_position() {
        return {
            x: this.imageButton.element.style.left,
            y: this.imageButton.element.style.top
        }
    }

    say(message) {
        if (this.dialogue) this.dialogue.destroy();

        let dialogue = new Dialogue(message);

        let rect = this.imageButton.buttonElement.getBoundingClientRect();
        let x;
        let y = -dialogue.height;

        if (rect.left + rect.width/2 > ui.game.container.clientWidth/2) {
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
    constructor(data) {
        data.position = data.position || { x: "80%", y: "70%" };
        data.image = "mission prompt.png";
        super(data);

        let el = document.createElement("div");
        el.style.position = "absolute";
        
        this.imageButton.buttonElement.addEventListener("load", function() {
            el.style.width = this.imageButton.buttonElement.clientWidth+"px";
            el.style.height = this.imageButton.buttonElement.clientHeight+"px";
        }.bind(this));
        this.imageButton.buttonWrapper.appendChild(el);

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

        to.style.top = "30%";
        issued.style.top = "36.5%";
        from.style.top = "43%";
        content.style.top = "62%";

        to.style.left = "30%";
        issued.style.left = "48%";
        from.style.left = "39%";
        content.style.left = "14%";

        content.style.width = "75%";

        el.appendChild(to);
        el.appendChild(issued);
        el.appendChild(from);
        el.appendChild(content);
    }
}