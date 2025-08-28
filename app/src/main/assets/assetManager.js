// ./assetManager.js
import * as globals from './globals.js'; // To access SPRITE_SHEET_SRC and potentially set flags
// These will be managed within this module
let _spriteSheetImage = null;//master-sprite.png';
let _spriteSheetLoaded = false;

// Getter functions if other modules need to access these (read-only)
export function getSpriteSheetImage() {
    return _spriteSheetImage;
}

export function isSpriteSheetLoaded() {
    console.log(`Sprite sheet loaded state: ${_spriteSheetLoaded}`);
    return _spriteSheetLoaded;
}

// The main loading function
export function loadSpriteSheet(callback) {
    if (_spriteSheetLoaded) {
        console.log("Sprite sheet already loaded.");
        if (callback) callback();
        return;
    }
    if (!_spriteSheetImage) { // Create image object only once
        _spriteSheetImage = new Image();
    }

    console.log("Starting sprite sheet load from:", globals.SPRITE_SHEET_SRC);

    _spriteSheetImage.onload = () => {
        _spriteSheetLoaded = true;
        // You might also want to update a flag in globals.js if it's broadly used
        // e.g., globals.setSpriteSheetLoadedState(true); // If you add such a setter in globals.js
        console.log("Sprite sheet loaded successfully via assetManager.");
        if (callback) callback();
    };

    _spriteSheetImage.onerror = () => {
        _spriteSheetLoaded = false;
        // globals.setSpriteSheetLoadedState(false);
        console.error("Failed to load sprite sheet via assetManager.");
        // Optionally, you might want the callback to receive an error
        if (callback) callback(new Error("Failed to load sprite sheet"));
    };

    _spriteSheetImage.src = globals.SPRITE_SHEET_SRC;
}

// Optional: A more generic asset loader if you plan to have many
// export const assets = {
//     images: {},
//     sounds: {},
//     data: {}
// };
//
// export function loadImage(name, src) {
//     return new Promise((resolve, reject) => {
//         const img = new Image();
//         img.onload = () => {
//             assets.images[name] = img;
//             resolve(img);
//         };
//         img.onerror = () => {
//             reject(new Error(`Failed to load image ${name} from ${src}`));
//         };
//         img.src = src;
//     });
// }
