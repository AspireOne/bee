const keys:Readonly<any> = {
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
    changeDownPressed: function(definition:string, downPressed:boolean): boolean {
        let changed: boolean = false;
        Object.values(keys).forEach((x:any) => {
            if (x?.definition?.includes(definition)) {
                x.downPressed = downPressed;
                changed = true;
                // keep iterating if two keys had the same definition
            }
        })
        return changed;
    }
}

function onKeyDown(e: KeyboardEvent | string) {
    if (keys.changeDownPressed(e instanceof KeyboardEvent && !ignoreUserInput ? e.key : e, true) && e instanceof KeyboardEvent)
        e.preventDefault();
}

function onKeyUp(e: KeyboardEvent | string) {
    if (keys.changeDownPressed(e instanceof KeyboardEvent && !ignoreUserInput ? e.key : e, false) && e instanceof KeyboardEvent)
        e.preventDefault();
}

let ignoreUserInput = false;

namespace Program {
    let widthIndicator:HTMLElement;
    let heightIndicator:HTMLElement;
    let hueSlide:HTMLInputElement;
    let player:MovingElements.Player;
    let autopilotButton:HTMLInputElement;
    let autopilotButtonTextSpan:HTMLElement;
    let autopilot:MovingElements.Autopilot;
    let screenSaverPilot:MovingElements.screenSaverPilot;

