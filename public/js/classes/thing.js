class Thing {
    constructor(data) {
        this.name = data.name;
        this.id = data.id;
        this.is_constructed = true;

        let p = data;

        this.base_actions = p.actions || {};

        if (p.tags) {
            for (let tag of p.tags) {
                const id = this.id;

                if (tag == 'internet-connected') {
                    this.base_actions["transmit info"] = function() { game_command(id, 'transmit', this) }
                    continue;
                }

                if (tag == 'food') {
                    this.base_actions["eat"] = {
                        description: "+1 STRENGTH for a day",
                        function: function() { game_command(id, 'eat', this) }
                    }
                    continue;
                }

                if (tag == 'weapon') {
                    this.base_actions["use"] = {
                        description: "kills an overpowered opponent",
                        function: function() { game_command(id, 'kill', this) }
                    }
                    continue;
                }
            }
        }

        this.imageButton = new ImageButton({
            position: p.position || { x: random(20, 80)+"%", y: random(20, 80)+"%" },
            image: p.image,
            text: p.text,
            label: p.label,
            tags: p.tags,
            actions: this.base_actions,
            keep_in_back: p.keep_in_back
        });

        if (p.portable) {
            this.unpocket();
        }
    }

    copy_actions(actions) {
        let copy = {};
        for (let name in actions) {
            copy[name] = actions[name];
        }
        return copy;
    }

    pocket(subject) {
        var actions = this.copy_actions(this.base_actions);
        
        const id = this.id;
        if (subject == 'self') {
            actions["drop"] = function() { game_command(id, 'drop', this) }
            if (game.pockets) game.pockets.add_thing(this);
        } else if (subject == 'opp') {
            actions["pick"] = {
                description: "hold up to " + game.item_capacity + " things",
                function: function() { game_command(id, 'steal', this) }
            }
            if (game.opponent_pockets) game.opponent_pockets.add_thing(this);
        }

        this.imageButton.setActions(actions);
        this.imageButton.deselect();
    }

    unpocket() {
        var actions = this.copy_actions(this.base_actions);

        const id = this.id;
        actions["pocket"] = {
            description: "hold up to " + game.item_capacity + " things",
            function: function() { game_command(id, 'take', this) }
        }

        this.imageButton.setActions(actions);
        this.imageButton.deselect();

        if (game.location) game.location.add_thing(this);
    }
    
    get_position() {
        return {
            x: this.imageButton.element.style.left,
            y: this.imageButton.element.style.top
        }
    }

    set_position(p) {
        this.imageButton.element.style.left = p.x;
        this.imageButton.element.style.top = p.y;
    }

    async say(message) {
        if (this.dialogue) this.dialogue.destroy();

        this.dialogue = new Dialogue({
            text: message,
            thing: this
        });

        if (this.imageButton.element.parentElement) this.imageButton.element.parentElement.appendChild(this.imageButton.element);
        
        await wait(this.dialogue.get_total_duration());
    }

    setActions(actions) {
        this.imageButton.setActions(actions);
    }

    remove() {
        this.imageButton.element.remove();
        if (this.dialogue) this.dialogue.destroy();
    }
}

class MissionPrompt extends Thing {
    constructor(data) {
        data.position = data.position || { x: "50%", y: "50%" };
        data.image = "things/mission prompt.png";
        super(data);

        let el = document.createElement("div");
        el.style.position = "absolute";
        
        this.imageButton.buttonElement.addEventListener("load", function() {
            el.style.width = this.imageButton.buttonElement.clientWidth+"px";
            el.style.height = this.imageButton.buttonElement.clientHeight+"px";
        }.bind(this));
        this.imageButton.buttonWrapper.appendChild(el);

        let to = document.createElement("div");
        to.textContent = data.to;
        let issued = document.createElement("div");
        issued.textContent = data.issued;
        let from = document.createElement("div");
        from.textContent = data.from;
        let content = document.createElement("div");
        content.textContent = data.content;

        to.style.position = 
        issued.style.position =
        from.style.position =
        content.style.position = "absolute";

        to.style.top = "23%";
        issued.style.top = "32%";
        from.style.top = "42%";
        content.style.top = "70%";

        to.style.left = "26%";
        issued.style.left = "49%";
        from.style.left = "40.5%";
        content.style.left = "6%";

        content.style.width = "87%";

        el.appendChild(to);
        el.appendChild(issued);
        el.appendChild(from);
        el.appendChild(content);
    }
}