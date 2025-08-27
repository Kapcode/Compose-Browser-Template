import { Character } from './Character.js';
export class Player extends Character {
    constructor(x, y, animationName, spriteScale) {
        super(x, y, animationName, spriteScale, 100, 150); // Example health and speed
        this.entityType = "player_chef";
        // Player-specific properties (score, inventory, etc.)
    }

    update(deltaTime, currentTime, activeGameElements) {
        // Player-specific input handling to set this.direction
        // handlePlayerInput(this); // A function that modifies this.direction based on keys

        super.update(deltaTime, currentTime, activeGameElements); // Call Character's update for movement & animation
        // Player-specific logic (e.g., shooting, interacting)
    }
}