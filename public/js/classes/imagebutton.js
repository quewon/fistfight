var mouse = { x: -1, y: -1 };
var draggingElement;
var selectedElement;

function close_action_menu() {
    if (game.disable_actions) return;

    if (selectedElement) selectedElement.deselect();
    if (game.map) game.map.deselect();
}

document.addEventListener("mousemove", function(e) {
    mouse.x = e.pageX;
    mouse.y = e.pageY;
    
    if (draggingElement) {
        let x = e.pageX;
        let y = e.pageY;

        if (draggingElement.clickOnDrop) {
            let s = draggingElement.dragStartPosition;
            let sqrMoveDistance = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y);
            if (sqrMoveDistance > 1) {
                draggingElement.clickOnDrop = false;
            }
            draggingElement.element.classList.remove("might-click");
            document.body.classList.add("dragging");
        }
        
        let o = draggingElement.dragOffset;
        draggingElement.element.style.left = x - o.x + "px";
        draggingElement.element.style.top = y - o.y + "px";
    }
});

document.addEventListener("mouseup", function(e) {
    if (draggingElement) {
        draggingElement.drop();
        return;
    }

    if (selectedElement) {
        selectedElement.deselect();
    }
});

class ImageButton {
    constructor(p) {
        p = p || {};

        this.selected = false;
        this.keep_in_back = p.keep_in_back;

        this.element = document.createElement("div");
        this.element.className = "imagebutton";
        this.element.style.left = p.position.x;
        this.element.style.top = p.position.y;

        if (p.tags) {
            this.tagsContainer = document.createElement("div");
            this.tagsContainer.className = "tags-container";
            for (let tag of p.tags) {
                var tagElement = document.createElement("span");
                tagElement.textContent = tag;
                tagElement.className = tag+" tag";
                this.tagsContainer.appendChild(tagElement);
            }
            this.element.appendChild(this.tagsContainer);
        }

        this.buttonElement = document.createElement("input");
        if (p.image) {
            this.buttonElement.type = "image";
            this.buttonElement.src = p.image;
        } else if (p.text) {
            this.buttonElement.type = "button";
            this.buttonElement.value = p.text;
        }
        this.buttonElement.draggable = false;
        this.buttonElement.addEventListener("click", this.click.bind(this));
        this.buttonElement.addEventListener("mousedown", function(e) {
            this.drag(e);
        }.bind(this));
        this.element.appendChild(this.buttonElement);

        if (p.label) {
            var label = attach_label(this.buttonElement, p.label);
            label.style.whiteSpace = "nowrap";
        }

        this.setActions(p.actions);
    }

    drag(e) {
        let rect = this.element.getBoundingClientRect();

        draggingElement = this;

        this.dragStartPosition = {
            x: e.pageX + window.scrollX,
            y: e.pageY + window.scrollY
        }

        this.dragOffset = {
            x: e.pageX - (rect.left + window.scrollX),
            y: e.pageY - (rect.top + window.scrollY)
        }

        this.clickOnDrop = true;
        this.element.classList.add("might-click");

        if (!this.keep_in_back) document.body.appendChild(this.element);
    }

    drop() {
        if (draggingElement != this) return;

        if (this.clickOnDrop) {
            this.click();
        }

        draggingElement = null;

        document.body.classList.remove("dragging");
    }

    click() {
        if (game.disable_actions) return;

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
        if (this.actions && this.actions == actions) return;

        if (actions) {
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
                actionButton.textContent = action;
                this.actionsMenu.appendChild(actionButton);

                if (actionDescription) {
                    attach_label(actionButton, actionDescription);
                }
            }
        } else {
            this.element.classList.add("no-actions");
            this.buttonElement.tabIndex = -1;
        }
    }
}

function attach_label(element, text) {
    const label = document.createElement("div");
    label.innerHTML = text;
    label.className = "label gone";

    element.addEventListener("mouseenter", function() {
        this.classList.remove("gone");
    }.bind(label));

    element.addEventListener("mouseleave", function() {
        this.classList.add("gone");
    }.bind(label));

    element.addEventListener("mousemove", function(e) {
        let rect = this.parentElement.getBoundingClientRect();
        let x = e.pageX - (rect.left + window.scrollX);
        let y = e.pageY - (rect.top + window.scrollY);
        this.style.left = x+"px";
        this.style.top = y+"px";
    }.bind(label));

    element.addEventListener("focus", function() {
        if (this.classList.contains("gone")) {
            let x = this.parentElement.clientWidth;
            let y = 0;
            this.style.left = x+"px";
            this.style.top = y+"px";
            this.classList.remove("gone");
        }
    }.bind(label));

    element.addEventListener("blur", function(e) {
        this.classList.add("gone");
    }.bind(label));

    let container = element;
    while (container.tagName == 'INPUT') {
        container = container.parentElement;
    }

    container.appendChild(label);

    return label;
}