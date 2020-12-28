const keys = {
    states: {
        upDownPressed: false,
        leftDownPressed: false,
        rightDownPressed: false,
    },
    definitions: {
        up: [' ', 'w', 'W'],
        right: ['d', 'D'],
        left: ['a', 'A'],
    }
}

var availableHeight: number;
var availableWidth: number;

//#region event listeners
document.addEventListener("DOMContentLoaded", function () {
    availableHeight = screen.availHeight - (window.outerHeight - window.innerHeight);
    availableWidth = screen.availWidth - (window.outerWidth - window.innerWidth);
    let rect: HTMLElement | null = document.getElementById("rect");

    if (rect !== null)
        rect = rect as HTMLElement;
    else
        throw new Error("The rectange was null.");

    let floatingRect = new FloatingRectangle(rect);
    floatingRect.start();
});

document.addEventListener("keydown", function(e) {
    e.preventDefault();
    switch (e.key) {
        case keys.definitions.up[0]:
        case keys.definitions.up[1]:
        case keys.definitions.up[2]:
            keys.states.upDownPressed = true;
            break;
        case keys.definitions.right[0]:
        case keys.definitions.right[1]:
            keys.states.rightDownPressed = true;
            break;
        case keys.definitions.left[0]:
        case keys.definitions.left[1]:
            keys.states.leftDownPressed = true;
            break;
    } 
});

document.addEventListener("keyup", function(e) {
    e.preventDefault();
    switch (e.key) {
        case keys.definitions.up[0]:
        case keys.definitions.up[1]:
        case keys.definitions.up[2]:
            keys.states.upDownPressed = false;
            break;
        case keys.definitions.right[0]:
        case keys.definitions.right[1]:
            keys.states.rightDownPressed = false;
            break;
        case keys.definitions.left[0]:
        case keys.definitions.left[1]:
            keys.states.leftDownPressed = false;
            break;
    }
});
//#endregion

class FloatingRectangle {
    rect: HTMLElement;
    id: number | null;
    deltaTime = 8;
    acceleration = 0.1;
    maxSpeed = 8;
    #currAccelerationY = 0;
    #currAccelerationX = 0;
    wasGoingLeft = false;

    constructor(rectangle: HTMLElement) {
        this.rect = rectangle;
        this.rect.style.top = availableHeight - this.rect.offsetHeight + "px";
        this.rect.style.left = "0px";
        this.id = null;
    }
    
    start() {
        if (this.id === null)
            this.id = setInterval(() => this.frame(), this.deltaTime);
    }

    stop() {
        if (this.id !== null) {
            clearInterval(this.id);
            this.id = null;
        }
    }

    frame() {
        this.rect.style.top = this.calculateNewY() + "px";
        this.rect.style.left = this.calculateNewX() + "px";
        this.flipRect();
    }

    flipRect() {
        if (keys.states.rightDownPressed)
            this.rect.style.setProperty("transform", "scaleX(-1)");
        else if (keys.states.leftDownPressed)
            this.rect.style.setProperty("transform", "scaleX(1)");
    }

    calculateNewX() : number {
        const currPosX = parseInt(this.rect.style.left);
        const width = this.rect.offsetWidth;
        const maxX = availableWidth - width;

        let newAcceleration = this.#currAccelerationX;
        
        if (keys.states.leftDownPressed)
            newAcceleration -= this.acceleration;
        else if (keys.states.rightDownPressed)
            newAcceleration += this.acceleration;
        else {
            if ((this.#currAccelerationX > 0 && this.#currAccelerationX < 0.5) || (this.#currAccelerationX < 0 && this.#currAccelerationX > -0.5)) {
                newAcceleration = 0;
            }
            else if (this.#currAccelerationX > 0)
                newAcceleration -= this.acceleration;
            else if (this.#currAccelerationX < 0)
                newAcceleration += this.acceleration;
            
        }

        let newPosX = currPosX + newAcceleration;

        this.#currAccelerationX = this.correctAcceleration(newAcceleration);
        
        if (newPosX < 0) {
            newPosX = 0;
            this.#currAccelerationX = 0;
        } else if (newPosX > maxX) {
            newPosX = maxX;
            this.#currAccelerationX = 0;
        }

        return newPosX;
    }

    calculateNewY() : number {
        const currPosY = parseInt(this.rect.style.top);
        const height = this.rect.offsetHeight;
        const maxY = availableHeight - height;

        let newAcceleration = this.#currAccelerationY + (keys.states.upDownPressed ? -this.acceleration : this.acceleration);
        let newPosY = currPosY + newAcceleration;

        this.#currAccelerationY = this.correctAcceleration(newAcceleration);
        
        if (newPosY < 0) {
            newPosY = 0;
            this.#currAccelerationY = 0;
        } else if (newPosY > maxY) {
            newPosY = maxY;
            this.#currAccelerationY = 0;
        }

        return newPosY;
    }

    correctAcceleration(acceleration: number): number {
        if (acceleration > this.maxSpeed)
            return this.maxSpeed;
        else if (acceleration < -this.maxSpeed)
            return -this.maxSpeed;

        return acceleration;
    }
}