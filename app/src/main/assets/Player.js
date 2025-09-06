// Player.js
import { Character } from './Character.js';
import * as input from './input.js';
import * as globals from './globals.js'; // For boundaries, and potentially ANIMATIONS if not passed
import { Logger } from './logger.js';//todo import logger in all other files

export class Player extends Character {
    // Player.js - Constructor
    constructor(x, y, animationName, spriteScale, health, speed, tilemap) {
        super(x, y, animationName, spriteScale, health, speed); // This sets this.width and this.height

        // Logger.debug("[Player Cons] After super(): this.width=", this.width, "this.height=", this.height);
        if (typeof this.width === 'undefined' || this.width === 0) {
            Logger.warn("[Player Cons] this.width is undefined or 0 after super(). Hitbox calculations will be incorrect. Using fallbacks for hitbox.");
            // Provide fallback dimensions for hitbox if sprite dimensions aren't ready
            // This is a safety net; the ideal is that this.width/height are always set by super()
            const fallbackSpriteWidth = 32 * (this.spriteScale || 1); // Assuming default if spriteScale isn't set either
            const fallbackSpriteHeight = 32 * (this.spriteScale || 1);
            this.hitboxWidth = fallbackSpriteWidth - (2 * 2);  // Example fallback offsets
            this.hitboxHeight = fallbackSpriteHeight - (2 * 4);
        } else {
            // Define hitbox relative to player's sprite origin (this.x, this.y)
            // These offsets determine how far IN from the sprite's edges the hitbox starts.
            this.hitboxOffsetX = 8;  // Example: Start hitbox 8 pixels in from the left of the sprite
            this.hitboxOffsetY = 10; // Example: Start hitbox 10 pixels down from the top of the sprite

            // Calculate the hitbox dimensions.
            // (2 * this.hitboxOffsetX) means you're reducing the width by the offset amount from BOTH sides.
            this.hitboxWidth = this.width - (2 * this.hitboxOffsetX);
            // (2 * this.hitboxOffsetY) reduces height by offset from top AND bottom.
            this.hitboxHeight = this.height - (2 * this.hitboxOffsetY);
        }

        // Ensure hitbox dimensions are not negative if offsets are too large for the sprite size
        if (this.hitboxWidth < 0) {
            Logger.warn(`[Player Cons] Calculated hitboxWidth (${this.hitboxWidth}) is negative. Clamping to 0. Check offsets and sprite width.`);
            this.hitboxWidth = 0;
        }
        if (this.hitboxHeight < 0) {
            Logger.warn(`[Player Cons] Calculated hitboxHeight (${this.hitboxHeight}) is negative. Clamping to 0. Check offsets and sprite height.`);
            this.hitboxHeight = 0;
        }

        // Logger.debug(`[Player Cons] Hitbox: offsetX=${this.hitboxOffsetX}, offsetY=${this.hitboxOffsetY}, width=${this.hitboxWidth}, height=${this.hitboxHeight}`);

        this.entityType = "player";
        this.tilemap = tilemap;
    }

