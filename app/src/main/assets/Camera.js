// Camera.js
import { Logger } from './logger.js';
export class Camera {
    constructor(x, y, width, height, worldWidth, worldHeight) {
        this.x = x; // Camera's top-left position in the game WORLD
        this.y = y;
        this.width = width;   // Width of the camera's viewport (usually canvas width)
        this.height = height; // Height of the camera's viewport (usually canvas height)

        this.worldWidth = worldWidth;   // Total width of the game world/map
        this.worldHeight = worldHeight; // Total height of the game world/map

        this.target = null; // The object the camera will follow (e.g., the player)
        // deadZoneX is the margin from the edge of the viewport to the start of the dead zone.
        // The actual dead zone starts at camera.x + deadZoneX (in world space, for logic)
        // or at deadZoneX (in camera/native view space, for debug drawing).
        this.deadZoneX = width / 2.2; // Example: if width is 1280, deadZoneX is ~581. Dead zone is very small.
                                     // Consider width / 4 for a 25% margin from each side.
        this.deadZoneY = height / 3; 

        this.damping = 0.15; 

        Logger.trace(`[Camera] Initialized. Viewport: ${width}x${height}, World: ${worldWidth}x${worldHeight}`);
        Logger.trace(`[Camera] DeadZoneX margin: ${this.deadZoneX.toFixed(2)}, DeadZoneY margin: ${this.deadZoneY.toFixed(2)}`);
    }

    follow(target) {
        this.target = target;
        Logger.trace("[Camera] Now following target:", this.target);
    }

    setWorldSize(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        Logger.trace(`[Camera] World size updated to: ${worldWidth}x${worldHeight}`);
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height));
    }

    update() {
        // Logger.trace("[Camera UPDATE method] 'this' refers to:", this);
        // Logger.trace(`[Camera UPDATE method] (Line 40-ish) this.target is:`, this.target, this.worldWidth, this.worldHeight);

        if (!this.target) {
            return;
        }

        // --- X-axis: Dead Zone Logic ---
        const playerCenterX = this.target.x + this.target.width / 2;
        // deadZoneLeftEdgeWorld is the X coordinate in the GAME WORLD of the left edge of the dead zone.
        const deadZoneLeftEdgeWorld = this.x + this.deadZoneX;
        // deadZoneRightEdgeWorld is the X coordinate in the GAME WORLD of the right edge of the dead zone.
        const deadZoneRightEdgeWorld = this.x + this.width - this.deadZoneX;
        
        let targetCameraX = this.x; 

        // Logger.trace(`[CAM Update X] PlayerCenter: ${playerCenterX.toFixed(2)}, DZ_Left_World: ${deadZoneLeftEdgeWorld.toFixed(2)}, DZ_Right_World: ${deadZoneRightEdgeWorld.toFixed(2)}`);

        if (playerCenterX < deadZoneLeftEdgeWorld) {
            targetCameraX = playerCenterX - this.deadZoneX;
            // Logger.trace(`[CAM Update X] Player left of DZ. TargetCamX: ${targetCameraX.toFixed(2)}`);
        } else if (playerCenterX > deadZoneRightEdgeWorld) {
            targetCameraX = playerCenterX - (this.width - this.deadZoneX);
            // Logger.trace(`[CAM Update X] Player right of DZ. TargetCamX: ${targetCameraX.toFixed(2)}`);
        }
        
        // Logger.trace(`[CAM Update X] Before Damping - this.x: ${this.x.toFixed(2)}, targetCameraX: ${targetCameraX.toFixed(2)}`);
        this.x += (targetCameraX - this.x) * this.damping;
        // Logger.trace(`[CAM Update X] After Damping - this.x: ${this.x.toFixed(2)}`);

        // --- Y-axis: Simple Centering with Damping (can add dead zone later if needed) ---
        let idealY = this.target.y + (this.target.height / 2) - (this.height / 2);
        // Logger.trace(`[CAM Update Y] IdealY: ${idealY.toFixed(2)}, this.y before: ${this.y.toFixed(2)}`);
        this.y += (idealY - this.y) * this.damping;
        // Logger.trace(`[CAM Update Y] this.y after: ${this.y.toFixed(2)}`);

        // Clamp camera to world boundaries
        if (this.worldWidth > 0) {
            if (this.width >= this.worldWidth) {
                this.x = (this.worldWidth - this.width) / 2;
            } else {
                this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
            }
        } else {
            this.x = 0;
        }

        if (this.worldHeight > 0) {
            if (this.height >= this.worldHeight) {
                this.y = (this.worldHeight - this.height) / 2;
            } else {
                this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height));
            }
        } else {
            this.y = 0;
        }
        // Logger.trace(`[Camera UPDATE method] Camera position after clamping: x: ${this.x.toFixed(2)}, y: ${this.y.toFixed(2)}`);
    }

    // apply() and end() are for a specific camera style where individual draw calls don't offset.
    // If your main loop does ctx.translate(-camera.x, -camera.y), these might not be needed.
    // apply(ctx) {
    //     ctx.save();
    //     ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
    // }

    // end(ctx) {
    //     ctx.restore();
    // }

    drawDeadZoneDebug(ctx, globalScale, globalOffsetX, globalOffsetY) {
        if (!ctx) {
            Logger.warn("[Camera.drawDeadZoneDebug] No canvas context provided.");
            return;
        }

        // this.width and this.height are the camera's viewport dimensions (native game resolution).
        // this.deadZoneX and this.deadZoneY are the margins IN NATIVE/CAMERA COORDINATES (relative to the viewport).

        const deadZoneNativeX = this.deadZoneX; // This is the margin from the left of the viewport
        const deadZoneNativeY = this.deadZoneY; // This is the margin from the top of the viewport
        
        // The actual dead zone rectangle in NATIVE coordinates:
        const deadZoneRectNativeX = deadZoneNativeX;
        const deadZoneRectNativeY = deadZoneNativeY;
        const deadZoneRectNativeWidth = this.width - (2 * this.deadZoneX);
        const deadZoneRectNativeHeight = this.height - (2 * this.deadZoneY);

        // Convert NATIVE dead zone rectangle coordinates to actual SCREEN coordinates for drawing
        const deadZoneScreenX = globalOffsetX + (deadZoneRectNativeX * globalScale);
        const deadZoneScreenY = globalOffsetY + (deadZoneRectNativeY * globalScale);
        const deadZoneScreenWidth = deadZoneRectNativeWidth * globalScale;
        const deadZoneScreenHeight = deadZoneRectNativeHeight * globalScale;
        console.log(`[Camera.drawDeadZoneDebug] deadZoneScreenX: ${deadZoneScreenX.toFixed(2)}, deadZoneScreenY: ${deadZoneScreenY.toFixed(2)}`);

        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)'; // Cyan color
        ctx.lineWidth = 2;
        ctx.strokeRect(deadZoneScreenX, deadZoneScreenY, deadZoneScreenWidth, deadZoneScreenHeight);

        ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.font = '12px Arial';
        ctx.fillText('Camera Dead Zone', deadZoneScreenX + 5, deadZoneScreenY + 15);
        // Optional: display deadzone margin values
        // ctx.fillText(`dX: ${this.deadZoneX.toFixed(1)}, dY: ${this.deadZoneY.toFixed(1)}`, deadZoneScreenX + 5, deadZoneScreenY + 30);
    }
}
