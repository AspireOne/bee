"use strict";
const keys = {
    up: {
        definition: [' ', 'w', 'W'],
        downPressed: false,
    },
    right: {
        definition: ['d', 'D'],
        downPressed: false,
    },
    left: {
        definition: ['a', 'A'],
        downPressed: false,
    },
    changeDownPressed: function (definition, downPressed) {
        let changed = false;
        Object.values(keys).forEach((x) => {
            var _a;
            if ((_a = x === null || x === void 0 ? void 0 : x.definition) === null || _a === void 0 ? void 0 : _a.includes(definition)) {
                x.downPressed = downPressed;
                changed = true;
                // keep iterating if two keys had the same definition
            }
        });
        return changed;
    }
};
function onKeyDown(e) {
    if (keys.changeDownPressed(e instanceof KeyboardEvent && !ignoreUserInput ? e.key : e, true) && e instanceof KeyboardEvent)
        e.preventDefault();
}
function onKeyUp(e) {
    if (keys.changeDownPressed(e instanceof KeyboardEvent && !ignoreUserInput ? e.key : e, false) && e instanceof KeyboardEvent)
        e.preventDefault();
}
let ignoreUserInput = false;
var Program;
(function (Program) {
    let widthIndicator;
    let heightIndicator;
    let hueSlide;
    let player;
    let autopilotButton;
    let autopilotButtonTextSpan;
    let autopilot;
    let screenSaverPilot;
    //#region event listeners
    document.addEventListener("DOMContentLoaded", _ => {
        let floatingElement = document.getElementById("js-rect");
        widthIndicator = document.getElementById("js-width-indicator");
        heightIndicator = document.getElementById("js-height-indicator");
        hueSlide = document.getElementById("hue-slide");
        autopilotButton = document.getElementById("autopilot-button");
        autopilotButtonTextSpan = document.getElementById("js-autopilot-button-text-span");
        if (floatingElement !== null)
            floatingElement = floatingElement;
        else
            throw new Error("The element was null.");
        player = new MovingElements.Player(floatingElement);
        addListeners();
        player.start();
        autopilot = new MovingElements.Autopilot();
        screenSaverPilot = new MovingElements.screenSaverPilot(player);
    });
    /*
        document.addEventListener('mousemove', e => {
            const offset = 27;
            new VanishingCircle(e.x - offset, e.y - offset, 700, 80, 1).show();
        });
      */
    function addListeners() {
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        hueSlide.addEventListener("input", (e) => player.circleHue = parseInt(hueSlide.value));
        autopilotButton.addEventListener("mousedown", (e) => {
            // Magic strings all the way. It's 6am, I didn't go to sleep yet, and I'm too tired to write proper code. Gotta fix it tomorrow.
            switch (autopilotButtonTextSpan.innerHTML) {
                case "Autopilot OFF":
                    autopilotButtonTextSpan.innerHTML = "Včelka Mája ON";
                    autopilot.start();
                    ignoreUserInput = true;
                    break;
                case "Včelka Mája ON":
                    autopilotButtonTextSpan.innerHTML = "Screensaver ON";
                    autopilot.stop();
                    screenSaverPilot.start();
                    player.accelerationData.acceleration += 0.3;
                    player.maxSpeed -= 3;
                    break;
                case "Screensaver ON":
                    screenSaverPilot.stop();
                    player.accelerationData.acceleration -= 0.3;
                    player.maxSpeed += 3;
                    autopilotButtonTextSpan.innerHTML = "Autopilot OFF";
                    ignoreUserInput = false;
                    break;
            }
        });
    }
    Program.getAvailableHeight = () => heightIndicator === null || heightIndicator === void 0 ? void 0 : heightIndicator.clientHeight;
    Program.getAvailableWidth = () => widthIndicator === null || widthIndicator === void 0 ? void 0 : widthIndicator.clientWidth;
})(Program || (Program = {}));
var MovingElements;
(function (MovingElements) {
    let WayX;
    (function (WayX) {
        WayX[WayX["LEFT"] = 0] = "LEFT";
        WayX[WayX["RIGHT"] = 1] = "RIGHT";
        WayX[WayX["NONE"] = 2] = "NONE";
    })(WayX || (WayX = {}));
    class Player {
        constructor(element) {
            this.maxSpeed = 8;
            this.deltaTime = 8;
            this.accelerationData = new Acceleration();
            this.id = null;
            this.wayX = WayX.NONE;
            this.timeFromLastCircle = 0;
            this.circleFrequency = 10;
            this.circleHue = 0;
            this.element = element;
            this.element.style.top = Program.getAvailableHeight() - this.element.offsetHeight + "px";
            this.element.style.left = "0px";
            this.element.onclick = () => {
                let text = document.getElementById("js-rectText");
                text.innerHTML = "Bzzzzz";
                text.style.left = element.style.left;
                text.style.top = parseInt(element.style.top) - 40 + "px";
                setTimeout(() => text.innerHTML = "", 1500);
            };
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
            let newY = this.calculateNewY();
            let newX = this.calculateNewX();
            this.element.style.top = newY + "px";
            this.element.style.left = newX + "px";
            this.flipElement();
            if ((this.timeFromLastCircle += this.deltaTime) >= this.circleFrequency) {
                this.timeFromLastCircle = 0;
                new VanishingCircle(newX, newY, 400, 80, 1, this.circleHue).show();
            }
        }
        flipElement() {
            let scale = 0;
            if (keys.right.downPressed)
                scale = -1;
            else if (keys.left.downPressed)
                scale = 1;
            if (scale !== 0)
                this.element.style.setProperty("transform", "scaleX(" + scale + ")");
        }
        calculateNewX() {
            const currPosX = parseInt(this.element.style.left);
            const width = this.element.offsetWidth;
            const maxX = Program.getAvailableWidth() - width;
            const getUpdatedWay = () => {
                if (this.accelerationData.currAccelerationX > 0)
                    return WayX.RIGHT;
                else if (this.accelerationData.currAccelerationX < 0)
                    return WayX.LEFT;
                else
                    return WayX.NONE;
            };
            const updatedWay = getUpdatedWay();
            let newAcceleration = this.accelerationData.currAccelerationX;
            if (keys.left.downPressed)
                newAcceleration -= this.accelerationData.acceleration;
            else if (keys.right.downPressed)
                newAcceleration += this.accelerationData.acceleration;
            else {
                if (updatedWay != this.wayX)
                    newAcceleration = 0;
                else if (this.accelerationData.currAccelerationX > 0)
                    newAcceleration -= this.accelerationData.acceleration;
                else if (this.accelerationData.currAccelerationX < 0)
                    newAcceleration += this.accelerationData.acceleration;
            }
            let newPosX = currPosX + newAcceleration;
            this.accelerationData.currAccelerationX = this.correctAcceleration(newAcceleration);
            this.wayX = updatedWay;
            if (newPosX < 0) {
                newPosX = 0;
                this.accelerationData.currAccelerationX = 0;
            }
            else if (newPosX > maxX) {
                newPosX = maxX;
                this.accelerationData.currAccelerationX = 0;
            }
            return newPosX;
        }
        calculateNewY() {
            const currPosY = parseInt(this.element.style.top);
            const height = this.element.offsetHeight;
            const maxY = Program.getAvailableHeight() - height;
            let newAcceleration = this.accelerationData.currAccelerationY + (keys.up.downPressed ? -this.accelerationData.acceleration : this.accelerationData.acceleration);
            let newPosY = currPosY + newAcceleration;
            this.accelerationData.currAccelerationY = this.correctAcceleration(newAcceleration);
            if (newPosY < 0) {
                newPosY = 0;
                this.accelerationData.currAccelerationY = 0;
            }
            else if (newPosY > maxY) {
                newPosY = maxY;
                this.accelerationData.currAccelerationY = 0;
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
    MovingElements.Player = Player;
    let Acceleration = /** @class */ (() => {
        class Acceleration {
            constructor(acceleration = 0.12) {
                this.currAccelerationX = 0;
                this.currAccelerationY = 0;
                this._acceleration = 0.12;
                this._accelerationDivided = 0;
                this.acceleration = acceleration;
            }
            get acceleration() {
                return this._acceleration;
            }
            set acceleration(newAcceleration) {
                this._acceleration = newAcceleration;
                this._accelerationDivided = newAcceleration / Acceleration.divisionFactor;
            }
            get accelerationDivided() {
                return this._accelerationDivided;
            }
        }
        Acceleration.divisionFactor = 1.8;
        return Acceleration;
    })();
    let screenSaverPilot = /** @class */ (() => {
        class screenSaverPilot {
            constructor(element) {
                this.x = 0;
                this.y = 0;
                this.up = false;
                this.left = false;
                this.id = 0;
                this.running = false;
                this.player = element;
            }
            start() {
                this.running = true;
                this.id = setInterval(() => this.frame(), screenSaverPilot.delta);
            }
            stop() {
                this.running = false;
                clearInterval(this.id);
                onKeyUp(keys.left.definition[0]);
                onKeyUp(keys.right.definition[0]);
                onKeyUp(keys.up.definition[0]);
            }
            frame() {
                let elemX = parseInt(this.player.element.style.left.replace("px", ""));
                let elemY = parseInt(this.player.element.style.top.replace("px", ""));
                let maxX = Program.getAvailableWidth() - this.player.element.clientWidth;
                let maxY = Program.getAvailableHeight() - this.player.element.clientHeight;
                if (elemX <= 0) {
                    this.left = false;
                    onKeyUp(keys.left.definition[0]);
                    onKeyDown(keys.right.definition[0]);
                }
                else if (elemX >= maxX) {
                    this.left = true;
                    onKeyUp(keys.right.definition[0]);
                    onKeyDown(keys.left.definition[0]);
                }
                else if (this.player.accelerationData.currAccelerationX == 0) {
                    onKeyDown(keys.left.definition[0]);
                }
                if (elemY <= 0) {
                    this.up = false;
                    onKeyUp(keys.up.definition[0]);
                }
                else if (elemY >= maxY) {
                    this.up = true;
                    onKeyDown(keys.up.definition[0]);
                }
            }
        }
        screenSaverPilot.delta = 10;
        return screenSaverPilot;
    })();
    MovingElements.screenSaverPilot = screenSaverPilot;
    let Autopilot = /** @class */ (() => {
        class Autopilot {
            constructor() {
                this.currDelayX = 500;
                this.currDelayY = 500;
                this.elapsedToDelayX = 0;
                this.currPressedKeyX = "";
                this.currPressedKeyY = "";
                this.elapsedToDelayY = 0;
                this.id = 0;
                this.running = false;
                this.getRandomDelay = () => (Math.random() * (Autopilot.maxDelay - Autopilot.minDelay)) + Autopilot.minDelay;
            }
            start() {
                if (this.running)
                    return;
                this.running = true;
                this.id = setInterval(() => {
                    this.updateX();
                    this.updateY();
                }, Autopilot.delta);
            }
            stop() {
                clearInterval(this.id);
                this.id = 0;
                this.running = false;
                this.resetX();
                this.resetY();
            }
            // this Y X duplication could be solved by a shared interface or abstract class (as a lot of other things) or what they use here lol, but who has time for that
            updateX() {
                if ((this.elapsedToDelayX += Autopilot.delta) >= this.currDelayX) {
                    this.resetX();
                    this.executeNewX();
                }
            }
            resetX() {
                this.elapsedToDelayX = 0;
                if (this.currPressedKeyX != "")
                    onKeyUp(this.currPressedKeyX);
            }
            executeNewX() {
                this.currDelayX = this.getRandomDelay();
                const randomKey = Autopilot.possibleKeysX[Math.floor(Math.random() * Autopilot.possibleKeysX.length)];
                this.currPressedKeyX = randomKey;
                if (randomKey != "")
                    onKeyDown(randomKey);
            }
            updateY() {
                if ((this.elapsedToDelayY += Autopilot.delta) >= this.currDelayY) {
                    this.resetY();
                    this.executeNewY();
                }
            }
            resetY() {
                this.elapsedToDelayY = 0;
                if (this.currPressedKeyY != "")
                    onKeyUp(this.currPressedKeyY);
            }
            executeNewY() {
                this.currDelayY = this.getRandomDelay();
                const randomKey = Autopilot.possibleKeysY[Math.floor(Math.random() * Autopilot.possibleKeysY.length)];
                this.currPressedKeyY = randomKey;
                if (randomKey != "")
                    onKeyDown((randomKey));
            }
        }
        Autopilot.delta = 50;
        Autopilot.maxDelay = 500;
        Autopilot.minDelay = 100;
        Autopilot.possibleKeysX = ["", "a", "d"];
        Autopilot.possibleKeysY = ["", "w"];
        return Autopilot;
    })();
    MovingElements.Autopilot = Autopilot;
})(MovingElements || (MovingElements = {}));
let VanishingCircle = /** @class */ (() => {
    class VanishingCircle {
        constructor(x, y, vanishIn = 400, width = 60, initialOpacity = 0.8, hue = 0) {
            this.elapsed = 0;
            this.id = 0;
            this.vanishIn = vanishIn;
            this.hue = hue;
            this.initialOpacity = initialOpacity;
            this.x = x + "px";
            this.y = y + "px";
            this.decreaseBy = initialOpacity / (vanishIn / VanishingCircle.delta);
            this.prevOpacity = initialOpacity;
            this.width = width + "px";
            this.clone = this.createClone();
        }
        createClone() {
            let circle = document.getElementById("js-circle");
            let clone = circle.cloneNode(true);
            Object.assign(clone.style, {
                left: this.x,
                top: this.y,
                width: this.width,
                display: "block",
                opacity: this.initialOpacity,
                filter: `blur(3px) hue-rotate(${this.hue}deg)`,
            });
            return clone;
        }
        show() {
            document.body.appendChild(this.clone);
            this.id = setInterval(() => this.vanish(), VanishingCircle.delta);
        }
        vanish() {
            this.elapsed += VanishingCircle.delta;
            let newOpacity = this.prevOpacity - this.decreaseBy;
            if (this.elapsed >= this.vanishIn) {
                this.clone.style.display = "none";
                document.body.removeChild(this.clone);
                clearInterval(this.id);
            }
            else {
                this.prevOpacity = newOpacity;
                this.clone.style.opacity = newOpacity.toString();
            }
        }
    }
    VanishingCircle.delta = 20;
    return VanishingCircle;
})();
