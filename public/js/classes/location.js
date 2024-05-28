class Location {
    constructor(p) {
        p = p || {};

        this.ignore_spacing = p.ignore_spacing;
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

    space_out_things() {
        if (this.ignore_spacing) return;
        if (this.container.classList.contains("gone")) return;

        const WIDTH = this.container.clientWidth;
        const HEIGHT = this.container.clientHeight;
        const CENTER = { x: WIDTH/2, y: HEIGHT/2 };

        var rects = [];
        for (let thing of this.things) {
            if (thing.ignore_spacing) continue;

            let center = thing.get_position();
            if (!center.x || !center.y) {
                const p = thing.imageButton.get_style_position();
                center.x = parseFloat(p.x);
                center.y = parseFloat(p.y);
            }

            let width = thing.imageButton.element.clientWidth;
            let height = thing.imageButton.element.clientHeight;

            if (!width) {
                let rect = thing.imageButton.element.getBoundingClientRect();
                width = rect.width;
                height = rect.height;
            }

            rects.push({
                thing: thing,
                x: WIDTH * center.x / 100,
                y: HEIGHT * center.y / 100,
                w: width + 2.5,
                h: height + 2.5
            })
        }

        // sort from farthest to center to closest
        rects.sort((a, b) => {
            let ad = sqr_distance(a.x, a.y, CENTER.x, CENTER.y);
            let bd = sqr_distance(b.x, b.y, CENTER.x, CENTER.y);
            return bd - ad;
        });

        for (let l=0; l<10000; l++) {
            var has_intersections = false;
            for (let i=0; i<rects.length; i++) {
                if (rects[i].thing.spacing_priority) continue;

                for (let j=0; j<rects.length; j++) {
                    if (i==j) continue;

                    const r1 = rects[i];
                    const r2 = rects[j];
                    const x1 = r1.x - r1.w/2;
                    const y1 = r1.y - r1.h/2;
                    const x2 = r2.x - r2.w/2;
                    const y2 = r2.y - r2.h/2;

                    if (aabb(x1, y1, r1.w, r1.h, x2, y2, r2.w, r2.h)) {
                        has_intersections = true;

                        var d = {
                            x: r1.x - r2.x,
                            y: r1.y - r2.y
                        }

                        if (d.x == 0 && d.y == 0) {
                            d = {
                                x: Math.random() - 1,
                                y: Math.random() - 1
                            }
                        }

                        d = normalize_vector(d);

                        r1.x = clamp(r1.x + d.x * l/100, 0, WIDTH);
                        r1.y = clamp(r1.y + d.y * l/100, 0, HEIGHT);
                    }
                }
            }

            if (!has_intersections) break;
        }

        for (let rect of rects) {
            rect.thing.set_position({
                x: rect.x / WIDTH * 100,
                y: rect.y / HEIGHT * 100
            });
        }
    }

    remove_thing(thing) {
        if (thing.id) {
            for (let i=0; i<this.things.length; i++) {
                let compare = this.things[i];
                if (compare.id == thing.id) {
                    this.things.splice(i, 1);
                    compare.remove();
                    return compare;
                }
            }
        } else if (thing.name) {
            for (let i=0; i<this.things.length; i++) {
                let compare = this.things[i];
                if (compare.name == thing.name) {
                    this.things.splice(i, 1);
                    compare.remove();
                    return compare;
                }
            }
        } else {
            console.error("thing has no name or id.");
        }

        return false;
    }

    enter_thing(thing, duration) {
        if (this.container.contains(thing.imageButton.element)) return;

        thing.imageButton.deselect();
        thing.imageButton.container = this.container;

        if (duration) {
            setTimeout(function() {
                if (this.keep_in_back) {
                    this.container.prepend(this.element);
                } else {
                    this.container.appendChild(this.element);
                }
            }.bind(thing.imageButton), duration);
            if (!thing.ignore_spacing) setTimeout(this.space_out_things.bind(this), duration);
        } else {
            if (thing.imageButton.keep_in_back) {
                thing.imageButton.container.prepend(thing.imageButton.element);
            } else {
                thing.imageButton.container.appendChild(thing.imageButton.element);
            }
            if (!thing.ignore_spacing) this.space_out_things();
        }
    }

    async enter(conditions) {
        conditions = conditions || {};
        var maxDuration = 0;
        for (let thing of this.things) {
            let duration = conditions.immediate ? 0 : Math.random() * 400;
            this.enter_thing(thing, duration);
            maxDuration = Math.max(maxDuration, duration);
        }
        if (!conditions.immediate) await wait(maxDuration);
        this.onenter();

        if (conditions.immediate) {
            var all_loaded = false;
            while (!all_loaded) {
                all_loaded = true;
                for (let thing of this.things) {
                    if (!thing.imageButton.loaded) {
                        all_loaded = false;
                        break;
                    }
                }
                await wait(1);
            }
            this.space_out_things();
        }
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
        if (!conditions.immediate) await wait(maxDuration);
        this.onexit();
    }

    onenter() { }
    onexit() { }
}