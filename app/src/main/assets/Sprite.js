import { GameObject } from './GameObject.js';
import * as globals from './globals.js';
import { ANIMATIONS } from './globals.js';
import * as assetManager from './assetManager.js';
import {ctx} from './main.js';
export class Sprite extends GameObject {
    constructor(x, y, animationName, spriteScale = 1.0,speed) {
        // 1. Get animDef and initialFrame FIRST
        const animDef = globals.ANIMATIONS[animationName];

        // 2. Critical check for animDef and its frames BEFORE trying to use them
        if (!animDef || !animDef.frames || animDef.frames.length === 0) {
            console.error(`[FATAL SPRITE CONSTRUCTOR] Invalid animDef or no frames for "${animationName}". Cannot determine initial dimensions.`);
            // Call super with default/safe values (0 width/height)
            super(x, y, 0, 0);
            this.animationName = animationName; // Still store this
            this.image = null; // Image will definitely fail or be wrong
            this.isActive = false; // Mark as inactive
            // Initialize other properties to prevent cascading errors
            this.currentFrameIndex = 0;
            this.totalFramesInAnimation = 0;
            this.spriteSheetKey = globals.MASTER_SPRITE_SHEET_KEY; // Default
            this.spriteScale = spriteScale;
            this.facingDirection = 1;
            this.speed=speed;
            // Consider throwing an error here or having a more robust way to signal failed construction
            return; // Stop further construction if animDef is unusable
        }

        const initialFrame = animDef.frames[0]; // Now it's safe to get initialFrame

        // 3. Now call super() using initialFrame properties
        super(x, y, initialFrame.sWidth * spriteScale, initialFrame.sHeight * spriteScale,speed);

        // 4. Proceed with the rest of the constructor
        this.animationName = animationName;
        this.type = "sprite"; // From your previous code

        this.spriteSheetKey = animDef.spriteSheetKey || globals.MASTER_SPRITE_SHEET_KEY;
        this.image = assetManager.getSpriteSheetImage(this.spriteSheetKey);

        // Logging for pickle_player_idle
        if (this.animationName === "pickle_player_idle") {
            console.log(`%cPICKLE_PLAYER_CONSTRUCTOR (Sprite.js): animName=${this.animationName}, sheetKey=${this.spriteSheetKey}, assetManager returned:`, 'background-color: yellow; color: black; font-weight: bold;', this.image);
            if (!this.image) {
                // This log will be crucial again after fixing the ReferenceError
                console.error('%cPICKLE_PLAYER_CONSTRUCTOR (Sprite.js): this.image is NULL after assetManager call!', 'background-color: red; color: white; font-weight: bold;');
            }
        }

        // Your extensive logging from before (can be trimmed once stable)
        // console.log(`[SPRITE CONSTRUCTOR - ${this.animationName}] Determined spriteSheetKey: "${this.spriteSheetKey}". Image fetched:`, this.image);
        // if (!this.image) console.error(...);
        // console.log(`[SPRITE CONSTRUCTOR] Called for: animationName = "${animationName}"`);
        // ... etc. ...

        if (!this.image) {
            console.warn(`[SPRITE CONSTRUCTOR - ${this.animationName}] this.image is STILL NULL/UNDEFINED after attempting to fetch for key "${this.spriteSheetKey}".`);
            this.isActive = false; // Good idea to deactivate if image is missing
        }

        this.currentFrameIndex = 0;
        this.totalFramesInAnimation = animDef.frames.length; // Safe now because of the check above
        this.animationLoop = animDef.loop !== undefined ? animDef.loop : true;
        this.currentFrameDuration = initialFrame.duration || animDef.defaultAnimationSpeed || 100;
        this.lastFrameTime = 0;
        this.spriteScale = spriteScale;
        this.facingDirection = 1;

        // Ensure isActive is true by default if no errors occurred that set it to false
        if (this.isActive === undefined) { // Check if isActive wasn't already set to false by an error condition
            this.isActive = true;
        }
    }


    update(deltaTime, currentTime, activeGameElements) {
        super.update(deltaTime, currentTime);
        const animDef = ANIMATIONS[this.animationName];
        //console.log("IMAGE_IS_117?"+this.image);//null//TODO NULL//////////////////////////////////////
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

 /*       if(globals.debugDraw)console.log(
            `Sprite Update Pre-FrameFetch DEBUG: Entity: ${this.entityType}, Anim: ${this.animationName}, ` +
            `FrameIndex: ${this.currentFrameIndex}, TotalFrames: ${this.totalFramesInAnimation}, ` +
            `Actual Frames in animDef: ${animDef.frames.length}`
        );*/
        // *************************************

        const currentFrameDef = animDef.frames[this.currentFrameIndex];
        // Your existing log:
        //if(globals.debugDraw)console.log(`ANIOMATION: ${this.animationName} also the frame def: ${currentFrameDef ? 'DEFINED' : 'UNDEFINED'}`);


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
            //console.log("IMAGE_IS_"+this.image);
            ctx.drawImage(this.image, frame.sx, frame.sy, frame.sWidth, frame.sHeight, 0, 0, drawWidth, drawHeight);
        } else {
            //console.log("IMAGE_IS_thisisTheOffendingCall"+this.image);
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