class Map extends Thing {
    constructor(data) {
        data.name = "map";
        data.position = { x: "50%", y: "50%" };
        data.keep_in_back = true;
        super(data);

        this.createCanvas();

        var header = document.createElement("div");
        var locationElement = document.createElement("div");
        locationElement.innerHTML = "location. ";
        locationElement.appendChild(ui.game.location);
        header.appendChild(locationElement);

        var timeElement = document.createElement("div");
        timeElement.innerHTML =     "time.     ";
        timeElement.appendChild(ui.game.phase);
        timeElement.appendChild(ui.game.time);
        header.appendChild(timeElement);
        this.canvasContainer.appendChild(header);

        ui.game.timeLabel = attach_label(timeElement, "");

        timeElement.style.position = "relative";
        timeElement.style.width = "fit-content";

        header.className = "mapgamedata";

        this.createMap(data);

        this.draw();
    }

    createCanvas() {
        this.width = 300;
        this.height = 400;

        this.canvasContainer = document.createElement("div");
        this.canvasContainer.className = "canvas-container";

        var canvas = document.createElement("canvas");
        canvas.width = this.width * window.devicePixelRatio;
        canvas.height = this.height * window.devicePixelRatio;
        canvas.style.width = "300px";
        canvas.style.height = "400px";

        canvas.addEventListener("mousedown", function(e) {
            this.drag(e);
        }.bind(this.imageButton));
        
        this.context = canvas.getContext("2d");
        this.canvas = canvas;

        // canvas.addEventListener("mousemove", this.mousemove.bind(this));
        canvas.addEventListener("mouseout", function() {
            this.mousemove({ pageX: -Infinity, pageY: -Infinity });
        }.bind(this));
        // canvas.addEventListener("click", this.click.bind(this));

        this.imageButton.buttonElement.remove();
        this.canvasContainer.appendChild(this.canvas);
        this.imageButton.element.appendChild(this.canvasContainer);

        document.addEventListener("mousemove", this.mousemove.bind(this));
        document.addEventListener("click", this.click.bind(this));
    }

    createMap(data) {
        this.map = {};

        // position of next location polygon
        let padding = 5;
        let x = padding;
        let y = padding;
        let tallest_this_row = 0;
        for (let location of data.game.map) {
            var l = {};

            let element = document.createElement("button");
            element.className = "mapbutton";
            this.imageButton.element.appendChild(element);

            element.onfocus = function() {
                this.focused = true;
            }.bind(l);
            element.onblur = function() {
                this.focused = false;
            }.bind(l);
            element.onclick = function(e) {
                this.click({usedKeyboard: true});
                e.stopPropagation();
            }.bind(this);

            let label = document.createElement("div");
            label.textContent = location;
            label.className = "maplabel";
            document.body.appendChild(label);

            let w = label.offsetWidth + padding;
            let h = label.offsetHeight + padding;

            this.canvasContainer.appendChild(label);

            label.style.left = (x + w/2)+"px";
            label.style.top = (y + h/2)+"px";

            l.element = element;
            l.labelElement = label;
            l.is_current_location = location == data.player.location;
            l.polygon = [
                [x, y],
                [x + w, y],
                [x + w, y + h],
                [x, y + h]
            ];

            this.map[location] = l;

            x += padding + w;
            if (h > tallest_this_row) tallest_this_row = h;
            if (x + w > this.width - padding) {
                x = padding;
                y += tallest_this_row + padding;
                tallest_this_row = 0;
            }
        }

        this.goButton = document.createElement("button");
        this.goButton.className = "mapgobutton";
        this.goButton.textContent = "go";
        this.goButton.addEventListener("click", function(e) {
            if (game.map.selectedLocation) {
                game_command(game.map.selectedLocation, 'select location', this);
            }
            e.stopPropagation();
        });
        this.canvasContainer.appendChild(this.goButton);
        attach_label(this.goButton, "will end this phase");
        this.goButton.remove();

        this.endPhaseButton = document.createElement("button");
        this.endPhaseButton.className = "mapgobutton";
        this.endPhaseButton.textContent = "end phase";
        this.endPhaseButton.addEventListener("click", function(e) {
            if (game.map.selectedLocation) {
                game_command(game.map.selectedLocation, 'select location', this);
            }
            e.stopPropagation();
        });
    }

    updateData(data) {
        for (let location in this.map) {
            this.map[location].is_current_location = location == data.player.location;
        }
    }

    disable(message) {
        for (let location in this.map) {
            var l = this.map[location];

            l.element.setAttribute("disabled", true);
            l.element.tabIndex = -1;
        }
        this.disabledLabel = attach_label(this.canvasContainer, message);
    }

