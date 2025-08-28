import { GameObject } from './GameObject.js';
import * as globals from './globals.js';
import { ANIMATIONS } from './globals.js';
import { getSpriteSheetImage } from './assetManager.js';
import {ctx} from './main.js';
export class Sprite extends GameObject {
    constructor(x, y, animationName, spriteScale = 1.0) {
        const initialAnimDef = ANIMATIONS[animationName];
        const initialFrame = initialAnimDef.frames[0];

        super(x, y, initialFrame.sWidth * spriteScale, initialFrame.sHeight * spriteScale);
        this.animationName = animationName;
        const animDef = ANIMATIONS[animationName];

        // Width/height from sprite frame, scaled by spriteScale for native size

        this.type = "sprite";
        // Instead of a global 'spriteSheetImage', get it from the assetManager
        const keyForSpriteSheet = animDef.spriteSheetKey; // This will be "master_spritesheet"
        // This function should look up the already loaded image using the key
        this.image = getSpriteSheetImage(keyForSpriteSheet);

        this.currentFrameIndex = 0;
        this.totalFramesInAnimation = initialAnimDef.frames.length;
        this.animationLoop = initialAnimDef.loop !== undefined ? initialAnimDef.loop : true;
        this.currentFrameDuration = initialFrame.duration || initialAnimDef.defaultAnimationSpeed || 100;
        this.lastFrameTime = 0;
        this.spriteScale = spriteScale;
        this.facingDirection = 1; // 1 for right, -1 for left

        // Inside the CONSTRUCTOR of your Sprite class (or Player, if applicable)
        // constructor(x, y, animationName, spriteScale) {
        console.log(`[SPRITE CONSTRUCTOR] Called for: animationName = "${animationName}"`);

        // 1. Check ANIMATIONS global immediately
        console.log("[SPRITE CONSTRUCTOR] Global ANIMATIONS object:", ANIMATIONS); // Log the whole thing
        if (!ANIMATIONS) {
            console.error("[SPRITE CONSTRUCTOR] CRITICAL: Global ANIMATIONS object is undefined/null!");
            this.image = null;
            return; // Or handle error
        }

        console.log("IMAGE_IS_"+this.image);
        console.log("IMAGE_IS_"+this.image);
        console.log(`[SPRITE CONSTRUCTOR] animDef for "${animationName}":`, animDef);

        if (!animDef) {

            console.error(`[SPRITE CONSTRUCTOR] No animDef found for "${animationName}". Setting image to null.`);
            this.image = null; // This is a likely path to your problem
            // ... any other setup before returning or erroring ...
            this.currentFrameIndex = 0; // Initialize to prevent further errors if draw is called
            this.totalFramesInAnimation = 0;
            return; // Important to stop further processing if animDef is missing
        }
        console.log("IMAGE_IS_"+this.image);
        // Assuming animDef should have a spriteSheetKey that getSpriteSheetImage uses
        const sheetKey = animDef.spriteSheetKey; // Or whatever property holds the key
        console.log(`[SPRITE CONSTRUCTOR] Attempting to get image with sheetKey: "${sheetKey}" from animDef.`);

        if (!sheetKey) {
            console.error(`[SPRITE CONSTRUCTOR] animDef for "${animationName}" is missing a spriteSheetKey. Setting image to null.`);

            this.image = null;
            // ... other setup before returning ...
            //return;
        }
        console.log("IMAGE_IS_"+this.image);
        // 2. Call your image fetching function and log its direct result
        // Make sure getSpriteSheetImage is accessible here (global or imported)
        try {
            this.image = getSpriteSheetImage(sheetKey); // Or assetManager.getImage(sheetKey)
            console.log(`[SPRITE CONSTRUCTOR] Result from getSpriteSheetImage("${sheetKey}"):`, this.image);
        } catch (e) {
            console.error(`[SPRITE CONSTRUCTOR] Error calling getSpriteSheetImage("${sheetKey}"):`, e);
            this.image = null;
        }
        console.log("IMAGE_IS_"+this.image);

        if (!this.image) {
            console.warn(`[SPRITE CONSTRUCTOR] this.image is STILL NULL/UNDEFINED after attempting to fetch for key "${sheetKey}" from animation "${animationName}".`);
        } else if (!(this.image instanceof HTMLImageElement) || !this.image.complete) {
            console.warn(`[SPRITE CONSTRUCTOR] Fetched image for "${sheetKey}" is not a complete HTMLImageElement:`, this.image);
            // It might be better to set this.image to null here if it's not valid,
            // rather than letting drawImage fail later.
            // this.image = null;
        }
        console.log("IMAGE_IS_"+this.image);//Aok//TODO NOT NULLL////////////////////////////////////

        // ... rest of your Sprite constructor (setting up frames, etc.)
        // These might also fail if animDef was missing earlier.
        if (this.image && animDef && animDef.frames) { // Only if image and animDef are good
            const initialFrame = animDef.frames[0];
            if (initialFrame) {
                this.width = initialFrame.sWidth * spriteScale; // Native size from sprite frame
                this.height = initialFrame.sHeight * spriteScale;
            } else {
                console.error(`[SPRITE CONSTRUCTOR] animDef for "${animationName}" has no frame 0.`);
                // Set default width/height or handle error
            }
            // ...
        } else if (!this.image) {
            console.log("[SPRITE CONSTRUCTOR] Skipping frame setup because this.image is null.");
        } else {
            console.log(`[SPRITE CONSTRUCTOR] Skipping frame setup for "${animationName}" due to missing animDef.frames or initialFrame.`);
        }




    }


