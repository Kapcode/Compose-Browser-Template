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
        return; // Don't try to set img.src//todo not returning anymore debug step
    }
    img.src = path;
}
export function getSpriteData() {
    // Add a check here for debugging
    if (!spriteData || !spriteData.frames) {
        console.warn("[AssetManager getSpriteData] spriteData or spriteData.frames is null/undefined!");
    } else if (Object.keys(spriteData.frames).length === 0 && assetsLoadedSuccessfully) {
        console.warn("[AssetManager getSpriteData] assetsLoadedSuccessfully is true, but spriteData.frames is empty!");
    }
    return spriteData;
}
export function getLoadedImages() {
    return _loadedImages;
}
let spriteData = null; // This should end up as { frames: OBJECT, meta: OBJECT }
let masterSheetImage = null;
let assetsLoadedSuccessfully = false;

 export function getMasterSheetImage() {
     return masterSheetImage;
 }
export async function loadMasterSpriteSheet(jsonPath, imagePath, assetKey) { // Added assetKey for logging
    assetsLoadedSuccessfully = false;
    console.log(`[AssetManager] loadMasterSpriteSheet CALLED. JSON: "${jsonPath}", Image: "${imagePath}" for key "${assetKey}"`);
    console.log(`[AssetManager] Before load: masterSheetImage=${masterSheetImage}, spriteData=${JSON.stringify(spriteData)}`);

    try {
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${jsonPath}`);

        // This 'rawJsonData' IS the object that has a 'frames' (Array) and 'meta' property
        const rawTexturePackerOutput = await response.json();
        console.log(`[AssetManager] Raw JSON data loaded for key "${assetKey}":`, JSON.parse(JSON.stringify(rawTexturePackerOutput)));


        if (!rawTexturePackerOutput || !Array.isArray(rawTexturePackerOutput.frames)) {
            // If the structure isn't { frames: [], meta: {} }
            // OR if it's already { frames: {}, meta: {} } from a different packer setting
            if (rawTexturePackerOutput && typeof rawTexturePackerOutput.frames === 'object' && !Array.isArray(rawTexturePackerOutput.frames)) {
                console.log("[AssetManager] JSON frames data is already an object. Using as is.");
                spriteData = rawTexturePackerOutput; // Assumes it's already in the correct {frames: OBJECT, meta: OBJECT} format
            } else {
                throw new Error("Loaded JSON data's 'frames' property is not an array or the expected TexturePacker object structure.");
            }
        } else {
            // If rawTexturePackerOutput.frames IS an array, transform it.
            console.log("[AssetManager] JSON 'frames' data is an array. Transforming to keyed object for master_spritesheet.");
            const framesObject = {};
            rawTexturePackerOutput.frames.forEach(spriteDef => {
                if (spriteDef.filename) {
                    framesObject[spriteDef.filename] = spriteDef; // Use filename as the key
                } else {
                    console.warn("[AssetManager] Sprite definition in JSON array is missing 'filename' property:", spriteDef);
                }
            });
            // Construct the spriteData object to match what the game expects:
            // an object with a 'frames' property (which is now our new keyed object) and a 'meta' property.
            spriteData = {
                frames: framesObject,
                meta: rawTexturePackerOutput.meta || {} // Keep the original meta data
            };
            console.log(`[AssetManager] Transformed frames array to object. Number of keys: ${Object.keys(spriteData.frames).length}`);
        }

        const loadImagePromise = (src) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`Failed to load image: ${src}. Error: ${err.message || err.type || 'Unknown image load error'}`));
            img.src = src;
        });

        masterSheetImage = await loadImagePromise(imagePath);

        console.log(`[AssetManager] Master Sprite Sheet IMAGE loaded successfully for key "${assetKey}". Path: "${imagePath}"`);
        console.log(`[AssetManager] Final spriteData.frames keys sample (after potential transform):`, Object.keys(spriteData.frames).slice(0, 5).join(', '));
        assetsLoadedSuccessfully = true;
    } catch (error) {
        console.error(`[AssetManager] Error loading master sprite sheet for key "${assetKey}":`, error);
        spriteData = { frames: {}, meta: {} }; // Fallback to empty
        assetsLoadedSuccessfully = false;
        throw error;
    }
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

// ADD THIS FUNCTION:
export function drawSprite(ctx, spriteName, dx, dy, options = {}) {
    if (!masterSheetImage || !spriteData || !spriteData.frames) {
        if (options.debugDraw) {
            ctx.fillStyle = options.fallbackColor || 'rgba(255,0,255,0.5)'; // Magenta fallback
            ctx.fillRect(dx, dy, options.dWidth || 16, options.dHeight || 16); // Use provided dWidth/dHeight or default
            ctx.strokeStyle = 'red';
            const errorText = `Assets N/A for ${spriteName}`;
            ctx.strokeText(errorText.substring(0, 30), dx, dy + ( (options.dHeight || 16)/2 ) ); // Basic clipping
        }
        // console.warn(`[drawSprite] Assets not ready or spriteData.frames missing. Sprite: ${spriteName}`);
        return;
    }

    const spriteFrameDefinition = spriteData.frames[spriteName];

    if (!spriteFrameDefinition) {
        if (options.debugDraw) {
            ctx.fillStyle = options.fallbackColor || 'rgba(255,0,0,0.5)'; // Red fallback
            ctx.fillRect(dx, dy, options.dWidth || 16, options.dHeight || 16);
            ctx.strokeStyle = 'white';
            const errorText = `Missing Def: ${spriteName}`;
            ctx.strokeText(errorText.substring(0,30), dx, dy + ( (options.dHeight || 16)/2 ) );
        }
        // console.warn(`[drawSprite] Sprite named "${spriteName}" not found in spriteData.frames.`);
        return;
    }

    const { frame, sourceSize, spriteSourceSize, rotated } = spriteFrameDefinition;
    // frame: {x, y, w, h} -> The rectangle of the sprite on the packed sprite sheet.
    // sourceSize: {w, h} -> The original dimensions of the sprite before any trimming.
    // spriteSourceSize: {x, y, w, h} -> The trimmed sprite's rectangle within its original sourceSize.

    const sx = frame.x;
    const sy = frame.y;
    const sWidth = frame.w;
    const sHeight = frame.h;

    // Use options.dWidth/dHeight if provided for scaling, otherwise use sprite's own size.
    // If the sprite was rotated on the sheet by TexturePacker, sWidth/sHeight might be swapped
    // relative to the logical dimensions of the sprite.
    let dWidthToDraw = options.dWidth !== undefined ? options.dWidth : (rotated ? sHeight : sWidth);
    let dHeightToDraw = options.dHeight !== undefined ? options.dHeight : (rotated ? sWidth : sHeight);

    // Apply spriteScale from options if provided AND dWidth/dHeight were NOT provided
    if (options.spriteScale && options.dWidth === undefined && options.dHeight === undefined) {
        dWidthToDraw *= options.spriteScale;
        dHeightToDraw *= options.spriteScale;
    }


    // Adjust destination position for trimmed sprites
    // This draws the sprite as if its original (untrimmed) top-left is at dx, dy
    let actualDrawX = dx + (spriteSourceSize ? spriteSourceSize.x * (options.spriteScale || 1) : 0);
    let actualDrawY = dy + (spriteSourceSize ? spriteSourceSize.y * (options.spriteScale || 1) : 0);


    let saved = false;
    if (options.rotation || options.flipX || options.flipY || rotated) {
        ctx.save();
        saved = true;

        const centerX = actualDrawX + dWidthToDraw / 2;
        const centerY = actualDrawY + dHeightToDraw / 2;
        ctx.translate(centerX, centerY);

        if (options.rotation) ctx.rotate(options.rotation);
        if (options.flipX) ctx.scale(-1, 1);
        if (options.flipY) ctx.scale(1, -1);
        if (rotated) { // If sprite was rotated 90 deg CCW on sheet by TexturePacker
            ctx.rotate(-Math.PI / 2); // Rotate it back 90 deg CW for drawing
            // The dWidthToDraw/dHeightToDraw should inherently handle the swapped dimensions
            // if they were derived from the rotated sWidth/sHeight.
        }

        actualDrawX = -dWidthToDraw / 2;
        actualDrawY = -dHeightToDraw / 2;
    }

    ctx.drawImage(
        masterSheetImage,
        sx, sy, sWidth, sHeight,
        Math.round(actualDrawX),
        Math.round(actualDrawY),
        Math.round(dWidthToDraw),
        Math.round(dHeightToDraw)
    );

    if (saved) {
        ctx.restore();
    }

    // Debug drawing for logical bounds (sourceSize)
    if (options.debugDraw && sourceSize) {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)'; // Green for original logical bounds
        ctx.lineWidth = 1 / (globals.sceneState.currentScale || 1); // Adjust line width for global scale

        // The dx, dy should represent the original top-left.
        // The width/height for this debug box should be the original sourceSize, scaled if applicable.
        let debugWidth = sourceSize.w;
        let debugHeight = sourceSize.h;
        if (options.spriteScale) {
            debugWidth *= options.spriteScale;
            debugHeight *= options.spriteScale;
        }
        // If dWidth/dHeight were passed, they might represent a forced size,
        // but for debugging sourceSize, we usually want to see the original footprint.
        // You might choose options.dWidth or sourceSize.w based on what you want to debug.
        // For now, let's use sourceSize scaled by spriteScale.

        ctx.strokeRect(
            Math.round(dx), // Original intended top-left x
            Math.round(dy), // Original intended top-left y
            Math.round(debugWidth),
            Math.round(debugHeight)
        );
        if (spriteFrameDefinition) {
            ctx.fillStyle = "white";
            ctx.font = `${8 / (globals.sceneState.currentScale || 1)}px sans-serif`;
            ctx.fillText(spriteName.substring(0,20), Math.round(dx), Math.round(dy) - 2);
        }
    }
}