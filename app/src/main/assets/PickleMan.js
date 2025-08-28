import { initInput, isActionActive } from './input.js';
import { Player } from './Player.js';
import * as globals from './globals.js';
// In main.js or wherever your Pickle update logic resides
// import { isActionActive } from './input.js'; // Ensure it's imported in this file too
class PicklePlayer extends Player {
    constructor(x, y, animationName, spriteScale) {
        super(x, y, animationName, spriteScale); // Assumes Player constructor uses globals.ANIMATIONS if needed
        this.entityType = "player_pickle";
    }
}
export let pPickle1 = null;
export function createPicklePlayerInstance(x, y, animationName, spriteScale) {
    // Assuming PicklePlayer class is defined in this file or imported
    pPickle1 = new PicklePlayer(x, y, animationName, spriteScale);

    console.log("[PickleMan.js]  pPickle1 instance created and assigned:", pPickle1);

    return pPickle1; // Optionally return it
}

export function updatePickleMovement(pickleEntity, deltaTime) {
    if (!pickleEntity) return;

    let dX = 0; // Change in X
    let dY = 0; // Change in Y

    // Use the actions defined in input.js
    if (isActionActive('moveUp')) {
        dY -= 1; // Move up (negative Y in typical canvas coordinates)
    }
    if (isActionActive('moveDown')) {
        dY += 1; // Move down
    }
    if (isActionActive('moveLeft')) {
        dX -= 1; // Move left
    }
    if (isActionActive('moveRight')) {
        dX += 1; // Move right
    }

    // Normalize diagonal movement (optional, but good for consistent speed)
    if (dX !== 0 && dY !== 0) {
        const length = Math.sqrt(dX * dX + dY * dY);
        dX = (dX / length);
        dY = (dY / length);
    }

    // Apply movement
    pickleEntity.x += dX * pickleEntity.speed * deltaTime;
    pickleEntity.y += dY * pickleEntity.speed * deltaTime;

    // Optional: Keep Pickle within game boundaries
    const minX = 0;
    const maxX = globals.nativeGameWidth - pickleEntity.width;
    const minY = 0;
    const maxY = globals.nativeGameHeight - pickleEntity.height;

    if (pickleEntity.x < minX) pickleEntity.x = minX;
    if (pickleEntity.x > maxX) pickleEntity.x = maxX;
    if (pickleEntity.y < minY) pickleEntity.y = minY;
    if (pickleEntity.y > maxY) pickleEntity.y = maxY;
}

// Remember to call this in your game loop's update phase:
// In updateGameLogic(deltaTime):
//   const pickle = activeGameElements.find(el => el.isPickle === true);
//   if (pickle) {
//     updatePickleMovement(pickle, deltaTime);
//   }
