// camera.js
export class Camera {//todo clammping for fixed levels .. make sure camera stayes inside the level boundry element update?
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.target = null; // The game object to follow
        this.deadZone = { // Optional: Area where player can move without camera moving
            x: width / 4,
            y: height / 4
        };
        this.smoothing = 0.1; // Optional: For smoother camera movement (0-1)
    }

    follow(gameObject) {
        this.target = gameObject;
    }

    update() {
        if (!this.target) return;

        // Simple follow (center target)
        // this.x = this.target.x + (this.target.width / 2) - (this.width / 2);
        // this.y = this.target.y + (this.target.height / 2) - (this.height / 2);

        // Follow with dead zone and smoothing (more advanced)
        const targetCenterX = this.target.x + (this.target.width / 2);
        const targetCenterY = this.target.y + (this.target.height / 2);

        let idealX = targetCenterX - this.width / 2;
        let idealY = targetCenterY - this.height / 2;

        // Dead zone logic (optional)
        const dx = targetCenterX - (this.x + this.width / 2);
        const dy = targetCenterY - (this.y + this.height / 2);

        if (Math.abs(dx) > this.deadZone.x) {
            idealX = this.x + (dx - Math.sign(dx) * this.deadZone.x);
        } else {
            idealX = this.x; // Stay put if within horizontal deadzone
        }
        if (Math.abs(dy) > this.deadZone.y) {
            idealY = this.y + (dy - Math.sign(dy) * this.deadZone.y);
        } else {
            idealY = this.y; // Stay put if within vertical deadzone
        }


        // Apply smoothing
        this.x += (idealX - this.x) * this.smoothing;
        this.y += (idealY - this.y) * this.smoothing;


        // Clamp camera to level boundaries (for fixed levels)
        // if (this.levelWidth && this.levelHeight) {
        //     this.x = Math.max(0, Math.min(this.x, this.levelWidth - this.width));
        //     this.y = Math.max(0, Math.min(this.y, this.levelHeight - this.height));
        // }
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(-Math.round(this.x), -Math.round(this.y)); // Use Math.round for pixel-perfect rendering
    }

    release(ctx) {
        ctx.restore();
    }

    // Optional utility methods
    worldToScreen(worldX, worldY) {
        return { x: worldX - this.x, y: worldY - this.y };
    }

    screenToWorld(screenX, screenY) {
        return { x: screenX + this.x, y: screenY + this.y };
    }

    // Method to set level boundaries for clamping
    setLevelBoundaries(levelWidth, levelHeight) {
        this.levelWidth = levelWidth;
        this.levelHeight = levelHeight;
    }
}

// Make it globally accessible or pass it around
// const camera = new Camera(0, 0, canvas.width, canvas.height);
