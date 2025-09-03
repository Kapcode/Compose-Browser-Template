// ./globals.js
// --- Game Config / Native Dimensions ---
export const nativeGameWidth = 1280;
export const nativeGameHeight = 720;
export let nativeGameAspectRatio = nativeGameWidth / nativeGameHeight;

// --- Scaling and Offset (Calculated in main.js, stored here) ---
export const sceneState = {
    currentScale: 1,
    currentOffsetX: 0,
    currentOffsetY: 0,
    // ... other related state if any
};


// --- Game State Flags ---








export const debugDraw = true;

// --- Asset Paths & Loading State ---
export const SPRITE_SHEET_SRC = 'images/pickle/ms.png';//todo remove this was path in manifest, now im usinbg imagePath
export const SPRITE_SHEET_PATH = 'images/pickle/master.png'; // Or make this SPRITE_SHEET_IMAGE_PATH
export const SPRITE_SHEET_JSON_PATH = 'images/pickle/master.json'; // <<<< ADD THIS (Adjust path as needed)
export const MASTER_SPRITE_SHEET_KEY = 'master_spritesheet';

export let spriteSheetLoadStatus = 'pending';
// export const ASSET_PATHS = { masterSheet: 'images/pickle/ms.png' }; // Redundant if SPRITE_SHEET_SRC is used
export function setSpriteSheetLoadStatus(status) {
    spriteSheetLoadStatus = status;
}
// export const loadedSpriteSheets = {}; // Not used in provided main.js
// export let allAssetsLoaded = false; // Redundant if only one sprite sheet

// --- Default Scale for Entities ---
export const default_scale = 1.0;

// In globals.js
export const ANIMATIONS = {
    "cheff_ketchup_walk": {
        spriteSheetKey: MASTER_SPRITE_SHEET_KEY,
        loop: true,
        defaultAnimationSpeedFPS: 10, // Or use per-frame durations
        baseMovementSpeed: 50,
        baseSpeedModifier: 1, // Optional: base speed modifier for the animation
        frames: [
            // THESE MUST BE STRINGS (SPRITE NAMES FROM YOUR JSON)
            // OR OBJECTS LIKE { name: "sprite_name", duration: ..., speedModifier: ... }
             // Example sprite name
            "chef_step-1.png",
            "chef_step-2.png",
            "chef_step-3.png",
            "chef_step-4.png",
            "chef_step-5.png",
            "chef_step-6.png",
            "chef_step-7.png",
            "chef_step-8.png",
            // If using objects for per-frame details:
            // { name: "chef_walk_frame_0", duration: 100, speedModifier: 1.0 },
            // { name: "chef_walk_frame_1", duration: 100, speedModifier: 1.0 },
            // { name: "chef_walk_frame_2", duration: 120, speedModifier: 0.9 }
        ]
    },
    "pickle_player_idle": {
        spriteSheetKey: MASTER_SPRITE_SHEET_KEY,
        loop: false,
        defaultAnimationSpeedFPS: 5,
        baseMovementSpeed: 0,
        frames: [
            "walk-pickle-1.png", // Example sprite name
            "walk-pickle-4.png",
            "walk-pickle-5.png",
            "walk-pickle-6.png"
        ]
    },
    "pickle_player_walk": { // Example for player walk
        spriteSheetKey: MASTER_SPRITE_SHEET_KEY,
        loop: true,
        defaultAnimationSpeedFPS: 12,
        baseMovementSpeed: 0, // Movement speed might be handled by Player class itself
        frames: [
            "walk-pickle-1.png", // Example sprite name
            "walk-pickle-4.png",
            "walk-pickle-5.png",
            "walk-pickle-6.png"
        ]
    }
    // ... other animations ...
};


// --- DOM Element References (Exported as null, initialized in main.js) ---
// It's often better to manage DOM elements in the module that directly uses them (main.js or a UI module)
// or pass them around, rather than making them "global" references modified from elsewhere.
// However, if your design requires them to be accessible via the 'globals' object from other modules:
export let gameOverSound = null;
export let scoreDisplayUse = null;
export let scoresplatUse = null;

export let welcomeBackgroundImageContainer = null;
export let controlsOverlay = null;
export let pauseButton = null;
export let welcomeScreen = null;
export let pauseMenuOverlay = null;
export let resumeButton = null;
export let startButton = null;
export let quitToMenuButton = null;
export let settingsButton = null; // Could be settingsButtonWelcome or settingsButtonGame
export let settingsOverlay = null;
// export let settingsButtonWelcome = null; // Redundant if 'settingsButton' is generic
export let closeSettingsButton = null;
export let rotateMessageOverlay = null;



// --- Setter Functions ---

export function setWelcomeBackgroundImageContainer(el) {
    welcomeBackgroundImageContainer = el;
    // if (debugDraw) console.log("Global welcomeBackgroundImageContainer updated"); // Optional logging
}

export function setControlsOverlay(el) {
    controlsOverlay = el;
    // if (debugDraw) console.log("Global controlsOverlay updated");
}

export function setPauseButton(el) {
    pauseButton = el;
}

export function setWelcomeScreen(el) {
    welcomeScreen = el;
}

export function setPauseMenuOverlay(el) {
    pauseMenuOverlay = el;
}

export function setResumeButton(el) {
    resumeButton = el;
}

export function setStartButton(el) {
    startButton = el;
}

export function setQuitToMenuButton(el) {
    quitToMenuButton = el;
}

export function setSettingsButton(el) { // Generic setter
    settingsButton = el;
}

export function setSettingsOverlay(el) {
    settingsOverlay = el;
}

export function setCloseSettingsButton(el) {
    closeSettingsButton = el;
}

export function setRotateMessageOverlay(el) {
    rotateMessageOverlay = el;
}
