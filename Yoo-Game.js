/**
 * Yoo-Game.js
 * A 2d game library developed by Yoo-Babobo. (https://www.yoo-babobo.com)
 * Please note that there may be various bugs, and that this library might not have everything you need to complete your game. Please report any issues you may find at https://github.com/Yoo-Babobo/Yoo-Game.js/issues/new.
 */

"use strict";

const YooGame = {};
window.YooGame = YooGame;

(() => {
    class Game {
        constructor(element = document.createElement("div"), options = {}) {
            if (!(element instanceof HTMLElement))
                throw new TypeError("Please use an actual element for the game.");

            this.id = "game-" + YooGame.f.string();
            this.name = options.name || "Game";
            this.mX = 0;
            this.mXS = NaN;
            this.mXE = NaN;
            this.mY = 0;
            this.mYS = NaN;
            this.mYE = NaN;
            this.mouseDown = false;
            this.touchDown = false;
            this.mouseOnElement = null;
            this.hoveringOnElement = null;
            this.cursor = "default";
            this.width = options.width || 300;
            this.height = options.height || 150;
            this.actualWidth = this.width;
            this.actualHeight = this.height;
            this.scaleX = 1;
            this.scaleY = 1;
            this.backgroundColor = options.backgroundColor || "transparent";
            this.paused = false;
            this.fps = 0;
            this.time = 0;
            this.virtual = {};
            this.activeScene = options.activeScene || null;

            this.data = options.data || {};

            YooGame.f.initEventSystem(this);
            this.ons(options.on);

            this.element = element;
            this.element.id = this.id;
            this.element.innerHTML = `<div style="position: absolute !important; width: ${this.width}px !important; height: ${this.width}px !important;"></div>`;
            this.element.style.overflow = "hidden";
            this.canvas = document.createElement("canvas");
            this.canvas.style.display = "block";
            this.context = this.canvas.getContext("2d");
            this.virtual.canvas = document.createElement("canvas");
            this.virtual.context = this.virtual.canvas.getContext("2d");
            this.element.appendChild(this.canvas);

            const updateXY = (event, type) => {
                try {
                    const x = YooGame.f.empty(event.x) ? event.touches[0].pageX : event.pageX;
                    const y = YooGame.f.empty(event.y) ? event.touches[0].pageY : event.pageY;
                    this.mX = (x - this.element.offsetLeft) / this.scaleX;
                    this.mY = (y - this.element.offsetTop) / this.scaleY;
                    this.touches = event.touches || [];

                    if (type === "start") {
                        this.mXS = this.mX;
                        this.mYS = this.mY;
                        this.mXE = NaN;
                        this.mYE = NaN;
                    } else if (type === "end") {
                        this.mXS = NaN;
                        this.mYS = NaN;
                        this.mXE = this.mX;
                        this.mYE = this.mY;
                    }
                } catch { }
            };

            const down = event => {
                this.mouseDown = true;
                if (event instanceof TouchEvent)
                    this.touchDown = true;
                updateXY(event, "start");
                event.preventDefault();
                return false;
            };

            this.element.addEventListener("mousedown", down);
            this.element.addEventListener("touchstart", down);

            const up = event => {
                this.mouseDown = false;
                if (event instanceof TouchEvent)
                    this.touchDown = false;
                this.mouseOnElement = null;
                updateXY(event, "end");
                event.preventDefault();
                return false;
            };

            this.element.addEventListener("mouseup", up);
            this.element.addEventListener("mouseout", up);
            this.element.addEventListener("touchend", up);
            this.element.addEventListener("touchleave", up);
            this.element.addEventListener("touchcancel", up);

            const move = event => {
                updateXY(event);
                event.preventDefault();
                return false;
            };

            this.element.addEventListener("mousemove", move);
            this.element.addEventListener("touchmove", move);

            this.options = options || {};
            this.clone = () => new YooGame.Game(this.options);

            this.log = (...data) => {
                YooGame.f.log(this, ...data);
                return this;
            };

            this.resize = () => {
                if (parseFloat(this.element.style.width.replace("px", "")) !== this.width) {
                    this.element.style.width = this.width + "px";
                    this.element.children[0].style.width = this.width + "px";
                    this.canvas.width = this.width;
                }

                if (parseFloat(this.element.style.height.replace("px", "")) !== this.height) {
                    this.element.style.height = this.height + "px";
                    this.element.children[0].style.height = this.height + "px";
                    this.canvas.height = this.height;
                }

                return this;
            };

            this.play = () => {
                this.paused = false;
                return this;
            };
            this.pause = () => {
                this.paused = true;
                return this;
            }

            this.init = () => {
                this.resize();

                const fps = 60;
                const step = 1 / fps;
                let dt = 0;
                let now;
                let last = YooGame.f.timestamp();

                const frame = time => {
                    this.fps = 1 / ((performance.now() - this.time) / 1000);
                    this.time = time;

                    now = YooGame.f.timestamp();
                    dt = dt + Math.min(1, (now - last) / 1000);

                    while (dt > step) {
                        dt = dt - step;
                        if (!this.paused)
                            this.loop("update");
                    }

                    this.loop("render");
                    last = now;
                    window.requestAnimationFrame(frame);
                };

                frame();

                this.log("Initiated");

                this.trigger("init");

                return this;
            };

            this.loop = type => {
                if (!this.trigger("loop"))
                    return;

                if (type === "render") {
                    if (!this.trigger("render"))
                        return;

                    this.context.clearRect(0, 0, this.width, this.height);
                    this.context.fillStyle = this.backgroundColor;
                    this.context.fillRect(0, 0, this.width, this.height);

                    this.trigger("renderafter");
                } else {
                    if (!this.trigger("update"))
                        return;

                    if (this.width !== this.element.clientWidth)
                        this.scaleX = this.element.clientWidth / this.width;
                    if (this.height !== this.element.clientHeight)
                        this.scaleY = this.element.clientHeight / this.height;
                    this.element.style.cursor = this.cursor;

                    this.actualWidth = this.width * this.scaleX;
                    this.actualHeight = this.height * this.scaleY;
                }

                if (this.activeScene instanceof YooGame.Scene)
                    this.activeScene.loop(this, type);
            };

            this.activateScene = scene => {
                if (!this.trigger("scenechange", { scene }))
                    return this;
                this.activeScene = scene;
                this.cursor = "default";
                return this;
            };
            this.clearScene = () => {
                this.activeScene = null;
                return this;
            };
            this.displayHTMLScene = htmlScene => {
                this.element.children[0].innerHTML = htmlScene.html;
                return this;
            };
            this.clearHTMLScene = () => {
                this.element.children[0].innerHTML = "";
                return this;
            };

            return this;
        }
    }
    
    class Scene {
        constructor(options = {}) {
            this.id = "scene-" + YooGame.f.string();
            this.name = options.name || "Scene";
            this.x = options.x || 0;
            this.y = options.y || 0;
            this.width = 0;
            this.height = 0;
            this.backgroundColor = options.backgroundColor || "transparent";
            this.layers = options.layers || [];
            this.data = options.data || {};

            YooGame.f.initEventSystem(this);
            this.ons(options.on);

            if (YooGame.f.empty(options.map))
                options.map = {};

            this.map = {
                width: options.map.width || this.width,
                height: options.map.height || this.height,
                textures: options.map.textures || new YooGame.TextureGroup,
                characterMaps: options.map.characterMaps || [],
                tileSize: options.map.tileSize || 64,
                texture: options.map.texture || null,
                enabled: options.map.enabled || false,
                setTexture: src => {
                    const texture = new Image();
                    texture.src = src;
                    texture.crossOrigin = "anonymous";
                    this.map.texture = texture;
                    return this.map;
                },
                render: (context, xView, yView) => {
                    if (!this.map.enabled)
                        return;

                    if (!YooGame.f.empty(this.map.texture))
                        context.drawImage(this.map.texture, 0, 0,
                            this.map.texture.width, this.map.texture.height,
                            xView, yView, this.map.texture.width, this.map.texture.height);

                    const _x = this.width - xView;
                    const _y = this.height - yView;
                    const tileSize = this.map.tileSize;

                    this.map.characterMaps.map(async (map) => {
                        let y = 0;

                        for (const row of map) {
                            let x = 0;

                            for (const id of row) {
                                const tile = this.map.textures.get(id);

                                if (!YooGame.f.empty(tile)) {
                                    if (!tile.loaded)
                                        await YooGame.f.loadTexture(tile);

                                    if ((x >= xView && x + tileSize <= _x + tileSize)
                                        && (y >= yView && y + tileSize <= _y + tileSize))
                                        context.drawImage(tile.image, x + xView, y + yView,
                                            tileSize, tileSize);
                                }

                                x += tileSize;
                            }

                            y += tileSize;
                        };
                    });
                    return this.map;
                }
            };

            if (YooGame.f.empty(options.camera))
                options.camera = {};

            this.camera = {
                _x: 0,
                _y: 0,
                xView: options.camera.xView || 0,
                yView: options.camera.yView || 0,
                xDeadZone: options.camera.xDeadZone || 0,
                yDeadZone: options.camera.yDeadZone || 0,
                wView: options.camera.wView || 0,
                hView: options.camera.hView || 0,
                axis: options.camera.axis || "both",
                followed: options.camera.followed || null,
                element: new YooGame.Element({ name: "Camera" }),
                enabled: options.camera.enabled || false,
                init: (center = true) => {
                    this.camera.wView = this.width;
                    this.camera.hView = this.height;
                    this.camera.xDeadZone = center ? this.camera.wView / 2
                        : this.camera.xDeadZone || this.camera.wView / 2;
                    this.camera.yDeadZone = center ? this.camera.hView / 2
                        : this.camera.yDeadZone || this.camera.hView / 2;
                    this.camera.enabled = true;
                    return this.camera;
                },
                move: (x, y, time = 1) => {
                    time *= 60;
                    const offsetX = Math.max(this.camera.x, x) - Math.min(this.camera.x, x);
                    this.camera.slideSpeedX = offsetX / time;
                    this.camera.slideX = x;
                    const offsetY = Math.max(this.camera.y, y) - Math.min(this.camera.y, y);
                    this.camera.slideSpeedY = offsetY / time;
                    this.camera.slideY = y;
                    return this.camera;
                },
                follow: (element, xDeadZone, yDeadZone) => {
                    if (!(element instanceof YooGame.Element))
                        throw new TypeError("Specified element is not a valid element.");
                    this.camera.followed = element;
                    this.camera.xDeadZone = xDeadZone || this.camera.xDeadZone;
                    this.camera.yDeadZone = yDeadZone || this.camera.yDeadZone;
                    return this.camera;
                },
                update: () => {
                    if (!this.camera.enabled)
                        return;

                    this.camera.x = Math.abs(this.camera.xView - this.camera.xDeadZone);
                    this.camera.y = Math.abs(this.camera.yView - this.camera.yDeadZone);

                    if (!YooGame.f.empty(this.camera.followed)) {
                        if (this.camera.axis === "horizontal" || this.camera.axis === "both")
                            this.camera.xView = YooGame.f.clampValue(this.camera.xDeadZone
                                - this.camera.followed.x
                                - this.camera.followed.width / 2,
                                this.camera.wView - this.map.width, 0);
                        if (this.camera.axis === "vertical" || this.camera.axis === "both")
                            this.camera.yView = YooGame.f.clampValue(this.camera.yDeadZone
                                - this.camera.followed.y
                                - this.camera.followed.height / 2,
                                this.camera.hView - this.map.height, 0);
                    } else {
                        if (!YooGame.f.empty(this.camera.slideX) && this.camera.x !== this.camera.slideX) {
                            const offsetX = Math.max(this.camera.x, this.camera.slideX) - Math.min(this.camera.x, this.camera.slideX);
                            if (this.camera.slideX > this.camera.x) {
                                if (this.camera.slideSpeedX > offsetX)
                                    this.camera.x += offsetX;
                                else
                                    this.camera.x += this.camera.slideSpeedX;
                            } else {
                                if (this.camera.slideSpeedX > offsetX)
                                    this.camera.x -= offsetX;
                                else
                                    this.camera.x -= this.camera.slideSpeedX;
                            }
                        } else
                            this.camera.slideX = null;
                        if (!YooGame.f.empty(this.camera.slideY) && this.camera.y !== this.camera.slideY) {
                            const offsetY = Math.max(this.camera.y, this.camera.slideY) - Math.min(this.camera.y, this.camera.slideY);
                            if (this.camera.slideY > this.camera.y) {
                                if (this.camera.slideSpeedY > offsetY)
                                    this.camera.y += offsetY;
                                else
                                    this.camera.y += this.camera.slideSpeedY;
                            } else {
                                if (this.camera.slideSpeedY > offsetY)
                                    this.camera.y -= offsetY;
                                else
                                    this.camera.y -= this.camera.slideSpeedY;
                            }
                        } else
                            this.camera.slideY = null;

                        this.camera.xView = YooGame.f.clampValue(this.camera.xDeadZone
                            - this.camera.x,
                            this.camera.wView - this.map.width, 0);
                        this.camera.yView = YooGame.f.clampValue(this.camera.yDeadZone
                            - this.camera.y,
                            this.camera.hView - this.map.height, 0);
                    }
                }
            };

            this.options = options || {};
            this.clone = () => new YooGame.Scene(this.options);

            this.loop = (game, type) => {
                const event = { target: this, game };

                if (!this.trigger("loop", event))
                    return;

                if (type === "render") {
                    if (!this.trigger("render"))
                        return;

                    game.context.clearRect(0, 0, this.width, this.height);
                    game.context.fillStyle = this.backgroundColor !== "transparent"
                        ? this.backgroundColor : game.backgroundColor;
                    game.context.fillRect(0, 0, this.width, this.height);

                    this.map.render(game.context, this.camera.xView, this.camera.yView);

                    this.trigger("renderafter");

                    this.layers.map(layer => layer instanceof YooGame.Layer && layer.render(game, this));
                } else {
                    if (!this.trigger("update"))
                        return;

                    const camera = () => this.camera.enabled && this.camera.init();

                    if (this.width !== game.width) {
                        this.width = game.width;
                        camera();
                    }
                    if (this.height !== game.height) {
                        this.height = game.height;
                        camera();
                    }
                    if (YooGame.f.empty(this.map.width) || this.map.width < this.width)
                        this.map.width = this.width;
                    if (YooGame.f.empty(this.map.height) || this.map.height < this.height)
                        this.map.height = this.height;

                    this.camera.update();

                    this.layers.reverse().map(layer => layer instanceof YooGame.Layer
                        && layer.update(game, this));
                }
            };

            this.screenShot = () => {
                const canvas = document.createElement("canvas");
                canvas.width = this.map.width;
                canvas.height = this.map.height;
                const context = canvas.getContext("2d");
                this.map.render(context, 0, 0);
                this.layers.map(layer => {
                    if (layer.screenshotable)
                        for (let element in layer.elements) {
                            element = layer.getElement(element);
                            element.render(context, element.x, element.y);
                        }
                });
                const dataURL = canvas.toDataURL("image/webp");
                canvas.remove();
                return dataURL;
            };

            this.add = layer => {
                if (!this.layers.includes(layer)) this.layers.push(layer);
                return this;
            };
            this.remove = layer => {
                this.layers = this.layers.filter(l => l !== layer);
                return this;
            };

            this.trigger("init");

            return this;
        }
    }

    class HTMLScene {
        constructor(name, html) {
            this.id = "htmlScene-" + YooGame.f.string();
            this.name = name || "Scene";
            this.html = html || "";

            YooGame.f.initEventSystem(this);
            this.trigger("init");

            return this;
        }
    }

    class Layer {
        constructor(options = {}) {
            this.id = "layer-" + YooGame.f.string();
            this.name = options.name || "Layer";
            this.fixed = options.fixed || false;
            this.screenshotable = options.screenshotable || true;
            this.elements = options.elements || [];
            this.data = options.data || {};

            YooGame.f.initEventSystem(this);
            this.ons(options.on);

            this.options = options || {};
            this.clone = () => new YooGame.Layer(this.options);

            this.update = (game, scene) => {
                if (!this.trigger("update", { game, scene }))
                    return;

                let count = this.elements.length - 1;

                this.elements.map(element => {
                    if (!(element instanceof YooGame.Element))
                        return;

                    element.data.collidingElement = null;
                    element.states.collidingWithElement = false;
                    element.states.collidingWithElementTop = false;
                    element.states.collidingWithElementBottom = false;
                    element.states.collidingWithElementLeft = false;
                    element.states.collidingWithElementRight = false;

                    this.elements[count].update(game, scene, this);

                    count--;
                });

                for (let i = 0; i < this.elements.length; i++) {
                    const element = this.elements[i];
                    const x = element.x;
                    const y = element.y;
                    const width = element.data.width;
                    const height = element.data.height;
                    const cX = x + width / 2;
                    const cY = y + height / 2;
                    const degrees = element.degrees;

                    for (let j = i + 1; j < this.elements.length; j++) {
                        const element2 = this.elements[j];
                        const x2 = element2.x;
                        const y2 = element2.y;
                        const width2 = element2.data.width;
                        const height2 = element2.data.height;
                        const cX2 = x2 + width2 / 2;
                        const cY2 = y2 + height2 / 2;
                        const degrees2 = element2.degrees;

                        /* YooGame.c.sat([YooGame.f.rotateCoordinates(x, y, cX, cY, degrees),
                        YooGame.f.rotateCoordinates(x + width, y, cX, cY, degrees),
                        YooGame.f.rotateCoordinates(x + width, y + height, cX, cY, degrees),
                        YooGame.f.rotateCoordinates(x, y + height, cX, cY, degrees)],
                        [YooGame.f.rotateCoordinates(x2, y2, cX2, cY2, degrees2),
                        YooGame.f.rotateCoordinates(x2 + width2, y2, cX2, cY2, degrees2),
                        YooGame.f.rotateCoordinates(x2 + width2, y2 + height2, cX2, cY2, degrees2),
                        YooGame.f.rotateCoordinates(x2, y2 + height2, cX2, cY2, degrees2)]) */
                        if (YooGame.c.rectangle([x, y, width, height], [x2, y2, width2, height2])) {
                            element.data.collidingElement = element2;
                            element2.data.collidingElement = element;

                            element.states.collidingWithElement = true;
                            element2.states.collidingWithElement = true;

                            if (cY > cY2) {
                                element.states.collidingWithElementTop = true;
                                element2.states.collidingWithElementBottom = true;
                            } else {
                                element.states.collidingWithElementBottom = true;
                                element2.states.collidingWithElementTop = true;
                            }

                            if (cX > cX2) {
                                element.states.collidingWithElementLeft = true;
                                element2.states.collidingWithElementRight = true;
                            } else {
                                element.states.collidingWithElementRight = true;
                                element2.states.collidingWithElementLeft = true;
                            }
                        }
                    }
                }
            };

            this.render = (game, scene) => {
                if (!this.trigger("render", { game, scene, context: game.context }))
                    return;

                this.elements.map(element => {
                    if (!(element instanceof YooGame.Element))
                        return;

                    const x = element.data.x;
                    const y = element.data.y;
                    const width = element.data.width;
                    const height = element.data.height;

                    if (((
                        x + width >= 0
                        && y + height >= 0
                    )
                        || (
                            !YooGame.f.empty(this.activeTexture)
                            && x + this.activeTexture.image.width >= 0
                            && y + this.activeTexture.image.height >= 0
                        ))
                        && x <= scene.width
                        && y <= scene.height && !element.hidden
                        && element.opacity > 0
                        && element.data.calculated)
                        element.render(game.context, x, y);

                    element.updateMovement(game, scene, this);
                });

                this.trigger("renderafter", { game, scene, context: game.context });
            };

            this.zIndexes = () => {
                this.elements.sort((a, b) => a.z - b.z);
                return this;
            };
            this.zIndexes();

            this.add = element => {
                if (!this.elements.includes(element)) this.elements.push(element);
                return this;
            };
            this.get = id => this.elements.find(element => element.id === id);
            this.getByName = name => this.elements.find(element => element.name === name);
            this.remove = element => {
                this.element = this.element.filter(element => element !== element);
                return this;
            };

            this.trigger("init");

            return this;
        }
    }

    class Element {
        constructor(options = {}) {
            this.id = "element-" + YooGame.f.string();
            this.name = options.name || "Element";
            this.type = options.type || "rectangle"; // rectangle, ellipse, polygon
            this.x = options.x || 0;
            this.y = options.y || 0;
            this.z = options.z || 0;
            this.scaleX = options.scaleX || 1;
            this.scaleY = options.scaleY || 1;
            this.degrees = options.degrees || 0;
            this.width = options.width || 0;
            this.maxWidth = options.maxWidth || undefined;
            this.maxHeight = options.maxHeight || undefined;
            this.height = options.height || 0;
            this.radiusX = options.radiusX || 0;
            this.radiusY = options.radiusY || 0;
            this.align = options.align || [];
            this.color = options.color || "transparent";
            this.opacity = options.opacity || 1;
            this.hidden = options.hidden || false,
                this.border = options.border || "transparent";
            this.borderSize = options.borderSize || 0;
            this.borderRadius = options.borderRadius || 0;
            this.text = options.text || "";
            this.textColor = options.textColor || options.color || "black";
            this.textBorder = options.textBorder || options.border || "transparent";
            this.textBorderSize = options.textBorderSize || options.borderSize || 0;
            this.textStyle = options.textStyle || "";
            this.textSize = options.textSize || 16;
            this.textAlign = options.textAlign || ["center", "center"];
            this.font = options.font || "Arial";
            this.shadow = options.shadow || "black";
            this.shadowBlur = options.shadowBlur || 0;
            this.shadowOffsetX = options.shadowOffsetX || 0;
            this.shadowOffsetY = options.shadowOffsetY || 0;
            this.textShadow = options.textShadow || "black";
            this.textShadowBlur = options.textShadowBlur || 0;
            this.textShadowOffsetX = options.textShadowOffsetX || 0;
            this.textShadowOffsetY = options.textShadowOffsetY || 0;
            this.points = options.points || [];
            this.cursor = options.cursor || "default";
            this.clickThrough = options.clickThrough || false;
            this.activeTexture = options.activeTexture || null;
            this.clipTexture = options.clipTexture || false;
            this.health = options.health || 0;
            this.hitboxes = options.hitboxes || [];
            this.animations = options.animations || [];
            this.data = options.data || {};
            this.data.cache = {};

            this.getX = index => {
                if (index === 0)
                    return this.x;
                else if (index === 1)
                    return this.x + this.data.width / 2;
                else if (index === 2)
                    return this.x + this.data.width;
            };

            this.getY = index => {
                if (index === 0)
                    return this.y;
                else if (index === 1)
                    return this.y + this.data.height / 2;
                else if (index === 2)
                    return this.y + this.data.height;
            };

            this.setX = (index, value) => {
                if (index === 0)
                    this.x = value;
                else if (index === 1)
                    this.x = value - this.data.width / 2;
                else if (index === 2)
                    this.x = value - this.data.width;
                return this.getX(index);
            };

            this.setY = (index, value) => {
                if (index === 0)
                    this.y = value;
                else if (index === 1)
                    this.y = value - this.data.height / 2;
                else if (index === 2)
                    this.y = value - this.data.height;
                return this.getY(index);
            };

            this.data.getX = index => {
                if (index === 0)
                    return this.data.x;
                else if (index === 1)
                    return this.data.x + this.data.width / 2;
                else if (index === 2)
                    return this.data.x + this.data.width;
            };

            this.data.getY = index => {
                if (index === 0)
                    return this.data.y;
                else if (index === 1)
                    return this.data.y + this.data.height / 2;
                else if (index === 2)
                    return this.data.y + this.data.height;
            };

            YooGame.f.initEventSystem(this);
            this.ons(options.on);

            this.data.gravitySpeedX = this.data.gravitySpeedX || 0;
            this.data.gravitySpeedY = this.data.gravitySpeedY || 0;

            this.states = {
                active: false,
                hovered: false,
                moving: false,
                movingX: false,
                movingY: false,
                sliding: false,
                dragged: false,
                jumping: false,
                colliding: false,
                collidingWithElement: false,
                collidingWithElementTop: false,
                collidingWithElementBottom: false,
                collidingWithElementLeft: false,
                collidingWithElementRight: false,
                collidingWithBorder: false,
                collidingWithBorderTop: false,
                collidingWithBorderBottom: false,
                collidingWithBorderLeft: false,
                collidingWithBorderRight: false,
                organic: false,
                dead: false
            };

            if (YooGame.f.empty(options.physics))
                options.physics = {};

            this.physics = {
                movement: options.physics.movement || null,
                snapToGrid: options.physics.snapToGrid || false,
                slideToGrid: options.physics.slideToGrid || false,
                speedX: options.physics.speedX || 5,
                speedY: options.physics.speedY || 5,
                slideSpeedX: options.physics.slideSpeedX || options.physics.speedX || 5,
                slideSpeedY: options.physics.speedSpeedY || options.physics.speedY || 5,
                rSpeed: options.physics.rSpeed || 5,
                gravityX: options.physics.gravityX || false,
                gravityY: options.physics.gravityY || false,
                bounceX: options.physics.bounceX || false,
                bounceY: options.physics.bounceY || false,
                restitution: options.physics.restitution || false,
                slideX: options.physics.slideX || null,
                slideY: options.physics.slideY || null,
                solid: options.physics.solid || false,
                ghost: options.physics.ghost || false,
                boundToMap: options.physics.boundToMap || true,
                dieOnLeaveMap: options.physics.dieOnLeaveMap || false
            };

            if (YooGame.f.empty(options.controls))
                options.controls = {};

            this.controls = {
                up: options.controls.up || "ArrowUp",
                down: options.controls.down || "ArrowDown",
                left: options.controls.left || "ArrowLeft",
                right: options.controls.right || "ArrowRight",
                jump: options.controls.jump || " "
            };

            this.options = options || {};
            this.clone = () => new YooGame.Element(this.options);

            this.update = async (game, scene, layer) => {
                if (game.paused || !this.trigger("update", { game, scene, layer }))
                    return;

                if (this.type === "ellipse") {
                    this.width = this.radiusX * 2;
                    this.height = this.radiusY * 2;
                } else if (this.type === "polygon") {
                    let minX = this.points[0][0];
                    let maxX = this.points[0][0];
                    let minY = this.points[0][1];
                    let maxY = this.points[0][1];

                    this.points.slice(1).map(point => {
                        if (point[0] < minX)
                            minX = point[0];
                        else if (point[0] > maxX)
                            maxX = point[0];
                        if (point[1] < minY)
                            minY = point[1];
                        else if (point[1] > maxY)
                            maxY = point[1];
                    });

                    this.width = maxX - minX;
                    this.height = maxY - minY;
                }

                const texture = this.activeTexture;
                const hasTexture = !YooGame.f.empty(texture);
                if (hasTexture && !texture.loaded)
                    await YooGame.f.loadTexture(texture);

                {
                    const context = game.virtual.context;

                    context.save();

                    context.fillStyle = this.textColor || this.color;
                    context.strokeStyle = this.textBorder || this.border;
                    context.lineWidth = this.textBorderSize || this.borderSize;
                    context.font = this.textStyle + " " + this.textSize + "px " + this.font;

                    const metrics = context.measureText(this.text);
                    this.data.textWidth = metrics.width;

                    context.restore();
                }

                if (this.align[0] === "left")
                    this.setX(0, -scene.camera.xView);
                else if (this.align[0] === "center")
                    this.setX(1, scene.width / 2 - scene.camera.xView);
                else if (this.align[0] === "right")
                    this.setX(2, scene.width - scene.camera.xView);

                if (this.align[1] === "top")
                    this.setY(0, -scene.camera.yView);
                else if (this.align[1] === "center")
                    this.setY(1, scene.height / 2 - scene.camera.yView);
                else if (this.align[1] === "bottom")
                    this.setY(2, scene.height - scene.camera.yView);

                this.data.x = this.x + (this.states.dragged ? 0 : scene.camera.xView) + scene.x;
                this.data.y = this.y + (this.states.dragged ? 0 : scene.camera.yView) + scene.y;
                this.data.width = (this.width || (!hasTexture ? undefined
                    : texture.width) || this.data.textWidth || 0) * this.scaleX;
                this.data.textHeight = this.textSize;
                if (this.maxHeight > this.data.height)
                    this.maxHeight = this.data.height;
                if (this.data.textHeight > this.maxHeight)
                    this.data.textHeight = this.maxHeight;
                this.data.textHeight *= .75;
                this.data.height = (this.height || (!hasTexture ? undefined
                    : texture.height) || this.data.textHeight || 0) * this.scaleY;
                this.data.radiusX = this.radiusX * this.scaleX;
                this.data.radiusY = this.radiusY * this.scaleY;
                this.data.radians = this.degrees * Math.PI / 180;

                this.data.calculated = true;

                this.updateCache();

                const x = this.data.x;
                const y = this.data.y;
                const width = this.data.width;
                const height = this.data.height;
                const radiusX = this.data.radiusX;
                const radiusY = this.data.radiusY;

                if (!this.states.dragged) {
                    if (!YooGame.f.empty(this.physics.gravityX))
                        this.data.gravitySpeedX += this.physics.gravityX;
                    if (!YooGame.f.empty(this.physics.gravityY))
                        this.data.gravitySpeedY += this.physics.gravityY;
                }

                this.x += this.data.gravitySpeedX;
                this.y += this.data.gravitySpeedY;

                this.data.points = this.points.map(point => [x + point[0], y + point[1]]);

                if (this.z !== this.data.cache.z)
                    layer.zIndexes();
                this.data.cache.z = this.z;

                const event = { target: this, game, scene, layer, mX: game.mX, mY: game.mY, x, y };

                const point = YooGame.c.pointInRectangle([game.mX, game.mY], [x, y, width, height]);
                if (!this.clickThrough && !this.hidden && point) {
                    if ((this.type === "rectangle" && point)
                        || (this.type === "ellipse"
                            && YooGame.c.pointInEllipse([game.mX, game.mY],
                                [x + radiusX, y + radiusY, radiusX, radiusY, this.data.radians]))
                        || (this.type === "polygon"
                            && YooGame.c.pointInPolygon([game.mX, game.mY], this.data.points))) {
                        if (game.mouseDown
                            //&& game.mXS > x && game.mYS > y && game.mXS < x + width && game.mYS < y + height
                            && (YooGame.f.empty(game.mouseOnElement) || game.mouseOnElement === this.id)) {
                            this.states.active = true;
                            game.mouseOnElement = this.id;
                        }

                        if (YooGame.f.empty(game.hoveringOnElement)
                            && !this.clickThrough && !this.hidden)
                            game.hoveringOnElement = this.id;

                        if (this.trigger("hover", event))
                            this.states.hovered = true;
                    }
                } else {
                    if (game.hoveringOnElement === this.id)
                        game.hoveringOnElement = null;
                    this.states.hovered = false;
                }

                if (this.states.active && YooGame.f.empty(game.mouseOnElement))
                    this.states.active = false;

                if (this.data.cache.active !== this.states.active) {
                    if (!this.data.cache.active && this.states.active) {
                        if (!this.trigger("mousedown", event)) {
                            game.mouseOnElement = null;
                            this.states.active = false;
                        } else {
                            this.data.dragX = game.mX;
                            this.data.dragY = game.mY;
                        }
                    } else {
                        if (this.states.hovered && !this.trigger("click", event))
                            this.trigger("mouseup", event);
                    }
                }

                if (this.data.cache.hovered !== this.states.hovered) {
                    if (!this.data.cache.hovered && this.states.hovered) {
                        if (!this.trigger("mouseenter", event))
                            this.states.hovered = false;
                        else {
                            if (!this.states.dragged)
                                game.cursor = this.cursor;
                        }
                    } else {
                        if (!this.trigger("mouseleave", event))
                            this.states.hovered = true;
                        else {
                            if (!this.states.dragged)
                                game.cursor = "default";
                        }
                    }
                }

                this.updateCache();
            };
            this.updateMovement = (game, scene, layer) => {
                const x = this.data.x;
                const y = this.data.y;
                const width = this.data.width;
                const height = this.data.height;
                let movingX = false;
                let movingY = false;
                let slidingX = false;
                let slidingY = false;

                this.animations.map(animation => animation.loop(this));

                // event object to send along with every element event that has to do with mouse/touch
                const event = { target: this, game, scene, layer, mX: game.mX, mY: game.mY, x, y };

                switch (this.physics.movement) {
                    case "drag": // very cool, and works w/ touch
                        if (this.states.active) {
                            if (!this.trigger("drag", event))
                                this.states.dragged = false;
                            else {
                                /**
                                 * Get the offset of the mouse from the coordinates of the element,
                                 * this way it can be dragged from any part of it.
                                 */
                                this.dragX = this.data.dragX - game.mX;
                                this.dragY = this.data.dragY - game.mY;
                                this.data.dragX = game.mX;
                                this.data.dragY = game.mY;

                                this.x = this.x - this.dragX;
                                this.y = this.y - this.dragY;

                                this.data.cache.gravitySpeedX = this.data.gravitySpeedX;
                                this.data.cache.gravitySpeedY = this.data.gravitySpeedY;
                                this.data.gravitySpeedX = 0;
                                this.data.gravitySpeedY = 0;

                                movingX = true;
                                movingY = true;

                                if (this.data.dragStarted)
                                    game.cursor = "grab";

                                this.states.dragged = true;
                            }
                        } else
                            this.states.dragged = false;
                        break;
                    case "horizontal":
                        if (YooGame.k[this.controls.left])
                            this.x -= this.physics.speedX, movingX = true; // left
                        if (YooGame.k[this.controls.right])
                            this.x += this.physics.speedX, movingX = true; // right
                        break;
                    case "vertical":
                        if (YooGame.k[this.controls.up])
                            this.y -= this.physics.speedY, movingY = true; // up
                        if (YooGame.k[this.controls.down])
                            this.y += this.physics.speedY, movingY = true; // down
                        break;
                    case "4way": // prevents diagonal movement (like a top-down retro game)
                        if (YooGame.k[this.controls.up]
                            && !YooGame.k[this.controls.down]
                            && !YooGame.k[this.controls.left]
                            && !YooGame.k[this.controls.right])
                            this.y -= this.physics.speedY, movingY = true; // up
                        if (!YooGame.k[this.controls.up]
                            && YooGame.k[this.controls.down]
                            && !YooGame.k[this.controls.left]
                            && !YooGame.k[this.controls.right])
                            this.y += this.physics.speedY, movingY = true; // down
                        if (!YooGame.k[this.controls.up]
                            && !YooGame.k[this.controls.down]
                            && YooGame.k[this.controls.left]
                            && !YooGame.k[this.controls.right])
                            this.x -= this.physics.speedX, movingX = true; // left
                        if (!YooGame.k[this.controls.up]
                            && !YooGame.k[this.controls.down]
                            && !YooGame.k[this.controls.left]
                            && YooGame.k[this.controls.right])
                            this.x += this.physics.speedX, movingX = true; // right
                        break;
                    case "8way":
                        if (YooGame.k[this.controls.up])
                            this.y -= this.physics.speedY, movingY = true; // up
                        if (YooGame.k[this.controls.down])
                            this.y += this.physics.speedY, movingY = true; // down
                        if (YooGame.k[this.controls.left])
                            this.x -= this.physics.speedX, movingX = true; // left
                        if (YooGame.k[this.controls.right])
                            this.x += this.physics.speedX, movingX = true; // right
                        break;
                }

                if (!YooGame.f.empty(this.physics.slideX) && !movingX && this.x !== this.physics.slideX) {
                    const offsetX = Math.max(this.x, this.physics.slideX) - Math.min(this.x, this.physics.slideX);
                    if (this.physics.slideX > this.x) {
                        if (this.physics.slideSpeedX > offsetX)
                            this.x += offsetX;
                        else
                            this.x += this.physics.slideSpeedX;
                    } else {
                        if (this.physics.slideSpeedX > offsetX)
                            this.x -= offsetX;
                        else
                            this.x -= this.physics.slideSpeedX;
                    }
                    slidingX = true;
                } else {
                    this.physics.slideX = null;
                    slidingX = false;
                }
                if (!YooGame.f.empty(this.physics.slideY) && !movingY && this.y !== this.physics.slideY) {
                    const offsetY = Math.max(this.y, this.physics.slideY) - Math.min(this.y, this.physics.slideY);
                    if (this.physics.slideY > this.y) {
                        if (this.physics.slideSpeedY > offsetY)
                            this.y += offsetY;
                        else
                            this.y += this.physics.slideSpeedY;
                    } else {
                        if (this.physics.slideSpeedY > offsetY)
                            this.y -= offsetY;
                        else
                            this.y -= this.physics.slideSpeedY;
                    }
                    slidingY = true;
                } else {
                    this.physics.slideY = null;
                    slidingY = false;
                }

                if ((this.states.sliding = slidingX || slidingY)) {
                    if (!this.trigger("slide", event)) {
                        this.states.sliding = false;
                        this.physics.slideX = null;
                        this.physics.slideY = null;
                    }
                }

                if (this.data.cache.sliding !== this.states.sliding) {
                    if (!this.data.cache.sliding && this.states.sliding) {
                        if (!this.trigger("slidestart", event))
                            this.states.sliding = false;
                    } else {
                        if (!this.trigger("slideend", event))
                            this.states.sliding = true;
                        else {
                            if (!YooGame.f.empty(this.data.moveCallback))
                                this.data.moveCallback();
                        }
                    }
                }

                if (this.data.cache.x !== this.x)
                    this.states.movingX = true;
                else
                    this.states.movingX = false;
                if (this.data.cache.y !== this.y)
                    this.states.movingY = true;
                else
                    this.states.movingY = false;

                this.states.moving = this.states.movingX || this.states.movingY;

                if (this.data.cache.dragged !== this.states.dragged) {
                    if (!this.data.cache.dragged && this.states.dragged) {
                        if (!this.trigger("dragstart", event)) {
                            game.mouseOnElement = null;
                            this.states.active = false;
                            this.states.dragged = false;
                        } else {
                            this.data.dragStarted = true;

                            game.cursor = "grab";

                            this.x += scene.camera.xView;
                            this.y += scene.camera.yView;
                        }
                    } else {
                        if (!this.trigger("dragend", event)) {
                            game.mouseOnElement = this.id;
                            this.states.active = true;
                            this.states.dragged = true;
                        } else {
                            this.data.dragStarted = false;

                            game.cursor = "default";

                            this.x -= scene.camera.xView;
                            this.y -= scene.camera.yView;

                            if (this.physics.snapToGrid)
                                this.snapToGrid();
                            else if (this.physics.slideToGrid)
                                this.slideToGrid();
                        }
                    }
                }

                this.collision(scene, layer);
            };
            this.collision = (scene, layer) => {
                const width = this.data.width;
                const height = this.data.height;

                if (YooGame.f.empty(this.hitboxes)) {
                    let colliding = false;

                    if (this.physics.boundToMap) {
                        if (this.y < 1) {
                            colliding = true;
                            this.states.collidingWithBorderTop = true;
                            this.bounce(0, -this.physics.bounceY);
                            this.y = 0;
                        } else
                            this.states.collidingWithBorderTop = false;
                        if (this.y + height > scene.map.height - 1) {
                            colliding = true;
                            this.states.collidingWithBorderBottom = true;
                            this.bounce(0);
                            this.y = scene.map.height - height;
                        } else
                            this.states.collidingWithBorderBottom = false;
                        if (this.x < 1) {
                            colliding = true;
                            this.states.collidingWithBorderLeft = true;
                            this.bounce(-this.physics.bounceX, 0);
                            this.x = 0;
                        } else
                            this.states.collidingWithBorderLeft = false;
                        if (this.x + width > scene.map.width - 1) {
                            colliding = true;
                            this.states.collidingWithBorderRight = true;
                            this.bounce(undefined, 0);
                            this.x = scene.map.width - width;
                        } else
                            this.states.collidingWithBorderRight = false;
                    }

                    this.states.collidingWithBorder = colliding;
                    if (colliding || this.states.collidingWithElement)
                        this.states.colliding = true;
                    else
                        this.states.colliding = false;

                    if (this.states.collidingWithElement && !this.physics.ghost) {
                        for (const element of layer.elements)
                            if (element.states.collidingWithElement && element.physics.solid
                                && element.data.collidingElement.id === this.id) {
                                if (this.getY(2) > element.y && this.getY(2) < element.getY(1))
                                    this.y = element.y - this.data.height;
                                else if (this.y < element.getY(2) && this.y > element.getY(1))
                                    this.y = element.getY(2);
                                if (this.getX(2) > element.x && this.getX(2) < element.getX(1))
                                    this.x = element.x - this.data.width;
                                else if (this.x < element.getX(2) && this.x > element.getX(1))
                                    this.x = element.getX(2);
                            }
                    }
                } else
                    this.hitboxs.map(hitbox => hitbox.loop(scene, this));
            };
            this.updateCache = () => {
                this.data.cache.x = this.x;
                this.data.cache.y = this.y;

                this.data.cache.active = this.states.active;
                this.data.cache.hovered = this.states.hovered;
                this.data.cache.moving = this.states.moving;
                this.data.cache.sliding = this.states.sliding;
                this.data.cache.dragged = this.states.dragged;
                this.data.cache.jumping = this.states.jumping;
                this.data.cache.dead = this.states.dead;
            };
            this.updateCache();

            this.snapToGrid = (width, height) => {
                width = width || this.data.width;
                height = height || this.data.height;
                this.x = YooGame.f.snapToGrid(this.x, width);
                this.y = YooGame.f.snapToGrid(this.y, height);
            };
            this.slideToGrid = (width, height) => {
                width = width || this.data.width;
                height = height || this.data.height;
                this.move(YooGame.f.snapToGrid(this.x, width),
                    YooGame.f.snapToGrid(this.y, height));
            };
            this.move = (x, y, time = 1, callback = YooGame.f.null) => {
                time *= 60;
                this.data.cache.slideSpeedX = this.physics.slideSpeedX;
                const offsetX = Math.max(this.x, x) - Math.min(this.x, x);
                this.physics.slideSpeedX = offsetX / time;
                this.physics.slideX = x;
                this.data.cache.slideSpeedY = this.physics.slideSpeedY;
                const offsetY = Math.max(this.y, y) - Math.min(this.y, y);
                this.physics.slideSpeedY = offsetY / time;
                this.physics.slideY = y;
                this.data.moveCallback = callback;
            };

            this.render = async (context, x, y) => {
                const event = { context, target: this, x, y };
                if (!this.trigger("rendernormal", event))
                    return;

                context.save();

                x += this.data.width / 2;
                y += this.data.height / 2;

                context.translate(x, y);
                context.rotate(this.data.radians);
                context.globalAlpha = this.opacity;

                x = this.data.width / -2;
                y = this.data.height / -2;

                if (!this.trigger("render", event))
                    return;

                context.fillStyle = this.color;
                context.strokeStyle = this.border;
                context.lineWidth = this.borderSize;

                context.save();

                context.shadowColor = this.shadow;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;

                if (this.type === "rectangle")
                    YooGame.r.rectangle(context, x, y,
                        this.data.width, this.data.height, this.borderRadius);
                else if (this.type === "ellipse")
                    YooGame.r.ellipse(context, x, y,
                        this.data.radiusX, this.data.radiusY, this.degrees);
                else if (this.type === "polygon")
                    YooGame.r.polygon(context, x, y, this.points,
                        YooGame.f.empty(this.borderRadius) ? 0 : Array.isArray(this.borderRadius)
                            ? this.borderRadius[0] : this.borderRadius);

                if (this.clipTexture || this.type !== "rectangle")
                    context.clip();

                const texture = this.activeTexture;
                if (!YooGame.f.empty(texture)) {
                    if (this.clipTexture)
                        context.drawImage(texture.image, x, y);
                    else
                        context.drawImage(texture.image, x, y, this.data.width, this.data.height);
                }

                context.restore();

                context.fillStyle = this.textColor || this.color;
                context.strokeStyle = this.textBorder || this.border;
                context.lineWidth = this.textBorderSize || this.borderSize;
                context.font = this.textStyle + " " + this.textSize + "px " + this.font;

                const metrics = context.measureText(this.text);
                this.data.textWidth = metrics.width;
                let width = this.maxWidth || (this.data.width !== 0 ? this.data.width : undefined);
                if (width > this.data.width)
                    width = this.data.width;

                let offsetX = 0;
                if (this.textAlign[0] === "right")
                    offsetX = this.data.width - this.data.textWidth;
                else if (this.textAlign[0] === "center")
                    offsetX = this.data.width / 2 - this.data.textWidth / 2;

                let offsetY = 0;
                if (this.textAlign[1] === "center")
                    offsetY = this.data.height / 2 - this.data.textHeight / 2;
                else if (this.textAlign[1] === "bottom")
                    offsetY = this.data.height - this.data.textHeight;

                context.save();

                context.shadowColor = this.textShadow;
                context.shadowBlur = this.textShadowBlur;
                context.shadowOffsetX = this.textShadowOffsetX;
                context.shadowOffsetY = this.textShadowOffsetY;

                context.fillText(this.text, x + offsetX,
                    y + metrics.actualBoundingBoxAscent + offsetY, width);
                context.strokeText(this.text, x + offsetX,
                    y + metrics.actualBoundingBoxAscent + offsetY, width);

                context.restore();

                if (!this.trigger("renderafter", event))
                    return context.restore();
                context.restore();

                this.trigger("renderafternormal", event);

                //context.setTransform(this.scaleX, 0, 0, this.scaleY, x, y);
                //context.resetTransform();
            };

            this.onCollision = options.onCollision || YooGame.f.null;
            this.onCollisionStart = options.onCollisionStart || YooGame.f.null;
            this.onCollisionEnd = options.onCollisionEnd || YooGame.f.null;

            this.bounce = (powerX, powerY) => {
                if (YooGame.f.empty(powerX))
                    powerX = this.physics.bounceX;
                if (YooGame.f.empty(powerY))
                    powerY = this.physics.bounceY;

                // fix this bounce doesnt completely work lel
                if (Math.sign(this.powerX) === -1)
                    this.data.gravitySpeedX = this.data.gravitySpeedX * powerX;
                else
                    this.data.gravitySpeedX = -(this.data.gravitySpeedX * powerX);
                if (Math.sign(this.powerY) === -1)
                    this.data.gravitySpeedY = this.data.gravitySpeedY * powerY;
                else
                    this.data.gravitySpeedY = -(this.data.gravitySpeedY * powerY);
            };

            // jump doesnt work
            this.jump = power => {
                this.gravitySpeedY = -this.physics.gravityY * 1000;
                this.bounce(0, power);
            };
            this.onJumpStart = options.onJumpStart || YooGame.f.null;
            this.onJumpEnd = options.onJumpEnd || YooGame.f.null;

            this.activateTexture = texture => this.activeTexture = texture;
            this.clearTexture = () => this.activeTexture = null;

            this.add = data => {
                if (data instanceof YooGame.Hitbox)
                    !this.hitboxs.includes(data) && this.hitboxs.push(data);
                else
                    !this.animations.includes(data) && this.animations.push(data);
                return this;
            };
            this.remove = data => {
                if (data instanceof YooGame.Hitbox)
                    this.hitboxs = this.hitboxes.filter(h => h !== data);
                else
                    this.animations = this.animations.filter(a => a !== data);
                return this;
            };
            this.get = name => this.animations.filter(a => a.name === name);

            this.trigger("init");

            this.animations.map(animation => animation.play());

            return this;
        }
    }

    function TextElement(x, y, text, color, size, alignment = []) {
        const element = new YooGame.Element({
            name: "Text Element",
            x, y,
            text,
            color,
            textSize: size,
            textAlign: [alignment[0] || "left", alignment[1] || "top"]
        });

        return element;
    }

    function ImageElement(x, y, width, height, texture) {
        const element = new YooGame.Element({
            name: "Image Element",
            x,
            y,
            width,
            height,
            activeTexture: texture || new YooGame.Texture
        })

        return element;
    }

    class Hitbox {
        constructor(width, height, offsetX, offsetY, solid) {
            this.offsetX = offsetX || 0;
            this.offsetY = offsetY || 0;
            this.width = width || 0;
            this.height = height || 0;
            this.solid = solid || false;

            YooGame.f.initEventSystem(this);

            this.loop = (scene, element) => {
                const event = { target: this, scene, element };
                if (!this.trigger("loop", event))
                    return;

                const x = element.x + scene.camera.xView + this.offsetX;
                const y = element.y + scene.camera.yView + this.offsetY;
                this.width = this.width * element.scaleX;
                this.height = this.height * element.scaleY;

                // todo
            };

            this.trigger("init");

            return this;
        }
    }

    class Texture {
        constructor(name, data, type = "image", width, height) {
            this.name = name.toString() || "Texture";
            this.image = null;
            this.width = width;
            this.height = height;
            this.loaded = false;

            if (type === "image") {
                if (data instanceof Image)
                    this.source = data.src;
                else
                    this.source = data || "";
            } else if (type === "solid") {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");

                this.width = this.width || 64;
                this.height = this.height || 64;

                canvas.width = this.width;
                canvas.height = this.height;

                context.fillStyle = data;
                context.fillRect(0, 0, canvas.width, canvas.height);

                this.source = canvas.toDataURL("webp");
            } else
                throw new TypeError("Invalid texture data provided.");

            this.clone = () => new YooGame.Texture(this.name, data, type, width, height);

            return this;
        }
    }

    class TextureGroup {
        constructor(name, textures = []) {
            this.name = name || "Texture Group";
            this.textures = {};

            textures.map(texture => {
                if (texture instanceof YooGame.Texture)
                    this.textures[texture.name] = texture;
                else
                    this.textures[texture[0]]
                        = new YooGame.Texture(texture[0], texture[1],
                            texture[2], texture[3], texture[4]);
            });

            this.clone = () => new YooGame.TextureGroup(this.name, this.textures);

            this.add = texture => {
                if (!Object.values(this.textures).includes(texture)) this.textures[texture.name] = texture;
                return this;
            };
            this.get = name => this.textures[name];
            this.remove = texture => {
                delete this.textures[texture];
                return this;
            };

            return this;
        }
    }
    
    class TextureAnimation {
        constructor(name, textures) {
            this.name = name || "Texture Animation";
            this.textures = textures || new YooGame.TextureGroup;

            if (!(textures instanceof YooGame.TextureGroup))
                this.textures = new YooGame.TextureGroup(name, textures);

            this.clone = () => new YooGame.TextureGroup(this.name, this.textures);

            this.add = texture => {
                this.textures.add(texture);
                return this;
            };
            this.get = name => this.textures.get(name);
            this.remove = texture => {
                this.textures.remove(texture);
                return this;
            };

            return this;
        }
    }

    /**
     * ~~Does not work at all~~
     */
    class Animation {
        constructor(name, start, end, time, callback) {
            this.name = name || "Animation";
            this.start = start || 0;
            this.value = this.start;
            this.end = end || 0;
            this.time = time || 0;
            this.time *= 60;
            this.callback = callback || YooGame.f.null;
            this.started = false;
            this.paused = false;
            this.completed = false;

            this.offset = Math.max(this.start, this.end) - Math.min(this.start, this.end);
            this.speed = this.offset / this.time;

            YooGame.f.initEventSystem(this);

            this.loop = object => {
                if (!this.started || this.paused || this.completed)
                    return;

                if (this.start < this.end) {
                    if (this.speed > this.offset)
                        this.value += this.offset;
                    else
                        this.value += this.speed;
                } else {
                    if (this.speed > this.offset)
                        this.value -= this.offset;
                    else
                        this.value -= this.speed;
                }

                if (this.value >= this.end) {
                    this.completed = true;
                    this.trigger("end", { object, value: this.end });
                }
                this.callback.call(object, this.value);
            };

            this.play = () => {
                if (!this.trigger("play", { value: this.value }))
                    return;
                this.started = true;
                this.paused = false;
                this.completed = false;
                return this;
            };

            this.pause = () => {
                if (this.trigger("pause", { value: this.value }))
                    this.paused = true;
                return this;
            };
            
            return this;
        }
    }

    /**
     * Helper class for rectangle shapes, used to be used with the camera, but could still be useful somehow.
     */
    class Rectangle {
        constructor(top, left, width, height) {
            this.top = top || 0;
            this.left = left || 0;
            this.width = width || 0;
            this.height = height || 0;
            this.right = (left || 0) + width;
            this.bottom = (top || 0) + height;

            this.set = (top, left, width, height) => {
                this.top = top;
                this.left = left;
                this.width = width || this.width;
                this.height = height || this.height;
                this.right = this.left + this.width;
                this.bottom = this.top + this.height;
                return this;
            };

            this.within = thing => thing.left <= this.left
                && thing.right >= this.right
                && thing.top <= this.top
                && thing.bottom >= this.bottom;
            this.overlaps = thing => this.left < thing.right
                && thing.left < this.right
                && this.top < thing.bottom
                && thing.top < this.bottom;
            
            return this;
        }
    }

    class KeyBind {
        constructor(keys, callback, holdDown) {
            this.keys = keys || [];
            this.callback = callback || YooGame.f.null;
            this.holdDown = holdDown || false;
            this.enabled = true;

            if (!Array.isArray(this.keys))
                this.keys = [this.keys.toString()];

            const special = ["Control", "Shift", "Alt", "Tab"];
            this.run = () => {
                const result = this.keys.map(key => YooGame.k[key]);
                const s = new Set(result);

                if (result[0] && s.size === 1) {
                    this.callback();
                    if (!this.holdDown)
                        this.keys.map(key => !special.includes(key) && (delete YooGame.k[key]));
                }

                return this;
            };

            this.loop = setInterval(this.run, 20);

            this.on = () => {
                if (!this.enabled) {
                    this.enabled = true;
                    this.loop = setInterval(this.run, 20);
                }

                return this;
            };
            this.off = () => {
                this.enabled = false;
                clearInterval(this.loop);

                return this;
            };

            return this;
        }
    };

    class _Audio {
        constructor(name, source, volume, loop) {
            this.name = name || "Audio";
            this.source = source || "";
            this.volume = volume || 1;
            this.loop = loop || false;
            this.audio = new Audio(this.source);

            this.play = () => {
                return new Promise((resolve, reject) => {
                    const audio = new Audio();
                    audio.preload = "auto";
                    audio.autoplay = true;
                    audio.loop = this.loop;
                    audio.volume = this.volume;
                    audio.onerror = reject;
                    audio.onended = resolve;
                    audio.src = this.source;
                    this.audio = audio;
                });
            };

            this.pause = () => {
                if (YooGame.f.empty(this.audio))
                    return;
                this.audio.pause();
                return this;
            };

            return this;
        }
    }
    
    YooGame.Game = Game;
    YooGame.Scene = Scene;
    YooGame.HTMLScene = HTMLScene;
    YooGame.Layer = Layer;
    YooGame.Element = Element;
    YooGame.TextElement = TextElement;
    YooGame.ImageElement = ImageElement;
    YooGame.Hitbox = Hitbox;
    YooGame.Texture = Texture;
    YooGame.TextureGroup = TextureGroup;
    YooGame.TextureAnimation = TextureAnimation;
    YooGame.Animation = Animation;
    YooGame.Rectangle = Rectangle;
    YooGame.KeyBind = KeyBind;
    YooGame.Audio = _Audio;

    YooGame.a = {
        slideX: (element, x) => null
    };

    YooGame.c = { // collision functions
        rectangle: (rectangle, rectangle2) => !(rectangle2[0] > rectangle[2] + rectangle[0]
            || rectangle[0] > rectangle2[2] + rectangle2[0]
            || rectangle2[1] > rectangle[3] + rectangle[1]
            || rectangle[1] > rectangle2[3] + rectangle2[1]),
        pointInRectangle: (point, rectangle) => point[0] > rectangle[0]
                && point[1] > rectangle[1]
                && point[0] < rectangle[0] + rectangle[2]
                && point[1] < rectangle[1] + rectangle[3],
        ellipse: (ellipse, ellipse2) => (ellipse[0] - ellipse2[0]) ** 2 + (ellipse[1] - ellipse2[1]) ** 2
            <= (ellipse[2] + ellipse2[2]) ** 2,
        pointInEllipse: (point, ellipse) => {
            let rotation = ellipse[4] || 0;
            var cos = Math.cos(rotation),
                sin = Math.sin(rotation);
            var dx  = (point[0] - ellipse[0]),
                dy  = (point[1] - ellipse[1]);
            var tdx = cos * dx + sin * dy,
                tdy = sin * dx - cos * dy;

            return (tdx * tdx) / (ellipse[2] * ellipse[2]) + (tdy * tdy) / (ellipse[3] * ellipse[3]) <= 1;
        },
        polygon: (polygon, polygon2) => false,
        pointInPolygon: (point, polygon) => {
            //A point is in a polygon if a line from the point to infinity crosses the polygon an odd number of times
            let odd = false;
            //For each edge (In this case for each point of the polygon and the previous one)
            for (let i = 0, j = polygon.length - 1; i < polygon.length; i++) {
                //If a line from the point into infinity crosses this edge
                if (((polygon[i][1] > point[1]) !== (polygon[j][1] > point[1])) // One point needs to be above, one below our y coordinate
                    // ...and the edge doesn't cross our Y corrdinate before our x coordinate (but between our x coordinate and infinity)
                    && (point[0] < ((polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]))) {
                    // Invert odd
                    odd = !odd;
                }
                j = i;

            }
            //If the number of crossings was odd, the point is in the polygon
            return odd;
        },
        sat: (polygon, polygon2) => {
            const vertex = (x, y) => [x, y];
            const add = (vertex, vertex2) => [vertex[0] + vertex2[0], vertex[1] + vertex2[1]];
            const subtract = (vertex, vertex2) => [vertex[0] - vertex2[0], vertex[1] - vertex2[1]];
            const separation = (perpendicular, polygon, polygon2) => {
                for (let i = 0; i < polygon2.length; i++) if (Math.sign(perpendicular[0]
                    * (polygon2[i][0] - polygon[0])
                    + perpendicular[1] * (polygon2[i][1] - polygon[1]))) return false;
                return true;
            };
            const edges = (polygon, polygon2) => {
                let sibling;
                let edge;
                let perpendicular;

                for (let i = 0; i < polygon.length; i++) {
                    if (i + 1 < polygon.length) sibling = i + 1;
                    else sibling = 0;
                    
                    edge = subtract(polygon[i], polygon[sibling]);
                    perpendicular = vertex(-edge[1], edge[0]);

                    if (separation(perpendicular, polygon[sibling], polygon2)) return false;
                }

                return true;
            }

            if (edges(polygon, polygon2) === false
                || edges(polygon2, polygon) === false) return false;
            return true;
        }
    };

    YooGame.d = { // default values
        controls: {
            wasd: {
                up: "w",
                down: "s",
                left: "a",
                right: "d",
                jump: " "
            },
            wazs: {
                up: "w",
                down: "z",
                left: "a",
                right: "d",
                jump: " "
            },
            arrows: {
                up: "ArrowUp",
                down: "ArrowDown",
                left: "ArrowLeft",
                right: "ArrowRight",
                jump: " "
            }
        }
    };
    
    YooGame.f = { // basic useful functions
        log: (...data) => console.log("Yoo-Game | ", ...data),
        color: () => "#" + (Math.random().toString(16) + "00000").slice(2, 8),
        string: (length = 9) => Math.random().toString(16).substr(2, length),
        number: (min = 0, max = 10) => Math.floor(Math.random() * (max - min + 1)) + min,
        empty: data => typeof data === "undefined" || data === null || data === "" || data.length === 0,
        null: () => true,
        clampValue: (value, low, high) => value < low ? low : value > high ? high : value,
        imageLoaded: image => image.complete && image.naturalHeight !== 0,
        loadTexture: texture => {
            if (!texture.loaded) {
                const promise = new Promise(resolve => {
                    const image = new Image();

                    image.onload = () => {
                        if (YooGame.f.empty(texture.width)) texture.width = image.width;
                        if (YooGame.f.empty(texture.height)) texture.height = image.height;

                        texture.loaded = true;
                        resolve();
                    };

                    image.src = texture.source;
                    texture.image = image;
                });

                return promise;
            } else return new Promise(resolve => resolve());
        },
        loadTextures: textureGroup => {
            const promises = [];

            for (let texture in textureGroup.textures) {
                texture = textureGroup.textures[texture];

                if (!texture.loaded) promises.push(new Promise(resolve => {
                    const image = new Image();

                    image.onload = () => {
                        if (YooGame.f.empty(texture.width)) texture.width = image.width;
                        if (YooGame.f.empty(texture.height)) texture.height = image.height;
                        
                        texture.loaded = true;
                        resolve();
                    };

                    image.src = texture.source;
                    texture.image = image;
                }));
            }

            return Promise.all(promises);
        },
        generateTextureMap: async (textures, characterMaps, width, height, tileSize, onProgress) => {
            await YooGame.f.loadTextures(textures, onProgress || undefined);
            if (tileSize > 96) tileSize = 96;
            const maxWidth = tileSize * 20;
            const maxHeight = maxWidth;
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d");
            characterMaps.map(characterMap => {
                let x = 0;
                let y = 0;
                let width = tileSize;
                let height = width;
                characterMap.map(row => {
                    row.map(tile => {
                        tile = textures.get(tile);
                        if (tile instanceof YooGame.Texture) {
                            tile = tile.image;
                            if (!YooGame.f.empty(tile)) context.drawImage(tile, x, y, tileSize, tileSize);
                        }
                        x += tileSize;
                        width += tileSize;
                    });
                    x = 0;
                    y += tileSize;
                    width = 0;
                    y += tileSize;
                });
            });
            const dataURL = canvas.toDataURL("image/webp");
            canvas.remove();
            return dataURL;
        },
        timestamp: () => {
            if (window.performance && window.performance.now) return window.performance.now();
            else return new Date().getTime();
        },
        snapToGrid: (coord, grid) => Math.round(coord / grid) * grid,
        initEventSystem: object => {
            if (typeof object !== "object") throw new TypeError("Specified object is not a valid object.");

            object.data = object.data || {};            
            object.data.listeners = object.data.listeners || {};

            object.addEventListener = (type, listener = YooGame.f.null) => {
                const listeners = object.data.listeners;
                listeners[type] = listeners[type] || [];
                if (!listeners[type].includes(listener)) listeners[type].push(listener);
            };
            object.on = object.addEventListener;

            object.addEventListeners = ons => {
                if (!YooGame.f.empty(ons) && typeof ons === "object") for (const on in ons) {
                    const listeners = ons[on];
                    if (Array.isArray(listeners)) listeners.map(listener => object.addEventListener(on, listener));
                    else object.addEventListener(on, listeners);
                }

                return object;
            };
            object.ons = object.addEventListeners;

            object.hasEventListener = (type, listener) => {
                const listeners = object.data.listeners;
                if (YooGame.f.empty(listener)) return !YooGame.f.empty(listeners[type]);
                else return !YooGame.f.empty(listeners[type]) && listeners[type].includes(listener);
            };
            object.has = object.hasEventListener;
            
            object.removeEventListener = (type, listener) => {
                const listeners = object.data.listeners;
                const listenerArray = listeners[type];

                if (!YooGame.f.empty(listenerArray)) {
                    const index = listenerArray.indexOf(listener);
                    if (index !== -1) listenerArray.splice(index, 1);
                }

                return object;
            };
            object.off = object.removeEventListener;

            object.dispatchEvent = (type, event = {}) => {
                const listeners = object.data.listeners;
                const listenerArray = listeners[type];
                const results = [];

                if (!YooGame.f.empty(listenerArray)) {
                    event.target = object;
                    listenerArray.map(listener => results.push(listener.call(object, event)));
                }

                return !results.includes(false);
            };
            object.trigger = object.dispatchEvent;
        },
        sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
        polygon: (points = 3, radius = 25) => {
            const round = 2;
            const polygon = []
            for (let i = 1; i <= points; i++) polygon.push([
                Math.round(radius * Math.cos(2 * i * Math.PI / points)),
                Math.round(radius * Math.sin(2 * i * Math.PI / points))
            ]);
            return polygon;
        },
        rotateCoordinates: (x, y, cX, cY, radians) => {
            const tempX = x - cX;
            const tempY = y - cY;

            const rotatedX = tempX * Math.cos(radians) - tempY * Math.sin(radians);
            const rotatedY = tempX * Math.sin(radians) + tempY * Math.cos(radians);

            return [rotatedX, rotatedY];
        }
    };

    YooGame.k = {}; // current pressed keys

    YooGame.r = { // rendering functions
        rectangle: (context, x, y, width, height, radii) => {
            const cap = 32;

            if (typeof radii === "number") {
                if (radii > cap) radii = cap;
                radii = [radii, radii, radii, radii];
            } else for (let i = 0; i < 4; i++) {
                let radius = !YooGame.empty(radii[i]) ? radii[i] : 0;
                if (radius > cap) radius = cap;
                radii[i] = radius;
            }

            context.beginPath();

            context.moveTo(x + radii[0], y);
            context.lineTo(x + width - radii[1], y);
            context.quadraticCurveTo(x + width, y, x + width, y + radii[1]);

            context.lineTo(x + width, y + height - radii[2]);
            context.quadraticCurveTo(x + width, y + height, x + width - radii[2], y + height);

            context.lineTo(x + radii[3], y + height);
            context.quadraticCurveTo(x, y + height, x, y + height - radii[3]);

            context.lineTo(x, y + radii[0]);
            context.quadraticCurveTo(x, y, x + radii[0], y);

            context.closePath();
            
            context.fill();
            context.stroke();
        },
        ellipse: (context, x, y, radiusX, radiusY, angle = 0) => {
            x += radiusX;
            y += radiusY;

            context.beginPath();
            context.ellipse(x, y, radiusX, radiusY, angle, 0, 2 * Math.PI);
            context.closePath();

            context.fill();
            context.stroke();
        },
        polygon: (context, x, y, points, radius = 0) => {
            points = points.map(point => ({x: x + point[0], y: y + point[1]}));

            const distance = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
            const lerp = (a, b, x) => a + (b - a) * x;

            const lerp2D = (p1, p2, t) => ({
                x: lerp(p1.x, p2.x, t),
                y: lerp(p1.y, p2.y, t)
            });

            const numPoints = points.length;

            const corners = [];
            for (let i = 0; i < numPoints; i++) {
                const lastPoint = points[i];
                const thisPoint = points[(i + 1) % numPoints];
                const nextPoint = points[(i + 2) % numPoints];

                const lastEdgeLength = distance(lastPoint, thisPoint);
                const lastOffsetDistance = Math.min(lastEdgeLength / 2, radius);
                const start = lerp2D(
                    thisPoint,
                    lastPoint,
                    lastOffsetDistance / lastEdgeLength
                );

                const nextEdgeLength = distance(nextPoint, thisPoint);
                const nextOffsetDistance = Math.min(nextEdgeLength / 2, radius);
                const end = lerp2D(
                    thisPoint,
                    nextPoint,
                    nextOffsetDistance / nextEdgeLength
                );

                corners.push([start, thisPoint, end]);
            }

            context.beginPath();

            context.moveTo(corners[0][0].x, corners[0][0].y);
            for (const [start, ctrl, end] of corners) {
                context.lineTo(start.x, start.y);
                context.quadraticCurveTo(ctrl.x, ctrl.y, end.x, end.y);
            }

            context.closePath();

            context.fill();
            context.stroke();
        }
    };

    YooGame.t = { // animation timing functions
        // current time, start, offset, time
        easeLinear: (t, b, c, d) => c * t / d + b
    };

    // if (YooGame.f.empty(Worker)) YooGame.worker = new _Worker();
    // else {
    //     let blob;

    //     try { blob = new Blob(["importScripts(\"file:///C:/Users/arobins/Documents/Yoo-Game/Worker.Yoo-Game.js\");"], { "type": "application/javascript" }); } catch (e1) {
    //         const blobBuilder = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)();
    //         blobBuilder.append("importScripts(\"file:///C:/Users/arobins/Documents/Yoo-Game/Worker.Yoo-Game.js\");");
    //         blob = blobBuilder.getBlob("application/javascript");
    //     }

    //     const url = window.URL || window.webkitURL;
    //     const blobURL = url.createObjectURL(blob);

    //     YooGame.worker = new Worker(blobURL);
    // }

    window.addEventListener("keydown", event => { // add keys when released
        const key = event.key;
        YooGame.k[key] = true;
    });

    window.addEventListener("keyup", event => { // remove keys when released
        const key = event.key;
        delete YooGame.k[key];
    });

    window.addEventListener("blur", () => YooGame.k = {}); // delete all pressed keys if window loses focus
})();

if (typeof module !== "undefined" && typeof module.exports !== "undefined") module.exports = YooGame;
