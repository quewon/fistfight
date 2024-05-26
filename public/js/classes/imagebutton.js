var mouse = { x: -1, y: -1 };
var draggingElement;
var selectedElement;
var lockedButton;

function close_action_menu() {
    if (game.disable_actions) return;
    if (selectedElement) selectedElement.deselect();
    if (game.map) game.map.deselect();
    stop_waiting_for_response();
}

document.addEventListener("mousemove", function(e) {
    mouse.x = e.pageX;
    mouse.y = e.pageY;

    if (!ui.tooltip.classList.contains("gone")) {
        ui.tooltip.style.left = mouse.x+"px";
        ui.tooltip.style.top = mouse.y+"px";
    }
    
    if (draggingElement) {
        let x = e.pageX;
        let y = e.pageY;

        if (draggingElement.clickOnDrop) {
            let s = draggingElement.dragStartPosition;
            let sqrMoveDistance = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y);
            if (sqrMoveDistance > 1) {
                draggingElement.clickOnDrop = false;
                draggingElement.element.classList.remove("might-click");
                document.body.classList.add("dragging");
            }
        }

        let o = draggingElement.dragOffset;
        x = (x - o.x) / draggingElement.container.clientWidth * 100;
        y = (y - o.y) / draggingElement.container.clientHeight * 100;

        draggingElement.set_position({ x:x, y:y });

        if (draggingElement.dialogue) {
            draggingElement.dialogue.position_in_imagebutton(draggingElement);
        }
    }
});

document.addEventListener("mouseup", function() {
    if (draggingElement) {
        draggingElement.drop();
        return;
    }
    
    close_action_menu();
});

class ImageButton {
    constructor(p) {
        p = p || {};

        this.selected = false;
        this.keep_in_back = p.keep_in_back;

        this.container = p.container || ui.game.container;

        this.element = document.createElement("div");
        this.element.className = "imagebutton";
        this.set_position(p.position || { x: 50, y: 50 } );

        this.overheadElement = document.createElement("div");
        this.overheadElement.className = "overhead";
        this.element.appendChild(this.overheadElement);

        if (p.tags) {
            this.tagsContainer = document.createElement("div");
            this.tagsContainer.className = "tags-container";
            for (let tag of p.tags) {
                var tagElement = document.createElement("span");
                tagElement.textContent = tag;
                tagElement.className = tag+" tag";
                this.tagsContainer.appendChild(tagElement);
            }
            this.overheadElement.appendChild(this.tagsContainer);
        }

        this.buttonWrapper = document.createElement("div");
        this.buttonWrapper.className = "input-wrapper";
        this.buttonElement = document.createElement("input");
        this.buttonWrapper.appendChild(this.buttonElement);
        this.element.appendChild(this.buttonWrapper);
        if (p.image) {
            this.buttonElement.type = "image";

            if (p.text) {
                this.nameElement = document.createElement("span");
                this.nameElement.textContent = p.text;
                this.element.appendChild(this.nameElement);
            }

            if (p.alt) {
                this.buttonElement.alt = p.alt;
            }

            this.element.style.width = "0";
            this.element.classList.add("hidden");
            this.width = 0;
            this.height = 0;
            this.buttonElement.onload = function() {
                this.buttonElement.onload = null;

                let parent = this.element.parentElement;

                document.body.appendChild(this.element);
                
                this.width = this.buttonElement.clientWidth + 2;
                this.height = this.buttonElement.clientHeight + 2;

                this.element.style.width = this.width+"px";
                this.element.classList.remove("hidden");

                if (parent) {
                    parent.appendChild(this.element);
                } else {
                    this.element.remove();
                }

                if (this.onsized) this.onsized();
            }.bind(this);

            this.buttonElement.src = "res/images/"+p.image;
        } else if (p.text) {
            // this.image_ready = true;
            this.buttonElement.type = "button";
            this.buttonElement.value = p.text;
        }
        this.buttonElement.draggable = false;
        this.buttonElement.addEventListener("click", function(e) {
            this.click(e);
        }.bind(this));
        this.buttonElement.addEventListener("mousedown", function(e) {
            this.drag(e);
        }.bind(this));

        this.buttonElement.addEventListener("mouseup", function(e) {
            this.drop();
            e.stopPropagation();
        }.bind(this));

        if (p.label) {
            this.tooltip = attach_tooltip(this.buttonElement, p.label);
        }

        this.setActions(p.actions);
    }

