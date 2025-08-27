import { GameObject } from './GameObject.js';
export class Sprite extends GameObject {
    constructor(x, y, animationName, spriteScale = 1.0) {
        const initialAnimDef = ANIMATIONS[animationName];
        const initialFrame = initialAnimDef.frames[0];
        // Width/height from sprite frame, scaled by spriteScale for native size
        super(x, y, initialFrame.sWidth * spriteScale, initialFrame.sHeight * spriteScale);
        this.type = "sprite";
        this.image = spriteSheetImage; // Assuming spriteSheetImage is global/accessible
        this.animationName = animationName;
        this.currentFrameIndex = 0;
        this.totalFramesInAnimation = initialAnimDef.frames.length;
        this.animationLoop = initialAnimDef.loop !== undefined ? initialAnimDef.loop : true;
        this.currentFrameDuration = initialFrame.duration || initialAnimDef.defaultAnimationSpeed || 100;
        this.lastFrameTime = 0;
        this.spriteScale = spriteScale;
        this.facingDirection = 1; // 1 for right, -1 for left
    }

    update(deltaTime, currentTime, activeGameElements) {
        super.update(deltaTime, currentTime);

        const animDef = ANIMATIONS[this.animationName];

        // **** ADD THIS CRITICAL DEBUGGING ****
        if (!animDef) {

            console.error(`ERROR in Sprite Update: No animDef for animationName: '${this.animationName}' for entity:`, this.entityType);
            this.isActive = false; // Stop this broken sprite
            return;
        }
        if (!animDef.frames) {
            console.error(`ERROR in Sprite Update: animDef for '${this.animationName}' has NO FRAMES array for entity:`, this.entityType);
            this.isActive = false;
            return;
        }

        if(debugDraw)console.log(
            `Sprite Update Pre-FrameFetch DEBUG: Entity: ${this.entityType}, Anim: ${this.animationName}, ` +
            `FrameIndex: ${this.currentFrameIndex}, TotalFrames: ${this.totalFramesInAnimation}, ` +
            `Actual Frames in animDef: ${animDef.frames.length}`
        );
        // *************************************

        const currentFrameDef = animDef.frames[this.currentFrameIndex];
        // Your existing log:
        if(debugDraw)console.log(`ANIOMATION: ${this.animationName} also the frame def: ${currentFrameDef ? 'DEFINED' : 'UNDEFINED'}`);


        if (!currentFrameDef) {
            console.error(
                `ERROR in Sprite Update: currentFrameDef is UNDEFINED. ` +
                `Anim: ${this.animationName}, Index: ${this.currentFrameIndex}, ` +
                `TotalFramesInAnimProp: ${this.totalFramesInAnimation}, FramesInDef: ${animDef.frames.length}. ` +
                `Entity: ${this.entityType}`
            );
            // Decide how to handle: stop animation, set to first frame, or deactivate
            // For now, let's prevent the crash:
            this.isActive = false; // Deactivate entity to prevent further errors this frame
            return; // Exit update for this sprite
        }

        // If we reach here, currentFrameDef IS defined.
        this.width = currentFrameDef.sWidth * this.spriteScale;
        this.height = currentFrameDef.sHeight * this.spriteScale;

        // ... (rest of animation logic: advancing frame, lastFrameTime, etc.) ...
        // THIS LOGIC BELOW IS WHAT MANAGES this.currentFrameIndex AND this.currentFrameDuration
        if (this.lastFrameTime === 0 || this.lastFrameTime === undefined) {
            this.lastFrameTime = currentTime;
        }

        if (currentTime - this.lastFrameTime >= this.currentFrameDuration) {
            this.currentFrameIndex++; // <--- Potential place index goes out of bounds

            // Logic to handle end of animation (looping, stopping, switching)
            if (this.currentFrameIndex >= this.totalFramesInAnimation) { // Or >= animDef.frames.length
                if (this.animationLoop) {
                    this.currentFrameIndex = 0;
                } else {
                    this.currentFrameIndex = this.totalFramesInAnimation - 1; // Stay on last frame
                    // ... onEnd logic if any (e.g., switchToIdle) ...
                }
            }

            // AFTER currentFrameIndex is potentially reset or capped,
            // you need to get the NEW currentFrameDef for duration and dimensions
            // (or you might have already done this if your structure differs)
            const nextFrameData = animDef.frames[this.currentFrameIndex]; // Re-fetch after index change
            if (!nextFrameData) {
                console.error(`ERROR in Sprite Update: nextFrameData is UNDEFINED after index update. Anim: ${this.animationName}, New Index: ${this.currentFrameIndex}`);
                this.isActive = false; return;
            }
            this.currentFrameDuration = nextFrameData.duration || animDef.defaultAnimationSpeed;
            // Potentially update width/height again if it changed due to frame advance
            // this.width = nextFrameData.sWidth * this.spriteScale;
            // this.height = nextFrameData.sHeight * this.spriteScale;

            this.lastFrameTime = currentTime;
        }
    }

    draw(ctx) {
        super.draw(ctx); // Call base draw if it does anything
        const animDef = ANIMATIONS[this.animationName];
        if (!animDef || !animDef.frames[this.currentFrameIndex]) return; // Safety

        const frame = animDef.frames[this.currentFrameIndex];
        const drawX = this.x;
        const drawY = this.y;
        const drawWidth = frame.sWidth * this.spriteScale;
        const drawHeight = frame.sHeight * this.spriteScale;

        ctx.save();
        if (this.facingDirection === -1) {
            // Flip context for left-facing sprite
            ctx.translate(drawX + drawWidth, drawY); // Move origin to where right edge would be
            ctx.scale(-1, 1); // Flip horizontally
            ctx.drawImage(this.image, frame.sx, frame.sy, frame.sWidth, frame.sHeight, 0, 0, drawWidth, drawHeight);
        } else {
            ctx.drawImage(this.image, frame.sx, frame.sy, frame.sWidth, frame.sHeight, drawX, drawY, drawWidth, drawHeight);
        }


        // DEBUG BOUNDARY CHECK:
        // Make sure you are using the same width calculation as in your collision logic.

        if(debugDraw) {


            const debugDrawWidth = frame.sWidth * this.spriteScale;
            const debugDrawHeight = frame.sHeight * this.spriteScale;

            // Save current global alpha and fill style
            let originalAlpha = ctx.globalAlpha;
            let originalFill = ctx.fillStyle;

            ctx.globalAlpha = 0.3; // Make it semi-transparent
            ctx.fillStyle = 'cyan';
            // Note: this.x and this.y are already in the globally transformed space's native coordinates
            // No extra translation needed here IF this.x, this.y is the top-left for drawing.
            // If your this.x/this.y is a center point, adjust drawing accordingly.
            //ctx.fillRect(this.x, this.y, debugDrawWidth, debugDrawHeight);

            // Restore alpha and fill style
            ctx.globalAlpha = originalAlpha;
            ctx.fillStyle = originalFill;
        }


        ctx.restore();
    }
}