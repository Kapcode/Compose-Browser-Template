// Character.js
import { Sprite } from './Sprite.js'; // Character now extends the modified Sprite

export class Character extends Sprite {
    constructor(x, y, animationName, spriteScale, health, speed) {
        // Pass relevant parameters to Sprite constructor
        super(x, y, animationName, spriteScale); // Sprite handles animationName and spriteScale

        this.health = health;
        this.speed = speed; // Base speed for the character
        this.entityType = "character"; // Or specific type like "enemy_character"
    }

    // update method in Character can add more shared logic if needed
    update(deltaTime, currentTime, activeGameElements) {
        if (!this.isActive) return;

        // Call Sprite's update (which handles animation)
        super.update(deltaTime, currentTime, activeGameElements);

        // Add any character-specific update logic here
        // e.g., if (this.health <= 0) this.die();
    }

    // Draw method in Character typically just calls super.draw() unless it has
    // its own specific visual elements beyond the sprite (e.g., a health bar).
    draw(ctx) {
        if (!this.isActive) return;
        super.draw(ctx); // This will call Sprite's draw method

        // Example: Draw a simple health bar above the character
        // if (this.health < this.maxHealth && window.debugMode) {
        //     const barWidth = this.width * 0.8;
        //     const barHeight = 5;
        //     const barX = this.x + (this.width - barWidth) / 2;
        //     const barY = this.y - barHeight - 2;
        //     ctx.fillStyle = 'red';
        //     ctx.fillRect(barX, barY, barWidth, barHeight);
        //     ctx.fillStyle = 'green';
        //     ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
        // }
    }

    // Other character-specific methods (takeDamage, die, etc.)
}
