import { initInput, isActionActive } from './input.js';
import { Player } from './Player.js';
import * as globals from './globals.js';
// In main.js or wherever your Pickle update logic resides
// import { isActionActive } from './input.js'; // Ensure it's imported in this file too
class PicklePlayer extends Player {
    constructor(x, y, animationName, spriteScale,health,speed) {
        super(x, y, animationName, spriteScale,health,speed); // Assumes Player constructor uses globals.ANIMATIONS if needed
        this.entityType = "player_pickle";
    }
}
export let pPickle1 = null;
export function createPicklePlayerInstance(x, y, animationName, spriteScale,health,speed) {
    // Assuming PicklePlayer class is defined in this file or imported
    pPickle1 = new PicklePlayer(x, y, animationName, spriteScale,health,speed);

    console.log("[PickleMan.js]  pPickle1 instance created and assigned:", pPickle1);

    return pPickle1; // Optionally return it
}
// Remember to call this in your game loop's update phase:
// In updateGameLogic(deltaTime):
//   const pickle = activeGameElements.find(el => el.isPickle === true);
//   if (pickle) {
//     updatePickleMovement(pickle, deltaTime);
//   }