    //#region event listeners
    document.addEventListener("DOMContentLoaded", _ => {
        let floatingElement = document.getElementById("js-rect") as HTMLElement;
        widthIndicator = document.getElementById("js-width-indicator") as HTMLElement;
        heightIndicator = document.getElementById("js-height-indicator") as HTMLElement;
        hueSlide = document.getElementById("hue-slide") as HTMLInputElement;
        autopilotButton = document.getElementById("autopilot-button") as HTMLInputElement;
        autopilotButtonTextSpan = document.getElementById("js-autopilot-button-text-span") as HTMLElement;

        if (floatingElement !== null)
            floatingElement = floatingElement as HTMLElement;
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
        autopilotButton.addEventListener("mousedown",  (e) => {
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
                    autopilotButtonTextSpan.innerHTML = "Autopilot OFF"
                    ignoreUserInput = false;
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

    export class Player {
        public element:HTMLElement;
        public maxSpeed = 8;
        public deltaTime = 8;
        public accelerationData = new Acceleration();
        private id:number | null = null;
        private wayX:WayX = WayX.NONE;
        private timeFromLastCircle = 0;
        private circleFrequency = 10;
        public circleHue = 0;
    
        constructor(element:HTMLElement) {
            this.element = element;

            this.element.style.top = Program.getAvailableHeight() - this.element.offsetHeight + "px";
            this.element.style.left = "0px";
            this.element.onclick = () => {
                let text = document.getElementById("js-rectText") as HTMLElement;
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

            this.element.style.top = newY + "px";
            this.element.style.left = newX + "px";

            this.flipElement();

            if ((this.timeFromLastCircle += this.deltaTime) >= this.circleFrequency) {
                this.timeFromLastCircle = 0;
                new VanishingCircle(newX, newY, 400, 80, 1, this.circleHue).show();
            }
        }
    
        private flipElement() {
            let scale = 0;

            if (keys.right.downPressed)
                scale = -1;
            else if (keys.left.downPressed)
                scale = 1;

            if (scale !== 0)
                this.element.style.setProperty("transform", "scaleX(" + scale + ")");
        }
    
        private calculateNewX():number {
            const currPosX = parseInt(this.element.style.left);
            const width = this.element.offsetWidth;
            const maxX = Program.getAvailableWidth() - width;
            const getUpdatedWay = ():WayX => {
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
    
        private calculateNewY():number {
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
    
        private correctAcceleration(acceleration:number):number {
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
        private _acceleration:number = 0.12;
        private _accelerationDivided:number = 0;

        constructor(acceleration = 0.12) {
            this.acceleration = acceleration;
        }

        public get acceleration() {
            return this._acceleration;
        }

        public set acceleration(newAcceleration) {
            this._acceleration = newAcceleration;
            this._accelerationDivided = newAcceleration/Acceleration.divisionFactor;
        }

        public get accelerationDivided() {
            return this._accelerationDivided;
        }
    }

    export class screenSaverPilot {
        public readonly player:Player;
        private static readonly delta = 10;
        private x = 0;
        private y = 0;
        private up = false;
        private left = false;
        private id = 0;
        public running = false;

        constructor(element:Player) {
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
                this.left = false;
                onKeyUp(keys.left.definition[0]);
                onKeyDown(keys.right.definition[0]);
            } else if (elemX >= maxX) {
                this.left = true;
                onKeyUp(keys.right.definition[0]);
                onKeyDown(keys.left.definition[0]);
            } else if (this.player.accelerationData.currAccelerationX == 0){
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

    export class Autopilot {
        private static readonly delta = 50;
        private static readonly maxDelay = 500;
        private static readonly minDelay = 100;
        private static readonly possibleKeysX = ["", "a", "d"];
        private static readonly possibleKeysY = ["", "w"];
        private currDelayX = 500;
        private currDelayY = 500;
        private elapsedToDelayX = 0;
        private currPressedKeyX:string = "";
        private currPressedKeyY:string = "";
        private elapsedToDelayY = 0;
        private id = 0;
        public running = false;
        
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

        // this Y X duplication could be solved by a shared interface or abstract class (as a lot of other things) or what they use here lol, but who has time for that

        private updateX() {
            if ((this.elapsedToDelayX += Autopilot.delta) >= this.currDelayX) {
                this.resetX();
                this.executeNewX();
            }
        }

        private resetX() {
            this.elapsedToDelayX = 0;
            if (this.currPressedKeyX != "")
                onKeyUp(this.currPressedKeyX);
        }

        private executeNewX() {
            this.currDelayX = this.getRandomDelay();
            const randomKey = Autopilot.possibleKeysX[Math.floor(Math.random() * Autopilot.possibleKeysX.length)];
            this.currPressedKeyX = randomKey;
            if (randomKey != "")
                onKeyDown(randomKey);
        }

        private updateY() {
            if ((this.elapsedToDelayY += Autopilot.delta) >= this.currDelayY) {
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
            this.currDelayY = this.getRandomDelay();
            
            const randomKey = Autopilot.possibleKeysY[Math.floor(Math.random() * Autopilot.possibleKeysY.length)];
            this.currPressedKeyY = randomKey;
            if (randomKey != "")
                onKeyDown((randomKey));
        }

        private getRandomDelay = () => (Math.random() * (Autopilot.maxDelay - Autopilot.minDelay)) + Autopilot.minDelay;
    }
}

class VanishingCircle {
    private static readonly delta = 20;
    public readonly vanishIn:number;
    public readonly x:string;
    public readonly y:string;
    public readonly initialOpacity:number;
    public readonly width:string;
    public readonly hue:number;
    private elapsed = 0;
    private id:number = 0;
    private prevOpacity:number;
    private readonly decreaseBy:number;
    private readonly clone:HTMLElement;

    public constructor(x:number, y:number, vanishIn = 400, width = 60, initialOpacity = 0.8, hue = 0) {
        this.vanishIn = vanishIn;
        this.hue = hue;
        this.initialOpacity = initialOpacity;
        this.x = x + "px";
        this.y = y + "px";
        this.decreaseBy = initialOpacity/(vanishIn/VanishingCircle.delta);
        this.prevOpacity = initialOpacity;
        this.width = width + "px";
        this.clone = this.createClone();
    }

    private createClone() {
        let circle = document.getElementById("js-circle") as HTMLElement;
        let clone = circle.cloneNode(true) as HTMLElement;
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

    public show() {
        document.body.appendChild(this.clone);
        this.id = setInterval(() => this.vanish(), VanishingCircle.delta);
    }

    private vanish() {
        this.elapsed += VanishingCircle.delta;
        let newOpacity = this.prevOpacity - this.decreaseBy;

        if (this.elapsed >= this.vanishIn){
            this.clone.style.display = "none";
            document.body.removeChild(this.clone);
            clearInterval(this.id);
        } else {
            this.prevOpacity = newOpacity;
            this.clone.style.opacity = newOpacity.toString();
        }
    }
}