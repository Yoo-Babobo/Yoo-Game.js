/**
 * Yoo-Game.js
 */

const YooGame = (() => {
    class Game {
        #element = null;

        paused = true;

        context = null;
        
        width = 300;
        height = 100;

        background = "transparent";

        scene = null;

        get element() {
            return this.#element;
        }

        constructor({
            element,
            width,
            height,
            background
        }) {
            this.#element = element || document.createElement("canvas");
            this.context = this.element.getContext("2d");

            this.width = width || 300;
            this.height = height || 100;

            this.background = background || "transparent";
        }

        #loop(time) {
            const { width, height, scene } = this;

            this.element.width = width;
            this.element.height = height;

            this.#render();

            if (scene instanceof Scene) scene.loop(this, time);

            requestAnimationFrame(time => this.#loop(time));
        }

        #render() {
            const { context, width, height, background } = this;

            context.fillStyle = background;
            context.fillRect(0, 0, width, height);
        }

        init() {
            this.play();
            requestAnimationFrame(time => this.#loop(time));
        }

        play() {
            this.paused = false;
        }

        pause() {
            this.paused = true;
        }
    }

    class Scene {
        width = 300;
        height = 100;

        #layers = [];

        get layers() {
            return this.#layers;
        }

        constructor({
            width,
            height,
            layers
        }) {
            this.width = width || 300;
            this.height = height || 100;

            this.#layers = layers || [];
        }

        loop(game, time) {
            // Rendering
            this.layers.map(layer => {
                const { elements = [] } = layer;

                elements.map(element => element instanceof Element && element.render(game, this, layer));
            });

            // Updating
            this.layers.reverse().map(layer => {
                const { elements = [] } = layer;

                elements.map(element => element instanceof Element && element.update(game, this, layer));
            });

            this.#render();
        }

        #render() {

        }
    }

    class Element {
        id = null;
        
        tags = [];

        x = 0;
        y = 0;
        
        width = 100;
        height = 100;

        background = "black";

        constructor({
            id,
            tags,
            x,
            y,
            width,
            height,
            background
        }) {
            this.id = id || null;
            this.tags = tags || [];
            this.x = x || 0;
            this.y = y || 0;
            this.width = width || 100;
            this.height = height || 100;
            this.background = background || "black";
        }

        render(game, scene, layer) {
            const { x, y, width, height, background } = this;
            const { context } = game;

            context.fillStyle = background;
            context.fillRect(x, y, width, height);
        }

        update(game, scene, layer) {
            
        }
    }

    return {
        Game,
        Scene,
        Element
    };
})();