    getActualHitbox() { // Renamed for clarity
        return {
            x: this.x + this.hitboxOffsetX,
            y: this.y + this.hitboxOffsetY,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }
    update(deltaTime, currentTime, activeGameElements) {
        if (!this.isActive) return;
        // Inside Player.update()

        // Define debugCtx and camera variables at the start of the update method
        const debugCtx = window.mainContext; // Assuming your main 2D context is globally accessible as window.mainContext
        const cameraX = window.camera ? window.camera.x : 0; // Assuming global camera at window.camera
        const cameraY = window.camera ? window.camera.y : 0;
        // 1. Get Input and Calculate Desired Movement Delta (this part is largely from your existing code)
        let dXInput = 0;
        let dYInput = 0;

        if (input.isActionActive('moveUp')) dYInput -= 1;
        if (input.isActionActive('moveDown')) dYInput += 1;
        if (input.isActionActive('moveLeft')) dXInput -= 1;
        if (input.isActionActive('moveRight')) dXInput += 1;

        let dx = 0; // This will be the actual pixel change for X for THIS FRAME
        let dy = 0; // This will be the actual pixel change for Y for THIS FRAME

        if (dXInput !== 0 && dYInput !== 0) {
            const length = Math.sqrt(dXInput * dXInput + dYInput * dYInput);
            // Calculate final dx and dy for the frame based on normalized input, speed, and deltaTime
            dx = (dXInput / length) * this.speed * deltaTime;
            dy = (dYInput / length) * this.speed * deltaTime;
        } else {
            // Handle non-diagonal movement
            dx = dXInput * this.speed * deltaTime;
            dy = dYInput * this.speed * deltaTime;
        }

        // At this point, 'dx' and 'dy' represent how much the player WANTS to move this frame
        // based on input and speed.
        // If you have gravity, you'd add its effect to 'dy' here:
        // dy += this.gravity * deltaTime; (or however you calculate gravity's effect)


        // --- NOW, THE SIMPLIFIED COLLISION HANDLING from my previous example ---
        // --- It will use the 'dx' and 'dy' calculated above ---

        // 2. Try to move Horizontally using the calculated 'dx'
        let proposedPlayerX = this.x + dx; // 'this' refers to the player instance
        let playerHitboxAtProposedX = {
            x: proposedPlayerX,
            y: this.y,
            width: this.hitboxWidth, // Or this.hitboxWidth if defined //todo hitbox
            height: this.hitboxHeight // Or this.hitboxHeight //todo hitbox
        };
        // Figure out which tiles to check horizontally
        // For simplicity, we can check just the corners of the player's proposed hitbox
        // More robust checks would span the entire edge, but let's start simple.
        let leftEdgeTileCol = Math.floor(playerHitboxAtProposedX.x / this.tilemap.tileSize);
        let rightEdgeTileCol = Math.floor((playerHitboxAtProposedX.x + playerHitboxAtProposedX.width) / this.tilemap.tileSize);
        let topEdgeTileRow = Math.floor(playerHitboxAtProposedX.y / this.tilemap.tileSize); // Use current Y
        let bottomEdgeTileRow = Math.floor((playerHitboxAtProposedX.y + playerHitboxAtProposedX.height) / this.tilemap.tileSize);

        let collisionX = false;
        for (let col = leftEdgeTileCol; col <= rightEdgeTileCol; col++) {
            for (let row = topEdgeTileRow; row <= bottomEdgeTileRow; row++) {
                if (this.tilemap.isTileSolid(col, row)) {
                    let tileRect = {
                        x: col * this.tilemap.tileSize,
                        y: row * this.tilemap.tileSize,
                        width: this.tilemap.tileSize,
                        height: this.tilemap.tileSize
                    };




                    // --- DEBUG DRAW TILE BEING CHECKED ---
                    if (globals.DEBUG_MODE && debugCtx) {
                        debugCtx.strokeStyle = 'rgba(0, 0, 255, 0.7)'; // Blue for solid tiles being checked
                        debugCtx.lineWidth = 1;
                        debugCtx.strokeRect(
                            tileRect.x - cameraX,
                            tileRect.y - cameraY,
                            tileRect.width,
                            tileRect.height
                        );
                    }
                    // --- END DEBUG DRAW TILE ---




                    if (checkCollision(playerHitboxAtProposedX, tileRect)) {
                        collisionX = true;
                        // If collision, don't allow the full dx.
                        // Instead, place player right next to the tile.
                        if (dx > 0) { // Moving right
                            this.x = tileRect.x - this.width; // Adjust player's x
                        } else if (dx < 0) { // Moving left
                            this.x = tileRect.x + this.tilemap.tileSize; // Adjust player's x
                        }
                        dx = 0; // Stop further horizontal movement this frame if collision
                        break; // Stop checking tiles in this row
                    }
                }
            }
            if (collisionX) break; // Stop checking other rows if collision found
        }

        // If no horizontal collision, apply the original dx
        if (!collisionX) {
            this.x += dx;
        }


        // 2. Try to move Vertically
        let proposedPlayerY = this.y + dy;
        let playerHitboxAtProposedY = {
            x: this.x, // Use the (potentially X-adjusted) current X
            y: proposedPlayerY,
            width: this.hitboxWidth,//todo this.hitboxWidth if defined
            height: this.hitboxHeight //todo this.hitboxHeight
        };

        // Figure out which tiles to check vertically
        leftEdgeTileCol = Math.floor(playerHitboxAtProposedY.x / this.tilemap.tileSize);
        rightEdgeTileCol = Math.floor((playerHitboxAtProposedY.x + playerHitboxAtProposedY.width) / this.tilemap.tileSize);
        topEdgeTileRow = Math.floor(playerHitboxAtProposedY.y / this.tilemap.tileSize);
        bottomEdgeTileRow = Math.floor((playerHitboxAtProposedY.y + playerHitboxAtProposedY.height) / this.tilemap.tileSize);

        let collisionY = false;
        for (let col = leftEdgeTileCol; col <= rightEdgeTileCol; col++) {
            for (let row = topEdgeTileRow; row <= bottomEdgeTileRow; row++) {
                if (this.tilemap.isTileSolid(col, row)) {
                    Logger.info(`[Player V-COLL] Solid tile [${col},${row}] for dy=${dy}. tilemap.tileSize=${this.tilemap.tileSize}`);

                    let tileRect = {
                        x: col * this.tilemap.tileSize,
                        y: row * this.tilemap.tileSize,
                        width: this.tilemap.tileSize,
                        height: this.tilemap.tileSize
                    };
                    Logger.info("[Player V-COLL] tileRect:", JSON.stringify(tileRect));
                    Logger.info("[Player V-COLL] playerHitboxAtProposedY:", JSON.stringify(playerHitboxAtProposedY));

                    if (checkCollision(playerHitboxAtProposedY, tileRect)) {
                        collisionY = true;
                        if (dy > 0) { // Moving down
                            this.y = tileRect.y - this.height; // Adjust player's y
                        } else if (dy < 0) { // Moving up
                            this.y = tileRect.y + this.tilemap.tileSize; // Adjust player's y
                        }
                        dy = 0; // Stop further vertical movement
                        Logger.warn(`[Player V-COLL] AFTER this.y=${this.y}. tileRect.y=${tileRect.y}, tileSize=${this.tilemap.tileSize}`);
                        break;
                    }
                }
            }
            if (collisionY) break;
        }

        // If no vertical collision, apply the original dy
        if (!collisionY) {
            this.y += dy;
        }

        // 4. Update Animations and other player state
        // This part of your Player.js remains largely the same
        if (dXInput !== 0 || dYInput !== 0) { // Use dXInput/dYInput for animation trigger
            this.setAnimation('pickle_player_walk');
        } else {
            this.setAnimation('pickle_player_idle');
        }
        if (dXInput > 0) this.facingDirection = 1;
        else if (dXInput < 0) this.facingDirection = -1;

        // Call Character's update (which in turn calls Sprite's update for animation)
        super.update(deltaTime, currentTime, activeGameElements);

        // Ensure the player's stored hitbox (if you have one separate from x/y/width/height)
        // is updated after all movement and collision resolution.
        // e.g., this.updateHitbox(); if you defined such a method.

    }

    // Player's draw method will be inherited from Character, which inherits from Sprite.
    // No specific draw override needed here unless Player has unique visuals beyond the sprite.

    draw(ctx, camera) { // Assuming ctx and camera are passed (common pattern)
        // Call the parent's draw method to draw the actual sprite
        super.draw(ctx, camera); // Or however your Sprite/Character draw is invoked

        // --- DEBUG DRAW PLAYER HITBOX ---
        if (globals.DEBUG_MODE) {
            // Adjust for camera. If no camera, these are just 0.
            const cameraX = camera ? camera.x : 0;
            const cameraY = camera ? camera.y : 0;

            const drawX = this.x - cameraX;
            const drawY = this.y - cameraY;

            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'; // Bright red, slightly transparent
            ctx.lineWidth = 2;

            // Draw the actual hitbox you defined and intend to use for collision
            ctx.strokeRect(
                drawX + this.hitboxOffsetX,
                drawY + this.hitboxOffsetY,
                this.hitboxWidth,
                this.hitboxHeight
            );

            // OPTIONALLY: Draw a small circle at the player's origin (this.x, this.y)
            ctx.fillStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

}
// You can put this in a utility file or directly in your main game logic file for now.
function checkCollision(rect1, rect2) {
    // rect1 and rect2 are objects like: { x: 0, y: 0, width: 10, height: 10 }
    if (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
    ) {
        return true; // They are colliding
    }
    return false; // No collision
}