    enable() {
        if (this.disabledLabel) this.disabledLabel.remove();
        for (let location in this.map) {
            var l = this.map[location];

            l.element.removeAttribute("disabled");
            l.element.tabIndex = 0;
        }
    }

    draw() {
        var context = this.context;

        context.clearRect(0, 0, this.width, this.height);

        context.resetTransform();
        context.scale(window.devicePixelRatio, window.devicePixelRatio);

        context.lineWidth = 1;
        if (game.data && game.data.player.phase_complete) {
            context.strokeStyle = "red";
        } else {
            context.strokeStyle = "black";
        }
        context.strokeRect(0.5, 0.5, this.width-1, this.height-1);
        
        context.lineWidth = 2;
        for (let location in this.map) {
            let l = this.map[location];

            context.fillStyle = "lightgray";
            if (l.is_current_location) context.fillStyle = "pink";

            this.draw_polygon(l.polygon);

            context.save();
            context.clip();
            context.fill();
            if ((l.hovered || l.focused) && !l.selected) {
                context.setLineDash([1, 1]);
            }
            if (l.focused || l.selected || l.hovered) context.stroke();
            context.setLineDash([]);
            context.restore();
        }

        requestAnimationFrame(this.draw.bind(this));
    }

    mousemove(e) {
        let rect = this.canvas.getBoundingClientRect();
        let x = e.pageX - (rect.left + window.scrollX);
        let y = e.pageY - (rect.top + window.scrollY);

        this.canvas.classList.remove("pointing");

        for (let location in this.map) {
            if (this.point_in_polygon(x, y, this.map[location].polygon)) {
                this.map[location].hovered = true;
                this.canvas.classList.add("pointing");
            } else {
                this.map[location].hovered = false;
            }
        }
    }

    point_in_polygon(x, y, vertices) {
        // https://observablehq.com/@tmcw/understanding-point-in-polygon
        // https://wrfranklin.org/Research/Short_Notes/pnpoly.html

        var inside = false;
        for (let i=0; i<vertices.length; i++) {
            let point = vertices[i];
            let next_point = vertices[i + 1] || vertices[0];
            
            var xi = point[0], yi = point[1];
            var xj = next_point[0], yj = next_point[1];

            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    draw_polygon(vertices) {
        var context = this.context;
        context.beginPath();

        context.moveTo(vertices[0][0], vertices[0][1]);

        for (let i=1; i<vertices.length; i++) {
            let point = vertices[i];
            context.lineTo(point[0], point[1]);
        }

        context.lineTo(vertices[0][0], vertices[0][1]);
    }

    deselect() {
        this.close_menu();
        for (let location in this.map) {
            this.map[location].focused = false;
        }
    }

    close_menu() {
        this.endPhaseButton.remove();
        this.goButton.remove();
        if (this.selectedLocation) {
            this.map[this.selectedLocation].selected = false;
            this.selectedLocation = null;
        }
    }

    click(e) {
        if (game.disable_actions) return;

        e = e || {};
        if (!e.usedKeyboard && !this.imageButton.clickOnDrop) return;

        if (selectedElement && selectedElement != this) {
            close_action_menu();
        }
        
        let previousSelectedLocation = this.selectedLocation;
        this.close_menu();

        for (let location in this.map) {
            if (e.usedKeyboard && this.map[location].focused) {
                this.map[location].selected = !this.map[location].selected;
                if (this.map[location].selected) this.selectedLocation = location;
                continue;
            }

            if (!e.usedKeyboard && this.map[location].hovered) {
                this.map[location].selected = !this.map[location].selected;
                this.map[location].focused = true;
                if (this.map[location].selected) this.selectedLocation = location;
                continue;
            }
            
            this.map[location].selected = false;
            this.map[location].focused = false;
        }

        if (this.selectedLocation) {
            if (previousSelectedLocation && previousSelectedLocation != this.selectedLocation) {
                stop_waiting_for_response();
            }

            var label = this.map[this.selectedLocation].labelElement;
            var button = this.map[this.selectedLocation].is_current_location ? this.endPhaseButton : this.goButton;
            button.style.left = label.style.left;
            button.style.top = label.style.top;

            var location_button = this.map[this.selectedLocation].element;
            location_button.parentElement.insertBefore(button, location_button.nextSibling);

            // this.canvasContainer.appendChild(button);
        } else {
            if (lockedButton == this.goButton || lockedButton == this.endPhaseButton) {
                lockedButton.classList.remove("locked");
                lockedButton = null;
                stop_waiting_for_response();
            }
        }
    }
}