    update(deltaTime, currentTime, activeGameElements) {
        super.update(deltaTime, currentTime);
        const animDef = ANIMATIONS[this.animationName];
        console.log("IMAGE_IS_"+this.image);//null//TODO NULL//////////////////////////////////////
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

        if(globals.debugDraw)console.log(
            `Sprite Update Pre-FrameFetch DEBUG: Entity: ${this.entityType}, Anim: ${this.animationName}, ` +
            `FrameIndex: ${this.currentFrameIndex}, TotalFrames: ${this.totalFramesInAnimation}, ` +
            `Actual Frames in animDef: ${animDef.frames.length}`
        );
        // *************************************

        const currentFrameDef = animDef.frames[this.currentFrameIndex];
        // Your existing log:
        if(globals.debugDraw)console.log(`ANIOMATION: ${this.animationName} also the frame def: ${currentFrameDef ? 'DEFINED' : 'UNDEFINED'}`);


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
            console.log("IMAGE_IS_"+this.image);
            ctx.drawImage(this.image, frame.sx, frame.sy, frame.sWidth, frame.sHeight, 0, 0, drawWidth, drawHeight);
        } else {
            console.log("IMAGE_IS_"+this.image);
            ctx.drawImage(this.image, frame.sx, frame.sy, frame.sWidth, frame.sHeight, drawX, drawY, drawWidth, drawHeight);
        }


        // DEBUG BOUNDARY CHECK:
        // Make sure you are using the same width calculation as in your collision logic.

        if(globals.debugDraw) {


            const DrawWidth = frame.sWidth * this.spriteScale;
            const DrawHeight = frame.sHeight * this.spriteScale;

            // Save current global alpha and fill style
            let originalAlpha = ctx.globalAlpha;
            let originalFill = ctx.fillStyle;

            ctx.globalAlpha = 0.3; // Make it semi-transparent
            ctx.fillStyle = 'cyan';
            // Note: this.x and this.y are already in the globally transformed space's native coordinates
            // No extra translation needed here IF this.x, this.y is the top-left for drawing.
            // If your this.x/this.y is a center point, adjust drawing accordingly.
            ctx.fillRect(this.x, this.y, DrawWidth, DrawHeight);

            // Restore alpha and fill style
            ctx.globalAlpha = originalAlpha;
            ctx.fillStyle = originalFill;
        }


        ctx.restore();
    }
}