    set_position(p) {
        p.x = Math.max(0, Math.min(100, p.x));
        p.y = Math.max(0, Math.min(100, p.y));
        this.element.style.left = p.x+"%";
        this.element.style.top = p.y+"%";
        this.position = { x: p.x, y: p.y };
    }

    get_style_position() {
        return {
            x: this.element.style.left,
            y: this.element.style.top
        }
    }

    get_position() {
        return { x: this.position.x, y: this.position.y };
    }

    drag(e) {
        let crect = this.container.getBoundingClientRect();
        let rect = this.element.getBoundingClientRect();

        draggingElement = this;

        this.dragStartPosition = {
            x: e.pageX + window.scrollX,
            y: e.pageY + window.scrollY
        }

        this.dragOffset = {
            x: e.pageX - (rect.left + window.scrollX) + crect.left - rect.width/2,
            y: e.pageY - (rect.top + window.scrollY) + crect.top - rect.height/2
        }

        this.clickOnDrop = true;
        this.element.classList.add("might-click");

        if (!this.keep_in_back) this.container.appendChild(this.element);
    }

    drop() {
        if (draggingElement != this) return;

        if (this.clickOnDrop) {
            this.click();
        }

        draggingElement = null;

        document.body.classList.remove("dragging");
    }

    click(e) {
        if (game.disable_actions) return;
        if (e && (e.clientX != 0 || e.clientY != 0)) return;

        if (selectedElement && selectedElement != this) {
            close_action_menu();
        }
        
        this.element.classList.remove("might-click");

        if (this.selected) {
            this.deselect();
        } else {
            this.select();
        }
    }
 
    select() {
        if (game.data && game.data.player.phase_complete) return;
        if (!this.actions) return;

        close_action_menu();

        selectedElement = this;
        this.element.classList.add("selected");
        this.selected = true;
    }

    deselect() {
        if (selectedElement != this) return;
        stop_waiting_for_response();

        this.element.classList.remove("selected");
        selectedElement = null;
        this.selected = false;
    }

    setActions(actions) {
        if (actions && Object.keys(actions).length > 0) {
            this.element.classList.remove("no-actions");
            this.buttonElement.removeAttribute("tabindex");

            this.actions = actions;
            if (!this.actionsMenu) {
                this.actionsMenu = document.createElement("div");
                this.actionsMenu.className = "actions-menu";
                this.element.appendChild(this.actionsMenu);
            } else {
                while (this.actionsMenu.lastElementChild) {
                    this.actionsMenu.lastElementChild.remove();
                }
            }
            for (let action in actions) {
                let actionDescription;
                let actionFunction = actions[action];

                if (typeof actionFunction !== 'function') {
                    actionDescription = actions[action].description;
                    actionFunction = actions[action].function;
                }

                let actionButton = document.createElement("button");
                actionButton.onclick = actionFunction;
                actionButton.addEventListener("click", function(e) { e.stopPropagation() });
                actionButton.onmouseup = function(e) { e.stopPropagation() };
                actionButton.innerHTML = action;
                this.actionsMenu.appendChild(actionButton);

                if (actionDescription) {
                    attach_tooltip(actionButton, actionDescription);
                }
            }
        } else {
            this.element.classList.add("no-actions");
            this.buttonElement.tabIndex = -1;
        }
    }

    // onready() { }
}

function tooltip(text) {
    if (text) {
        ui.tooltip.classList.remove("gone");
        ui.tooltip.innerHTML = text;
    } else {
        ui.tooltip.classList.add("gone");
    }
}

function attach_tooltip(element, text, class_name) {
    var tooltip_data = {
        text: text,
        className: class_name
    };

    element.addEventListener("mouseenter", function() {
        tooltip(this.text);
        ui.tooltip.className = this.className || "";
    }.bind(tooltip_data));

    element.addEventListener("focus", function() {
        ui.tooltip.style.left = mouse.x+"px";
        ui.tooltip.style.top = mouse.y+"px";
        tooltip(this.text);
        ui.tooltip.className = this.className || "";
    }.bind(tooltip_data));

    element.addEventListener("mouseleave", function() {
        tooltip();
    });

    element.addEventListener("blur", function(e) {
        tooltip();
    });

    return tooltip_data;
}