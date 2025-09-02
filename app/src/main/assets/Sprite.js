// Sprite.js
// import { ANIMATIONS } from './globals.js'; // Your animation definitions (now with sprite names)
// import { drawSprite, getSpriteData } from './assetManager.js'; // Or your graphics module

// Assuming assetManager.js exports getSpriteData() and masterSheetImage
import * as assetManager from './assetManager.js';
import { ANIMATIONS } from './globals.js'; // Assuming ANIMATIONS is in globals.js
import { GameObject } from './GameObject.js'; // Assuming GameObject is the base

export class Sprite extends GameObject {
    constructor(x, y, initialAnimationName, spriteScale = 1.0) {
        // We need to determine width/height from the first frame of the initial animation
        // This requires spriteData to be loaded. This is a bit tricky in a constructor.
        // Option A: Pass width/height if known, or have a default.
        // Option B: Initialize width/height later, or make them dynamic.
        // For now, let's assume we might set a default or it gets updated quickly.
        super(x, y, 0, 0); // Start with 0,0 width/height, will be updated

        this.entityType = "sprite"; // Or remove if GameObject handles it
        this.spriteScale = spriteScale;
        this.facingDirection = 1; // 1 for right, -1 for left

        this.currentAnimationName = initialAnimationName;
        this.currentFrameIndex = 0;
        this.animationTimer = 0;
        this.speedModifier = 1; // Can be updated by animation frame data
        this.currentSpriteName = ""; // Will be set by updateCurrentSpriteAndDimensions

        this.isAnimationLoaded = false; // Flag to check if initial animation data is processed

        // Attempt to set initial sprite name and dimensions
        // This relies on ANIMATIONS and spriteData being available globally
        if (ANIMATIONS && assetManager.getSpriteData()) {
            this.updateCurrentSpriteAndDimensions();
            this.isAnimationLoaded = true;
        } else {
            console.warn(`[Sprite Constructor] ANIMATIONS or spriteData not ready for "${initialAnimationName}". Dimensions might be incorrect initially.`);
            // You might want a fallback mechanism or to call updateCurrentSpriteAndDimensions later
            // when assets are guaranteed to be loaded.
        }
    }

    // Call this method if assets weren't ready during construction, or to refresh.
    ensureAnimationLoaded() {
        if (!this.isAnimationLoaded && ANIMATIONS && assetManager.getSpriteData()) {
            this.updateCurrentSpriteAndDimensions();
            this.isAnimationLoaded = true;
            console.log(`[Sprite ensureAnimationLoaded] Successfully loaded animation for: ${this.currentAnimationName}`);
        }
    }


    updateCurrentSpriteAndDimensions() {
        const animData = ANIMATIONS[this.currentAnimationName];
        const spriteSheetData = assetManager.getSpriteData(); // Get current sprite data

        if (!animData || !animData.frames || animData.frames.length === 0) {
            console.warn(`[Sprite] Animation data not found or empty for: "${this.currentAnimationName}"`);
            this.currentSpriteName = "default_fallback_sprite"; // A known fallback sprite name
            this.width = 32 * this.spriteScale; // Fallback width
            this.height = 32 * this.spriteScale; // Fallback height
            this.speedModifier = 1;
            return;
        }

        if (!spriteSheetData || !spriteSheetData.frames) {
            console.warn(`[Sprite] Sprite sheet data not available for "${this.currentAnimationName}". Cannot determine dimensions.`);
            // Keep current sprite name if already set, but dimensions might be wrong.
            // If this.currentSpriteName isn't set, use a fallback.
            if (!this.currentSpriteName) this.currentSpriteName = "default_fallback_sprite";
            this.width = 32 * this.spriteScale;
            this.height = 32 * this.spriteScale;
            return;
        }

        const frameInfoFromAnim = animData.frames[this.currentFrameIndex];
        let frameSpriteName;

        if (typeof frameInfoFromAnim === 'string') {
            frameSpriteName = frameInfoFromAnim;
            this.speedModifier = animData.baseSpeedModifier || 1;
        } else if (typeof frameInfoFromAnim === 'object' && frameInfoFromAnim.name) {
            frameSpriteName = frameInfoFromAnim.name;
            this.speedModifier = frameInfoFromAnim.speedModifier !== undefined ? frameInfoFromAnim.speedModifier : (animData.baseSpeedModifier || 1);
        } else {
            console.warn(`[Sprite] Invalid frame info for "${this.currentAnimationName}" at index ${this.currentFrameIndex}:`, frameInfoFromAnim);
            this.currentSpriteName = "default_fallback_sprite";
            this.width = 32 * this.spriteScale;
            this.height = 32 * this.spriteScale;
            return;
        }

        this.currentSpriteName = frameSpriteName;

        // Now, get dimensions from the spriteSheetData using this.currentSpriteName
        const spriteFrameData = spriteSheetData.frames[this.currentSpriteName];
        if (spriteFrameData) {
            // Use spriteSourceSize for logical dimensions if available (represents original untrimmed size)
            // Otherwise, use the frame's actual w/h on the sheet (trimmed size)
            const frameDetails = spriteFrameData.frame; // The actual {x,y,w,h} on the sheet
            const sourceSize = spriteFrameData.sourceSize; // Original untrimmed {w,h}

            if (sourceSize) {
                this.width = sourceSize.w * this.spriteScale;
                this.height = sourceSize.h * this.spriteScale;
            } else {
                this.width = frameDetails.w * this.spriteScale;
                this.height = frameDetails.h * this.spriteScale;
            }
            // console.log(`[Sprite UpdateDims] ${this.currentAnimationName}:${this.currentSpriteName} - Width: ${this.width}, Height: ${this.height}`);

        } else {
            console.warn(`[Sprite] Sprite data for frame name "${this.currentSpriteName}" not found in sprite sheet data. Dimensions not updated.`);
            // Keep previous width/height or set a fallback if they are 0
            if (this.width === 0) this.width = 32 * this.spriteScale;
            if (this.height === 0) this.height = 32 * this.spriteScale;
        }
        this.isAnimationLoaded = true; // Mark as processed
    }

