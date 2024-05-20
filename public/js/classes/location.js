class Location {
    constructor(p) {
        p = p || {};

        this.things = p.things || [];
        if (p.onenter) this.onenter = p.onenter;
        if (p.onexit) this.onexit = p.onexit;
        this.container = p.container || ui.game.container;
    }

    // add something after location has been created
    add_thing(thing) {
        this.things.push(thing);
        this.enter_thing(thing);
    }

    remove_thing(thing) {
        for (let i=0; i<this.things.length; i++) {
            let compare = this.things[i];
            if (compare.id == thing.id) {
                this.things.splice(i, 1);
                compare.remove();
                return compare;
            }
        }

        return false;
    }

    enter_thing(thing, duration) {
        if (this.container.contains(thing.imageButton.element)) return;

        thing.imageButton.deselect();
        thing.imageButton.container = this.container;
        
        setTimeout(function() {
            if (this.keep_in_back) {
                this.container.prepend(this.element);
            } else {
                this.container.appendChild(this.element);
            }
        }.bind(thing.imageButton), duration);
    }

    async enter(conditions) {
        conditions = conditions || {};
        var maxDuration = 0;
        for (let thing of this.things) {
            let duration = conditions.immediate ? 0 : Math.random() * 400;
            this.enter_thing(thing, duration);
            maxDuration = Math.max(maxDuration, duration);
        }
        this.onenter();
        if (!conditions.immediate) await wait(maxDuration);
    }

    async exit(conditions) {
        conditions = conditions || {};
        var maxDuration = 0;
        for (let thing of this.things) {
            if (conditions.immediate) {
                thing.imageButton.element.remove();
            } else {
                let duration = conditions.immediate ? 0 : Math.random() * 400;
                setTimeout(function() {
                    this.remove();
                }.bind(thing.imageButton.element), duration);
                maxDuration = Math.max(maxDuration, duration);
            }
        }
        this.onexit();
        if (!conditions.immediate) await wait(maxDuration);
    }

    onenter() { }
    onexit() { }
}