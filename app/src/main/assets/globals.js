// ./globals.js
import { gamePaused, gameStopped, gameStateLogs, timeWhenPauseActuallyStarted } from './main.js';

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
export const SPRITE_SHEET_SRC = 'images/pickle/master-sprite.png';//possibly not needed
export let spriteSheetLoadStatus = 'pending';
// export const ASSET_PATHS = { masterSheet: 'images/pickle/master-sprite.png' }; // Redundant if SPRITE_SHEET_SRC is used
export function setSpriteSheetLoadStatus(status) {
    spriteSheetLoadStatus = status;
}
// export const loadedSpriteSheets = {}; // Not used in provided main.js
// export let allAssetsLoaded = false; // Redundant if only one sprite sheet

// --- Default Scale for Entities ---
export const default_scale = 1.0;

// --- Animation Definitions ---
export const ANIMATIONS = {
    "cheff_ketchup_walk": {
        sheet: SPRITE_SHEET_SRC,
        loop: true,
        defaultAnimationSpeed: 300,
        baseMovementSpeed: 50,
        frames: [
            { sx: 0,  sy: 0, sWidth: 90, sHeight: 150, duration: 50 ,speedModifier: 1},
            { sx: 95, sy: 154, sWidth: 92, sHeight: 149, duration: 200 ,speedModifier: 0.2},
            { sx: 100, sy: 0, sWidth: 110, sHeight: 150, duration: 200,speedModifier: 0.2  }
        ]
    },
    "pickle_player_idle": {
        sheet: SPRITE_SHEET_SRC,
        loop: true,
        defaultAnimationSpeed: 300,
        baseMovementSpeed: 0,
        frames: [
            { sx: 0,  sy: 320, sWidth: 83, sHeight: 115, duration: 500 ,speedModifier: 0}
        ]
    }
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
