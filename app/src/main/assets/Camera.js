// Camera.js
export class Camera {
    constructor(x, y, width, height, worldWidth, worldHeight) {
        this.x = x; // Camera's top-left position in the game WORLD
        this.y = y;
        this.width = width;   // Width of the camera's viewport (usually canvas width)
        this.height = height; // Height of the camera's viewport (usually canvas height)

        this.worldWidth = worldWidth;   // Total width of the game world/map
        this.worldHeight = worldHeight; // Total height of the game world/map

        this.target = null; // The object the camera will follow (e.g., the player)
        this.deadZoneX = width / 4;  // Dead zone for smoother horizontal following
        this.deadZoneY = height / 3; // Dead zone for smoother vertical following (can be adjusted)

        // For smoother following (damping)
        this.damping = 0.05; // Lower value = smoother/slower follow, 1 = instant follow

        console.log(`[Camera] Initialized. Viewport: ${width}x${height}, World: ${worldWidth}x${worldHeight}`);
    }

    follow(target) {
        this.target = target;
        console.log("[Camera] Now following target:", target);
    }

    setWorldSize(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        console.log(`[Camera] World size updated to: ${worldWidth}x${worldHeight}`);
        // Re-clamp camera position if necessary
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height));
    }

    update() {
        if (!this.target) {
            return;
        }

        // Calculate the ideal camera position to center the target
        let idealX = this.target.x + (this.target.width / 2) - (this.width / 2);
        let idealY = this.target.y + (this.target.height / 2) - (this.height / 2);

        // --- Simpler follow logic (without dead zone or damping) ---
        // this.x = idealX;
        // this.y = idealY;

        // --- Follow logic with Damping ---
        // Interpolate towards the ideal position
        this.x += (idealX - this.x) * this.damping;
        this.y += (idealY - this.y) * this.damping;


        // --- Follow logic with Dead Zone (more complex, can be added later if needed) ---
        // // Horizontal dead zone
        // const targetCenterX = this.target.x + this.target.width / 2;
        // const deadZoneStartX = this.x + this.deadZoneX;
        // const deadZoneEndX = this.x + this.width - this.deadZoneX;

        // if (targetCenterX < deadZoneStartX) {
        //     this.x = targetCenterX - this.deadZoneX;
        // } else if (targetCenterX > deadZoneEndX) {
        //     this.x = targetCenterX - (this.width - this.deadZoneX);
        // }

        // // Vertical dead zone (less common for pure side-scrollers, more for platformers with verticality)
        // const targetCenterY = this.target.y + this.target.height / 2;
        // const deadZoneStartY = this.y + this.deadZoneY;
        // const deadZoneEndY = this.y + this.height - this.deadZoneY;

        // if (targetCenterY < deadZoneStartY) {
        //     this.y = targetCenterY - this.deadZoneY;
        // } else if (targetCenterY > deadZoneEndY) {
        //     this.y = targetCenterY - (this.height - this.deadZoneY);
        // }


        // Clamp camera to world boundaries
        // Ensure camera doesn't show areas outside the map
        if (this.worldWidth > 0) { // Only clamp if worldWidth is meaningful
            this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
        } else {
            this.x = 0; // Or some default if world is not defined yet
        }
        if (this.worldHeight > 0) { // Only clamp if worldHeight is meaningful
            this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height));
        } else {
            this.y = 0;
        }
    }

    // Call this before drawing any world objects
    apply(ctx) {
        ctx.save();
        // Translate the canvas context so that the camera's (x,y) becomes the new (0,0)
        ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
    }

    // Call this after drawing all world objects if you want to draw UI on top without translation
    end(ctx) {
        ctx.restore();
    }
}
