// ./assetManager.js
import * as globals from './globals.js';

// Module-level storage for images, indexed by a key
const _loadedImages = {};
const _imageLoadCallbacks = {}; // To store callbacks for specific keys if loading is in progress
export function isSpriteSheetLoaded(key) {
    const img = _loadedImages[key];
    // Check if the image object exists, loading is complete, and it has actual dimensions
    const loaded = !!(img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
    // You can add a log here if you're actively debugging load states:
    // console.log(`[isSpriteSheetLoaded] Key: "${key}", Exists: ${!!img}, Complete: ${img ? img.complete : 'N/A'}, Width: ${img ? img.naturalWidth : 'N/A'}, Result: ${loaded}`);
    return loaded;
}

/**
 * Loads an image from a given path and associates it with a key.
 * @param {string} key - The unique key to identify this image (e.g., globals.MASTER_SPRITE_SHEET_KEY).
 * @param {string} path - The path to the image file (e.g., globals.SPRITE_SHEET_PATH).
 * @param {function} [callback] - Optional callback function to execute when this specific image is loaded.
 */
export function loadImage(key, path, callbackFromMain) { // callbackFromMain is singleAssetProcessed
    console.log(`[AssetManager] loadImage CALLED. Key: "${key}", Path: "${path}"`);
    const img = new Image();

    img.onload = () => {
        console.log(`[AssetManager] SUCCESS for key "${key}". Path: "${path}"`);
        _loadedImages[key] = img;
        if (callbackFromMain) {
            callbackFromMain(key, null, img); // key, NO error, the image
        }
    };

    img.onerror = (errorEvent) => { // errorEvent might give more info
        const error = new Error(`Failed to load image at path: ${path}`);
        console.error(`[AssetManager] ERROR for key "${key}". Path: "${path}"`, error);
        // _loadedImages[key] = null; // Or some placeholder for a failed image if needed
        if (callbackFromMain) {
            callbackFromMain(key, error, null); // key, THE error, NO image
        }
    };

    if (!path) {
        const error = new Error(`Path is undefined/null for key "${key}"`);
        console.error(`[AssetManager] PRE-LOAD ERROR for key "${key}"`, error);
        if (callbackFromMain) {
            callbackFromMain(key, error, null); // Call callback immediately with error
        }
        return; // Don't try to set img.src
    }
    img.src = path;
}


// assetManager.js
export function getSpriteSheetImage(key) {
    console.log(`[AssetManager] getSpriteSheetImage attempting to get key: "${key}"`);
    const img = _loadedImages[key];

    if (!img) {
        console.warn(`[AssetManager] getSpriteSheetImage: Image NOT FOUND in _loadedImages for key "${key}". Returning null.`);
        return null;
    }

    // Log the state of the found image
    console.log(`[AssetManager] getSpriteSheetImage: Found entry for key "${key}". Image object:`, img);
    console.log(`[AssetManager] Image properties: complete=${img.complete}, naturalWidth=${img.naturalWidth}, naturalHeight=${img.naturalHeight}, src=${img.src}`);

    if (img.complete && img.naturalWidth > 0) { // Check if it's truly loaded and valid
        console.log(`[AssetManager] getSpriteSheetImage: Image for key "${key}" is COMPLETE and VALID. Returning image.`);
        return img;
    } else {
        console.warn(`[AssetManager] getSpriteSheetImage: Image for key "${key}" found but NOT COMPLETE or NOT VALID (naturalWidth=0). complete=${img.complete}, naturalWidth=${img.naturalWidth}. Returning null.`);
        return null;
    }
}