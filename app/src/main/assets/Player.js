// Player.js
import { Character } from './Character.js';
import * as input from './input.js'; // IMPORT input.js HERE
import * as globals from './globals.js'; // If needed for boundaries

export class Player extends Character {
    constructor(x, y, animationName, spriteScale, health, speed) {
        super(x, y, animationName, spriteScale, health, speed); // Passes to Character
        this.entityType = "player";
        // this.dx and this.dy are not strictly needed if all logic is in update
    }

    // No need for separate move() and stopMovement() if all logic is in update

    update(deltaTime, currentTime, activeGameElements) {
        // --- Logic from updatePickleMovement now goes here ---
        if (!this.isActive) return; // Or just 'this' instead of 'pickleEntity'

        let dXInput = 0; // Change in X based on input
        let dYInput = 0; // Change in Y based on input

        // Use the actions defined in input.js
        if (input.isActionActive('moveUp')) {
            dYInput -= 1;
        }
        if (input.isActionActive('moveDown')) {
            dYInput += 1;
        }
        if (input.isActionActive('moveLeft')) {
            dXInput -= 1;
        }
        if (input.isActionActive('moveRight')) {
            dXInput += 1;
        }

        // Normalize diagonal movement
        if (dXInput !== 0 && dYInput !== 0) {
            const length = Math.sqrt(dXInput * dXInput + dYInput * dYInput);
            dXInput = (dXInput / length);
            dYInput = (dYInput / length);
        }

        // Apply movement
        // Ensure this.speed is a valid number (initialized in Character/Player constructor)
        // Ensure deltaTime is a valid number (passed as parameter)
        if (isNaN(this.speed) || typeof this.speed !== 'number') {
            console.error(`[Player.update] Invalid this.speed: ${this.speed}`);
            return;
        }
        if (isNaN(deltaTime) || typeof deltaTime !== 'number') {
            console.error(`[Player.update] Invalid deltaTime: ${deltaTime}`);
            return;
        }

        // Update facing direction for sprite flipping based on input
        if (dXInput > 0) this.facingDirection = 1;
        else if (dXInput < 0) this.facingDirection = -1;

        this.x += dXInput * this.speed * deltaTime;
        this.y += dYInput * this.speed * deltaTime;

        // Log for NaN debugging
        if (isNaN(this.x) || isNaN(this.y)) {
            console.error(`[Player.update] x or y became NaN! x=${this.x}, y=${this.y}`);
            console.error(`  dXInput=${dXInput}, dYInput=${dYInput}, this.speed=${this.speed}, deltaTime=${deltaTime}`);
            // Potentially reset to a safe value or deactivate
            // this.x = globals.nativeGameWidth / 2; // Example reset
            // this.isActive = false;
        }


        // Optional: Keep Player within game boundaries
        const minX = 0;
        // Make sure globals.nativeGameWidth and this.width are valid numbers
        const maxX = globals.nativeGameWidth - this.width;
        const minY = 0;
        const maxY = globals.nativeGameHeight - this.height;

        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX;
        if (this.y < minY) this.y = minY;
        if (this.y > maxY) this.y = maxY;
        // --- End of logic from updatePickleMovement ---

        // Animation state changes based on dXInput/dYInput
        if (dXInput !== 0 || dYInput !== 0) {
            // this.setAnimation('your_walk_animation'); // Make sure setAnimation works
        } else {
            // this.setAnimation('your_idle_animation');
        }

        super.update(deltaTime, currentTime, activeGameElements); // Call Character's update
    }
}

