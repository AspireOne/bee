const keys: Readonly<any> = {
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
    floss: {
        definition: ["Shift"],
        downPressed: false,
    },
    changeDownPressed: function (definition: string, downPressed: boolean): boolean {
        let changed = false;
        Object.values(keys).forEach((x: any) => {
            if (x?.definition?.includes(definition)) {
                x.downPressed = downPressed;
                changed = true;
                // Keep iterating because two keys could have the same definition.
            }
        })

        return changed;
    }
}

let ignoreUserInput = false;
const onKeyDown = (e: KeyboardEvent | string) => onKeyChange(e, true);
const onKeyUp = (e: KeyboardEvent | string) => onKeyChange(e, false);

function onKeyChange(e: KeyboardEvent | string, keyDown: boolean) {
    if (keys.changeDownPressed(e instanceof KeyboardEvent && !ignoreUserInput ? e.key : e, keyDown) && e instanceof KeyboardEvent)
        e.preventDefault();
}


namespace Program {
    let widthIndicator: HTMLElement;
    let heightIndicator: HTMLElement;
    let pilotOrderText: HTMLElement;
    let hueSlide: HTMLInputElement;
    let player: MovingElements.Player;
    let autopilotButton: HTMLInputElement;
    let autopilotButtonTextSpan: HTMLElement;
    let autopilot: MovingElements.Autopilot;
    let screenSaverPilot: MovingElements.screenSaverPilot;

    //#region event listeners.
    document.addEventListener("DOMContentLoaded", _ => {
        let floatingElement = document.getElementById("js-rect") as HTMLElement;
        widthIndicator = document.getElementById("js-width-indicator") as HTMLElement;
        heightIndicator = document.getElementById("js-height-indicator") as HTMLElement;
        hueSlide = document.getElementById("hue-slide") as HTMLInputElement;
        autopilotButton = document.getElementById("autopilot-button") as HTMLInputElement;
        autopilotButtonTextSpan = document.getElementById("js-autopilot-button-text-span") as HTMLElement;
        pilotOrderText = document.getElementById("pilot-order") as HTMLElement;
        pilotOrderText.innerText = "1/3";

        if (floatingElement !== null)
            floatingElement = floatingElement as HTMLElement;
        else
            throw new Error("The element was null.");

        player = new MovingElements.Player(floatingElement);
        addListeners();
        player.start();

        autopilot = new MovingElements.Autopilot(player);
        screenSaverPilot = new MovingElements.screenSaverPilot(player);
    });

    /*
    // Adds circleVanishing effect to the cursor.
    document.addEventListener('mousemove', e => {
        const offset = 33;
        new VanishingCircle(e.x - offset, e.y - offset, 700, 80, 1).show();
    });
    */

    function addListeners() {
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        hueSlide.addEventListener("input", (e) => player.circleHue = parseInt(hueSlide.value));
        autopilotButton.addEventListener("mousedown", (e) => {
            const autoPilotOff = "Autopilot OFF";
            const majaBeeOn = "Včelka mája ON";
            const screenSaverOn = "Screen Saver ON";
            const screenSaverAccelerationIncrease = 0.3;
            const screenSaverSpeedDecrease = 3;
            const majaBeeSpeedDecrease = 1;
            const modes = 3;

            switch (autopilotButtonTextSpan.innerHTML) {
                case autoPilotOff:
                    autopilotButtonTextSpan.innerHTML = majaBeeOn;
                    autopilot.start();
                    ignoreUserInput = true;
                    pilotOrderText.innerText = "2/" + modes;
                    player.maxSpeed -= majaBeeSpeedDecrease;
                    break;
                case majaBeeOn:
                    autopilotButtonTextSpan.innerHTML = screenSaverOn;
                    autopilot.stop();
                    screenSaverPilot.start();
                    player.maxSpeed += majaBeeSpeedDecrease;
                    player.accelerationData.acceleration += screenSaverAccelerationIncrease;
                    player.maxSpeed -= screenSaverSpeedDecrease;
                    ignoreUserInput = true;
                    pilotOrderText.innerText = "3/" + modes;
                    break;
                case screenSaverOn:
                    screenSaverPilot.stop();
                    player.accelerationData.acceleration -= screenSaverAccelerationIncrease;
                    player.maxSpeed += screenSaverSpeedDecrease;
                    autopilotButtonTextSpan.innerHTML = autoPilotOff;
                    ignoreUserInput = false;
                    pilotOrderText.innerText = "1/" + modes;
                    break;
            }
        });
    }
    export const getAvailableHeight = () => heightIndicator?.clientHeight;
    export const getAvailableWidth = () => widthIndicator?.clientWidth;
}

