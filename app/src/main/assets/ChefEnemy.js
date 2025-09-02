import { Character } from './Character.js';
import * as globals from './globals.js';
import * as assetManager from './assetManager.js';
export class EnemyPatrol extends Character {
    constructor(x, y, animationName, spriteScale, health, speed, patrolMinX, patrolMaxX) {
        // Assumes Character/Sprite constructor correctly uses globals.ANIMATIONS
        super(x, y, animationName, spriteScale, health, speed);
        this.entityType = "enemy_chef_ketchup_patrol";

        this.direction = { x: 0, y: 0 };

        this.direction.x = 1;
        this.patrolMinX = patrolMinX;
        this.patrolMaxX = patrolMaxX;
        if (globals.debugDraw) console.log(`EnemyPatrol CONSTRUCTOR: Spawned with patrolMinX=${this.patrolMinX}, patrolMaxX=${this.patrolMaxX}`);
    }

    update(deltaTime, currentTime, activeGameElementsRef) { // activeGameElementsRef is activeGameElements
        super.update(deltaTime, currentTime, activeGameElementsRef);

        // Ensure this.currentAnimationName is valid and exists in globals.ANIMATIONS
        if (!this.currentAnimationName || !globals.ANIMATIONS[this.currentAnimationName]) {
            console.error(`[EnemyPatrol Update] Invalid or missing animation: "${this.currentAnimationName}". Entity: ${this.entityType}`);
            return; // Stop further processing if animation data is missing
        }

        // VVVVVV  THE CHANGE IS HERE VVVVVV
        const animationData = globals.ANIMATIONS[this.currentAnimationName];
        // ^^^^^^  Use this.currentAnimationName ^^^^^^


        // This part now uses animationData which is globals.ANIMATIONS[this.currentAnimationName]
        const currentFrameInfo = animationData.frames[this.currentFrameIndex];
        //console.log(`spritSheetData = ${JSON.stringify(assetManager.getSpriteData())}`);
        let spriteNameForDimensions;

        if (typeof currentFrameInfo === 'string') {
            spriteNameForDimensions = currentFrameInfo;
        } else if (typeof currentFrameInfo === 'object' && currentFrameInfo.name) {
            spriteNameForDimensions = currentFrameInfo.name;
        } else {
            console.error(`[EnemyPatrol Update] Invalid frame info in animation "${this.currentAnimationName}" at index ${this.currentFrameIndex}.`);
            return;
        }

        // Now get the actual sprite definition from assetManager's spriteData
        const spriteSheetData = assetManager.getSpriteData(); // Assuming you have access to assetManager
        if (!spriteSheetData || !spriteSheetData.frames[spriteNameForDimensions]) {
            console.error(`[EnemyPatrol Update] Sprite definition for "${spriteNameForDimensions}" not found in assetManager.`);
            return;
        }
        const currentFrameDef = spriteSheetData.frames[spriteNameForDimensions]; // This is the definition from JSON


        // The rest of your ChefEnemy.js:20 was:
        // const currentFrameDef = globals.ANIMATIONS[this.animationName].frames[this.currentFrameIndex];
        //
        // Which means you were trying to get sWidth from the ANIMATIONS structure in globals.js,
        // but sWidth should now come from the JSON data via assetManager.getSpriteData().frames[SPRITE_NAME].frame.w

        // If you need sWidth, it should be:
        // const currentSpriteOnSheetDetails = currentFrameDef.frame; // {x, y, w, h} on the sheet
        // const sWidth = currentSpriteOnSheetDetails.w;
        // However, this.width (from Sprite class) should already have the scaled width.

        if (!currentFrameDef || !currentFrameDef.frame || typeof currentFrameDef.frame.w === 'undefined') { // Check the actual structure from your JSON
            console.error(`[EnemyPatrol Update] Invalid currentFrameDef or frame.w for sprite ${spriteNameForDimensions}. Entity: ${this.entityType}`);
            return;
        }

        // this.width is the logical width of the sprite, already scaled.
        // If you need the *native* width from the sheet for some calculation:
        const nativeSpriteWidthOnSheet = currentFrameDef.frame.w;
        const currentSpriteEffectiveWidth = this.width; // This is already scaled (sourceSize.w * spriteScale)

        // Your boundary check logic:
        if (this.direction.x > 0 && (this.x + currentSpriteEffectiveWidth) >= this.patrolMaxX) {
            this.x = this.patrolMaxX - currentSpriteEffectiveWidth;
            this.direction.x = -1;
            this.facingDirection = -1; // Make sure Sprite class uses this for flipping
        } else if (this.direction.x < 0 && this.x <= this.patrolMinX) {
            this.x = this.patrolMinX;
            this.direction.x = 1;
            this.facingDirection = 1; // Make sure Sprite class uses this for flipping
        }
    }
}
export let eChef1 = null;
export function createPatrolingChef(x,y,animationName,spriteScale,health,speed,patrolMinX,patrolMaxX){
    eChef1 = new EnemyPatrol(
        x,
        y, // Assuming nativeGameHeight from globals
        animationName,
        spriteScale,
        health, // health
        speed, // speed
        patrolMinX,  // patrolMinX
        patrolMaxX // patrolMaxX, assuming nativeGameWidth from globals
    );
    console.log("[ChefEnemy.js] eChef1 instance created and assigned:", eChef1);
    return eChef1;
}