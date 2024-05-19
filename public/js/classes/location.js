class Location {
    constructor(p) {
        p = p || {};

        this.things = p.things || [];
        if (p.onenter) this.onenter = p.onenter;
        if (p.onexit) this.onexit = p.onexit;
        this.container = p.container || ui.game.container;
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

    remove_thing_by_data(thing_data) {
        for (let i=0; i<this.things.length; i++) {
            let thing = this.things[i];
            if (thing.id == thing_data.id) {
                this.things.splice(i, 1);
                thing.remove();

                return thing;
            }
        }

        return false;
    }

    async enter() {
        var maxDuration = 0;
        for (let thing of this.things) {
            let duration = Math.random() * 400;
            this.enter_thing(thing, duration);
            maxDuration = Math.max(maxDuration, duration);
        }
        this.onenter();
        await wait(maxDuration);
    }

    async exit() {
        var maxDuration = 0;
        for (let thing of this.things) {
            let duration = Math.random() * 400;
            setTimeout(function() {
                this.remove();
            }.bind(thing.imageButton.element), duration);
            maxDuration = Math.max(maxDuration, duration);
        }
        this.onexit();
        await wait(maxDuration);
    }

    onenter() { }
    onexit() { }
}