    updateAnimation(deltaTime) {
        if (!this.isAnimationLoaded) {
            this.ensureAnimationLoaded(); // Try to load if not done yet
            if (!this.isAnimationLoaded) return; // Still not ready, skip animation update
        }

        const animData = ANIMATIONS[this.currentAnimationName];
        if (!animData || !animData.frames || animData.frames.length === 0) return;

        let frameDuration;
        const currentFrameDetail = animData.frames[this.currentFrameIndex];

        if (typeof currentFrameDetail === 'object' && currentFrameDetail.duration) {
            frameDuration = currentFrameDetail.duration / 1000; // ms to seconds
        } else if (animData.defaultAnimationSpeedFPS && animData.defaultAnimationSpeedFPS > 0) {
            frameDuration = 1 / animData.defaultAnimationSpeedFPS;
        } else {
            frameDuration = 0.1; // Default fallback (e.g., 10 FPS)
        }

        this.animationTimer += deltaTime;

        if (this.animationTimer >= frameDuration) {
            this.animationTimer -= frameDuration;

            if (this.currentFrameIndex + 1 >= animData.frames.length) {
                if (animData.loop) {
                    this.currentFrameIndex = 0;
                } else {
                    this.currentFrameIndex = animData.frames.length - 1; // Stay on last frame
                    // Optionally, set a flag like this.animationFinished = true;
                }
            } else {
                this.currentFrameIndex++;
            }
            this.updateCurrentSpriteAndDimensions(); // Update sprite name and dimensions for new frame
        }
    }

    setAnimation(animationName) {
        if (this.currentAnimationName !== animationName && ANIMATIONS[animationName]) {
            this.currentAnimationName = animationName;
            this.currentFrameIndex = 0;
            this.animationTimer = 0;
            if (this.isAnimationLoaded) { // Only update if initial setup was done
                this.updateCurrentSpriteAndDimensions();
            } else {
                this.ensureAnimationLoaded(); // Attempt to load if it wasn't
            }
        }
    }

    update(deltaTime, currentTime, activeGameElements) {
        super.update(deltaTime, currentTime, activeGameElements); // Call GameObject's update
        this.updateAnimation(deltaTime);
    }

    draw(ctx) {
        super.draw(ctx); // Call GameObject's draw (if it does anything like debug boxes)

        if (!this.isAnimationLoaded && this.isActive) {
            // console.warn(`[Sprite Draw] Attempting to draw "${this.currentAnimationName}" but animation/sprite data might not be fully loaded. Trying to ensure...`);
            this.ensureAnimationLoaded();
        }

        if (!this.currentSpriteName) {
            // console.warn(`[Sprite Draw] Entity has no currentSpriteName to draw (X:${this.x}, Y:${this.y}, Anim:${this.currentAnimationName}).`);
            // Optionally draw a fallback placeholder if in debug mode
            if (window.debugMode) {
                ctx.fillStyle = "magenta";
                ctx.fillRect(this.x, this.y, 32, 32);
                ctx.fillStyle = "white";
                ctx.fillText("NO_SPRITE", this.x, this.y + 10);
            }
            return;
        }

        const drawOptions = {
            flipX: this.facingDirection === -1,
            spriteScale: this.spriteScale, // Pass scale if drawSprite needs it (or if dWidth/dHeight not used)
            // dWidth: this.width, // Pass if you want to draw at the scaled logical width/height
            // dHeight: this.height,
            debugDraw: window.debugMode === true
        };

        // The drawSprite function from assetManager will handle sx,sy,sw,sh lookup from JSON
        assetManager.drawSprite(ctx, this.currentSpriteName, this.x, this.y, drawOptions);
    }
}