namespace MovingElements {
    enum WayX {
        LEFT,
        RIGHT,
        NONE
    }

    export class Player implements Pilot {
        public currY = 0;
        public currX = 0;
        public element: HTMLElement;
        public maxSpeed = 7;
        public deltaTime = 8;
        public accelerationData = new Acceleration();
        public circleHue = 0;
        private id: number | null = null;
        private wayX: WayX = WayX.NONE;
        private timeFromLastCircle = 0;
        private circleFrequency = 10;
        private scale = 0;

        constructor(element: HTMLElement) {
            this.element = element;
            this.scale = parseInt(element.style.transform.replace(/\D/g, ""));

            this.element.style.top = Program.getAvailableHeight() - this.element.offsetHeight + "px";
            this.element.style.left = "0px";
            this.element.onclick = () => {
                let text = document.getElementById("js-rect-text") as HTMLElement;
                text.innerHTML = "Bzzzzz";
                text.style.left = element.style.left;
                text.style.top = parseInt(element.style.top) - 40 + "px";
                setTimeout(() => text.innerHTML = "", 1500);
            }
        }

        public start() {
            if (this.id === null)
                this.id = setInterval(() => this.frame(), this.deltaTime);
        }

        public stop() {
            if (this.id !== null) {
                clearInterval(this.id);
                this.id = null;
            }
        }

        private frame() {
            let newY = this.calculateNewY();
            let newX = this.calculateNewX();
            this.currY = newY;
            this.currX = newX;

            this.element.style.top = newY + "px";
            this.element.style.left = newX + "px";

            this.flipElementIfShould();

            if ((this.timeFromLastCircle += this.deltaTime) >= this.circleFrequency) {
                this.timeFromLastCircle = 0;
                new VanishingCircle(newX, newY, keys.floss.downPressed ? 2000 : 400, 80, 1, this.circleHue).show();
            }
        }

        private flipElementIfShould() {
            let scale = 0;

            if (keys.right.downPressed)
                scale = -1;
            else if (keys.left.downPressed)
                scale = 1;

            if (scale !== 0 && scale !== this.scale) {
                this.element.style.setProperty("transform", "scaleX(" + scale + ")");
                this.scale = scale;
            }
        }

        private calculateNewX(): number {
            const currPosX = parseInt(this.element.style.left);
            const width = this.element.offsetWidth;
            const maxX = Program.getAvailableWidth() - width;
            const getUpdatedWay = (): WayX => {
                if (this.accelerationData.currAccelerationX > 0)
                    return WayX.RIGHT;
                else if (this.accelerationData.currAccelerationX < 0)
                    return WayX.LEFT;
                else
                    return WayX.NONE;
            }
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
            } else if (newPosX > maxX) {
                newPosX = maxX;
                this.accelerationData.currAccelerationX = 0;
            }

            return newPosX;
        }

        private calculateNewY(): number {
            const currPosY = parseInt(this.element.style.top);
            const height = this.element.offsetHeight;
            const maxY = Program.getAvailableHeight() - height;

            let newAcceleration = this.accelerationData.currAccelerationY + (keys.up.downPressed ? -this.accelerationData.acceleration : this.accelerationData.acceleration);
            let newPosY = currPosY + newAcceleration;

            this.accelerationData.currAccelerationY = this.correctAcceleration(newAcceleration);

            if (newPosY < 0) {
                newPosY = 0;
                this.accelerationData.currAccelerationY = 0;
            } else if (newPosY > maxY) {
                newPosY = maxY;
                this.accelerationData.currAccelerationY = 0;
            }

            return newPosY;
        }

