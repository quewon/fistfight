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

        this.spacing_priority = p.spacing_priority;
        this.ignore_spacing = p.ignore_spacing;

        this.imageButton = new ImageButton({
            position: p.position || { x: random(35, 65), y: random(35, 65) } ,
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
        var actions = {};
        
        const id = this.id;
        if (subject == 'self') {
            actions = this.copy_actions(this.base_actions);
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
        return this.imageButton.get_position();
    }

    set_position(p) {
        this.imageButton.set_position(p);
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
        data.image = "things/mission prompt.gif";
        data.position = { x:50, y:50 };
        super(data);

        let el = document.createElement("div");
        el.style.position = "absolute";

        this.imageButton.onsized = function() {
            el.style.width = this.width+"px";
            el.style.height = this.height+"px";
        };
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