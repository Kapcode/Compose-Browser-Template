import { Sprite } from './Sprite.js';
import * as globals from './globals.js';
import { getSpriteSheetImage, isSpriteSheetLoaded } from './assetManager.js'; // <--- ADD THIS IMPORT
export class Character extends Sprite {
    constructor(x, y, animationName, spriteScale, health, speed) {
        super(x, y, animationName, spriteScale);
        this.entityType = "character"; // More specific
        this.health = health;
        this.speed = speed;
        this.image = getSpriteSheetImage(); // <--- USE THE IMPORTED FUNCTION
        this.direction = { x: 0, y: 0 };
    }

    update(deltaTime, currentTime, activeGameElements) {
        super.update(deltaTime, currentTime, activeGameElements); // Update animation

        // Movement (can be overridden by subclasses like Player or Enemy)
        this.x += this.direction.x * this.speed * deltaTime;
        this.y += this.direction.y * this.speed * deltaTime;
    }
    // draw() is inherited from Sprite
}