        private correctAcceleration(acceleration: number): number {
            if (acceleration > this.maxSpeed)
                return this.maxSpeed;
            else if (acceleration < -this.maxSpeed)
                return -this.maxSpeed;

            return acceleration;
        }
    }

    class Acceleration {
        private static readonly divisionFactor = 1.8;
        public currAccelerationX = 0;
        public currAccelerationY = 0;
        private _acceleration: number = 0.12;
        private _accelerationDivided: number = 0;

        constructor(acceleration = 0.12) {
            this.acceleration = acceleration;
        }

        public get acceleration() {
            return this._acceleration;
        }

        public set acceleration(newAcceleration) {
            this._acceleration = newAcceleration;
            this._accelerationDivided = newAcceleration / Acceleration.divisionFactor;
        }

        public get accelerationDivided() {
            return this._accelerationDivided;
        }
    }

    export interface Pilot { }

    export class screenSaverPilot implements Pilot {
        public readonly player: Player;
        private static readonly delta = 10;
        private id = 0;
        public running = false;

        constructor(element: Player) {
            this.player = element;
        }

        public start() {
            this.running = true;
            this.id = setInterval(() => this.frame(), screenSaverPilot.delta);
        }

        public stop() {
            this.running = false;
            clearInterval(this.id);
            onKeyUp(keys.left.definition[0]);
            onKeyUp(keys.right.definition[0]);
            onKeyUp(keys.up.definition[0]);
        }

        private frame() {
            let elemX = parseInt(this.player.element.style.left.replace("px", ""));
            let elemY = parseInt(this.player.element.style.top.replace("px", ""));
            let maxX = Program.getAvailableWidth() - this.player.element.clientWidth;
            let maxY = Program.getAvailableHeight() - this.player.element.clientHeight;

            if (elemX <= 0) {
                onKeyUp(keys.left.definition[0]);
                onKeyDown(keys.right.definition[0]);
            } else if (elemX >= maxX) {
                onKeyUp(keys.right.definition[0]);
                onKeyDown(keys.left.definition[0]);
            } else if (this.player.accelerationData.currAccelerationX == 0) {
                onKeyDown(keys.left.definition[0]);
            }

            if (elemY <= 0) {
                onKeyUp(keys.up.definition[0]);
            }
            else if (elemY >= maxY) {
                onKeyDown(keys.up.definition[0]);
            }
        }
    }

    export class Autopilot implements Pilot {
        private static readonly delta = 50;
        private static readonly maxDelay = 550;
        private static readonly minDelay = 150;
        private static readonly possibleKeysX = ["", "a", "d"];
        private static readonly possibleKeysY = ["", "w"];
        private currDelayX = 500;
        private currDelayY = 500;
        private elapsedToDelayX = 0;
        private currPressedKeyX: string = "";
        private currPressedKeyY: string = "";
        private elapsedToDelayY = 0;
        private id = 0;
        private playerPosCheckOffset = 90;
        readonly player: Player;
        public running = false;

        constructor(player: Player) {
            this.player = player;
        }

        public start() {
            if (this.running)
                return;

            this.running = true;
            this.id = setInterval(() => {
                this.updateX();
                this.updateY();
            }, Autopilot.delta);
        }

        public stop() {
            clearInterval(this.id);
            this.id = 0;
            this.running = false;

            this.resetX();
            this.resetY();
        }

        // This Y X duplication could be solved by a shared interface or abstract class (as a lot of other things) or what they use here lol, but who has the time for that.

        private updateX() {
            /* If the bee is out of bounds (too close to a wall), do not respect current
             key delay and force an immediate update, which will make the bee fly out of it. */
            if ((this.elapsedToDelayX += Autopilot.delta) >= this.currDelayX || this.isXOutOfBounds()) {
                this.resetX();
                this.executeNewX();
            }
        }

        private resetX() {
            this.elapsedToDelayX = 0;
            if (this.currPressedKeyX != "")
                onKeyUp(this.currPressedKeyX);
        }

        private isXOutOfBounds(): boolean {
            const playerWidth = this.player.element.offsetWidth;
            const playerMaxX = Program.getAvailableWidth() - playerWidth;
            return this.player.currX >= playerMaxX - this.playerPosCheckOffset || this.player.currX <= this.playerPosCheckOffset;
        }

        private isYOutOfBounds(): boolean {
            const playerHeight = this.player.element.offsetHeight;
            const playerMaxY = Program.getAvailableHeight() - playerHeight;
            return this.player.currY >= playerMaxY - this.playerPosCheckOffset || this.player.currY <= this.playerPosCheckOffset;
        }

        private executeNewX() {
            let key: string;

            const playerWidth = this.player.element.offsetWidth;
            const playerMaxX = Program.getAvailableWidth() - playerWidth;

            if (this.player.currX >= playerMaxX - this.playerPosCheckOffset)
                key = "a";
            else if (this.player.currX <= this.playerPosCheckOffset)
                key = "d";
            else
                key = Autopilot.possibleKeysX[Math.floor(Math.random() * Autopilot.possibleKeysX.length)];

            this.currDelayX = this.getRandomDelay();
            this.currPressedKeyX = key;
            if (key != "")
                onKeyDown(key);
        }

        private updateY() {
            if ((this.elapsedToDelayY += Autopilot.delta) >= this.currDelayY || this.isYOutOfBounds()) {
                this.resetY();
                this.executeNewY();
            }
        }

        private resetY() {
            this.elapsedToDelayY = 0;
            if (this.currPressedKeyY != "")
                onKeyUp(this.currPressedKeyY);
        }

        private executeNewY() {
            let key: string;

            const playerHeight = this.player.element.offsetHeight;
            const playerMaxY = Program.getAvailableHeight() - playerHeight;

            if (this.player.currY >= playerMaxY - this.playerPosCheckOffset)
                key = "w";
            else if (this.player.currY <= this.playerPosCheckOffset)
                key = "";
            else
                key = Autopilot.possibleKeysY[Math.floor(Math.random() * Autopilot.possibleKeysY.length)];

            this.currDelayY = this.getRandomDelay();
            this.currPressedKeyY = key;
            if (key != "")
                onKeyDown((key));
        }

        private getRandomDelay = () => (Math.random() * (Autopilot.maxDelay - Autopilot.minDelay)) + Autopilot.minDelay;
    }
}


