// Player.js
import { Character } from './Character.js';
import * as input from './input.js';
import * as globals from './globals.js'; // For boundaries, and potentially ANIMATIONS if not passed

export class Player extends Character {
    constructor(x, y, animationName, spriteScale, health, speed) {
        // animationName is now the *initial* animation, e.g., "pickle_player_idle"
        super(x, y, animationName, spriteScale, health, speed);
        this.entityType = "player";
    }

    update(deltaTime, currentTime, activeGameElements) {
        if (!this.isActive) return;

        // --- Input and Movement Logic (largely the same as you had) ---
        let dXInput = 0;
        let dYInput = 0;

        if (input.isActionActive('moveUp')) dYInput -= 1;
        if (input.isActionActive('moveDown')) dYInput += 1;
        if (input.isActionActive('moveLeft')) dXInput -= 1;
        if (input.isActionActive('moveRight')) dXInput += 1;

        if (dXInput !== 0 && dYInput !== 0) {
            const length = Math.sqrt(dXInput * dXInput + dYInput * dYInput);
            dXInput = (dXInput / length);
            dYInput = (dYInput / length);
        }

        if (dXInput > 0) this.facingDirection = 1; // Sprite class uses this
        else if (dXInput < 0) this.facingDirection = -1;

        this.x += dXInput * this.speed * deltaTime; // Character speed
        this.y += dYInput * this.speed * deltaTime;

        if (isNaN(this.x) || isNaN(this.y)) {
            console.error(`[Player.update] x or y became NaN! x=${this.x}, y=${this.y}`);
            // Reset or deactivate
        }

        // Boundary checks
        const playerWidth = this.width; // Width is now set by Sprite based on current frame
        const playerHeight = this.height; // Height is now set by Sprite

        const minX = 0;
        const maxX = globals.nativeGameWidth - playerWidth;
        const minY = 0;
        const maxY = globals.nativeGameHeight - playerHeight;

        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX;
        if (this.y < minY) this.y = minY;
        if (this.y > maxY) this.y = maxY;
        // --- End of Movement ---

        // --- Animation State Logic ---
        // Player decides *which* animation to play based on its state.
        // The Sprite class handles *how* to play it.
        if (dXInput !== 0 || dYInput !== 0) {
            this.setAnimation('pickle_player_walk'); // Call Sprite's setAnimation method
        } else {
            this.setAnimation('pickle_player_idle'); // Make sure these animation names exist in globals.ANIMATIONS
        }

        // Call Character's update (which in turn calls Sprite's update for animation)
        super.update(deltaTime, currentTime, activeGameElements);
    }

    // Player's draw method will be inherited from Character, which inherits from Sprite.
    // No specific draw override needed here unless Player has unique visuals beyond the sprite.
}
