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
export function loadImage(key, path, callback) {
    if (_loadedImages[key] && _loadedImages[key].complete && _loadedImages[key].naturalWidth > 0) {
        console.log(`Image with key "${key}" already loaded.`);
        if (callback) callback(null, _loadedImages[key]); // Pass null for error, then image
        return;
    }

    // If already loading this key, add callback and return
    if (_imageLoadCallbacks[key]) {
        if (callback) _imageLoadCallbacks[key].push(callback);
        console.log(`Image with key "${key}" is currently being loaded. Callback added.`);
        return;
    }

    const img = new Image();
    _loadedImages[key] = img; // Store it immediately so isSpriteSheetLoaded can potentially see it
    _imageLoadCallbacks[key] = callback ? [callback] : []; // Initialize callbacks array

    console.log(`Starting image load for key "${key}" from: ${path}`);

    img.onload = () => {
        console.log(`Image loaded successfully: key "${key}" from ${path}`);
        const callbacks = _imageLoadCallbacks[key];
        if (callbacks) {
            callbacks.forEach(cb => cb(null, img)); // Call each callback for this key
        }
        delete _imageLoadCallbacks[key]; // Clear callbacks for this key
    };

    img.onerror = () => {
        console.error(`Failed to load image: key "${key}" from ${path}`);
        delete _loadedImages[key]; // Remove the failed image placeholder
        const callbacks = _imageLoadCallbacks[key];
        if (callbacks) {
            const err = new Error(`Failed to load image ${key}`);
            callbacks.forEach(cb => cb(err, null)); // Call callbacks with an error
        }
        delete _imageLoadCallbacks[key];
    };

    img.src = path;
}

export function getSpriteSheetImage(key) { // Or just getImage(key)
    const img = _loadedImages[key]; // Assuming _loadedImages stores your loaded image objects
    if (img && img.complete && img.naturalWidth > 0) {
        return img;
    }
    // Optional: A warning if you try to get an image that isn't ready or doesn't exist.
    // Be careful with this, as it can be noisy if you check before loading is guaranteed.
    // console.warn(`getSpriteSheetImage: Image for key '${key}' not found, not fully loaded, or is invalid.`);
    return null;
}