class VanishingCircle {
    public readonly vanishIn: number;
    public readonly x: string;
    public readonly y: string;
    public readonly initialOpacity: number;
    public readonly width: string;
    public readonly hue: number;
    private static originalCircle: HTMLElement;
    private static readonly delta = 20;
    private elapsed = 0;
    private id: number = 0;
    private prevOpacity: number;
    private readonly decreaseBy: number;
    private readonly clone: HTMLElement;
    private readonly applyFilter: boolean = true;
    private readonly doNotApplyFilterThreshold = 1000;
    public constructor(x: number, y: number, vanishIn = 400, size = 60, initialOpacity = 0.8, hue = 0) {
        this.vanishIn = vanishIn;
        /* I didn't find a way to apply the filter to a lot of circles simulatenously without making the website laggy, so we'll
         just disable it if there's too many circles. */
        this.applyFilter = this.vanishIn < this.doNotApplyFilterThreshold;
        this.hue = hue;
        this.initialOpacity = initialOpacity;
        this.x = x + "px";
        this.y = y + "px";
        this.decreaseBy = initialOpacity / (vanishIn / VanishingCircle.delta);
        this.prevOpacity = initialOpacity;
        this.width = size + "px";
        this.clone = this.createClone();
    }

    private createClone() {
        if (VanishingCircle.originalCircle === undefined)
            VanishingCircle.originalCircle = document.getElementById("js-circle") as HTMLElement

        let clone = VanishingCircle.originalCircle.cloneNode(true) as HTMLElement;

        Object.assign(clone.style, {
            left: this.x,
            top: this.y,
            width: this.width,
            display: "block",
            opacity: this.initialOpacity,
            filter: this.applyFilter ? `blur(3px) hue-rotate(${this.hue}deg)` : '',
        });

        return clone;
    }

    public show() {
        document.body.appendChild(this.clone);
        this.id = setInterval(() => this.updateVanish(), VanishingCircle.delta);
    }

    private updateVanish() {
        this.elapsed += VanishingCircle.delta;
        let newOpacity = this.prevOpacity - this.decreaseBy;

        if (this.elapsed >= this.vanishIn) {
            this.clone.style.display = "none";
            document.body.removeChild(this.clone);
            clearInterval(this.id);
        } else {
            this.prevOpacity = newOpacity;
            this.clone.style.opacity = newOpacity.toString();
        }
    }
}