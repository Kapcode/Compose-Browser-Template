import { Character } from './Character.js';
import * as globals from './globals.js';
export class EnemyPatrol extends Character {
    constructor(x, y, animationName, spriteScale, health, speed, patrolMinX, patrolMaxX) {
        // Assumes Character/Sprite constructor correctly uses globals.ANIMATIONS
        super(x, y, animationName, spriteScale, health, speed);
        this.entityType = "enemy_chef_ketchup_patrol";
        this.direction.x = 1;
        this.patrolMinX = patrolMinX;
        this.patrolMaxX = patrolMaxX;
        if (globals.debugDraw) console.log(`EnemyPatrol CONSTRUCTOR: Spawned with patrolMinX=${this.patrolMinX}, patrolMaxX=${this.patrolMaxX}`);
    }

    update(deltaTime, currentTime, activeGameElementsRef) { // activeGameElementsRef is activeGameElements
        super.update(deltaTime, currentTime, activeGameElementsRef);

        const currentFrameDef = globals.ANIMATIONS[this.animationName].frames[this.currentFrameIndex];

        if (!currentFrameDef || typeof currentFrameDef.sWidth === 'undefined') {
            console.error(`EnemyPatrol Update: Invalid currentFrameDef or sWidth for ${this.animationName}, index ${this.currentFrameIndex}. Entity: ${this.entityType}`);
            return;
        }

        const currentSpriteNativeWidth = currentFrameDef.sWidth * this.spriteScale;
        if (globals.debugDraw) console.log(
            `Boundary Check DEBUG: Chef X: ${this.x.toFixed(2)}, ` +
            `SpriteNativeWidth: ${currentSpriteNativeWidth.toFixed(2)}, ` +
            `CalculatedRightEdge: ${(this.x + currentSpriteNativeWidth).toFixed(2)}, ` +
            `patrolMinX: ${this.patrolMinX}, patrolMaxX: ${this.patrolMaxX}, ` +
            `sWidth: ${currentFrameDef.sWidth}, spriteScale: ${this.spriteScale}`
        );

        if (this.direction.x > 0 && (this.x + currentSpriteNativeWidth) >= this.patrolMaxX) {
            this.x = this.patrolMaxX - currentSpriteNativeWidth;
            this.direction.x = -1;
            this.facingDirection = -1;
        } else if (this.direction.x < 0 && this.x <= this.patrolMinX) {
            this.x = this.patrolMinX;
            this.direction.x = 1;
            this.facingDirection = 1;
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