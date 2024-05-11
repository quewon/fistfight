class Location {
    constructor(p) {
        p = p || {};

        this.things = p.things || [];
        if (p.onenter) this.onenter = p.onenter;
        if (p.onexit) this.onexit = p.onexit;
    }

    async enter() {
        var maxDuration = 0;
        for (let thing of this.things) {
            if (document.body.contains(thing.imageButton.element)) continue;

            thing.imageButton.deselect();
            
            let duration = Math.random() * 400;

            setTimeout(function() {
                if (this.keep_in_back) {
                    document.body.prepend(this.element);
                } else {
                    document.body.appendChild(this.element);
                }
            }.bind(thing.imageButton), duration);

            maxDuration = Math.max(maxDuration, duration);
        }
        await wait(maxDuration);
        this.onenter();
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
        await wait(maxDuration);
        this.onexit();
    }

    onenter() { }
    onexit() { }
}