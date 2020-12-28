"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var _currAccelerationY, _currAccelerationX;
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
};
var availableHeight;
var availableWidth;
//#region event listeners
document.addEventListener("DOMContentLoaded", function () {
    availableHeight = screen.availHeight - (window.outerHeight - window.innerHeight);
    availableWidth = screen.availWidth - (window.outerWidth - window.innerWidth);
    let rect = document.getElementById("rect");
    if (rect !== null)
        rect = rect;
    else
        throw new Error("The rectange was null.");
    let floatingRect = new FloatingRectangle(rect);
    floatingRect.start();
});
document.addEventListener("keydown", function (e) {
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
document.addEventListener("keyup", function (e) {
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
    constructor(rectangle) {
        this.deltaTime = 8;
        this.acceleration = 0.1;
        this.maxSpeed = 8;
        _currAccelerationY.set(this, 0);
        _currAccelerationX.set(this, 0);
        this.wasGoingLeft = false;
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
    calculateNewX() {
        const currPosX = parseInt(this.rect.style.left);
        const width = this.rect.offsetWidth;
        const maxX = availableWidth - width;
        let newAcceleration = __classPrivateFieldGet(this, _currAccelerationX);
        if (keys.states.leftDownPressed)
            newAcceleration -= this.acceleration;
        else if (keys.states.rightDownPressed)
            newAcceleration += this.acceleration;
        else {
            if ((__classPrivateFieldGet(this, _currAccelerationX) > 0 && __classPrivateFieldGet(this, _currAccelerationX) < 0.5) || (__classPrivateFieldGet(this, _currAccelerationX) < 0 && __classPrivateFieldGet(this, _currAccelerationX) > -0.5)) {
                newAcceleration = 0;
            }
            else if (__classPrivateFieldGet(this, _currAccelerationX) > 0)
                newAcceleration -= this.acceleration;
            else if (__classPrivateFieldGet(this, _currAccelerationX) < 0)
                newAcceleration += this.acceleration;
        }
        let newPosX = currPosX + newAcceleration;
        __classPrivateFieldSet(this, _currAccelerationX, this.correctAcceleration(newAcceleration));
        if (newPosX < 0) {
            newPosX = 0;
            __classPrivateFieldSet(this, _currAccelerationX, 0);
        }
        else if (newPosX > maxX) {
            newPosX = maxX;
            __classPrivateFieldSet(this, _currAccelerationX, 0);
        }
        return newPosX;
    }
    calculateNewY() {
        const currPosY = parseInt(this.rect.style.top);
        const height = this.rect.offsetHeight;
        const maxY = availableHeight - height;
        let newAcceleration = __classPrivateFieldGet(this, _currAccelerationY) + (keys.states.upDownPressed ? -this.acceleration : this.acceleration);
        let newPosY = currPosY + newAcceleration;
        __classPrivateFieldSet(this, _currAccelerationY, this.correctAcceleration(newAcceleration));
        if (newPosY < 0) {
            newPosY = 0;
            __classPrivateFieldSet(this, _currAccelerationY, 0);
        }
        else if (newPosY > maxY) {
            newPosY = maxY;
            __classPrivateFieldSet(this, _currAccelerationY, 0);
        }
        return newPosY;
    }
    correctAcceleration(acceleration) {
        if (acceleration > this.maxSpeed)
            return this.maxSpeed;
        else if (acceleration < -this.maxSpeed)
            return -this.maxSpeed;
        return acceleration;
    }
}
_currAccelerationY = new WeakMap(), _currAccelerationX = new WeakMap();
