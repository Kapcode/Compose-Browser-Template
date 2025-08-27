import { GameObject } from './GameObject.js';
import { Sprite } from './Sprite.js';
import { Player } from './Player.js';
import { Character } from './Character.js';
import { handleTilemapCollisions, getTileIdAtTileCoords, TILE_SIZE, TILE_PROPERTIES } from './tileMapManagement.js';
import { simplePickleSvgString } from './constants.js';
import { setVolume,playPooledSound } from './audioManagement.js';
import { loadSettings, loadProgress,saveProgress,saveSettings,updateSettingsFromUI,applyGameSettings,applyGameProgress, populateSettingsUI,addListenersForSettingsUI } from './settingsManagement.js';


// At the start or in your resize handler:
let nativeGameWidth = 1280; // Your chosen native landscape width
let nativeGameHeight = 720; // Your chosen native landscape height
let nativeGameAspectRatio = nativeGameWidth / nativeGameHeight;

let currentScale = 1;
let currentOffsetX = 0;
let currentOffsetY = 0;

let debugDraw = false;
let gamePaused = false;
let gameStopped = true; // New flag to track if the game is fully stopped
let timeWhenPauseActuallyStarted = 0;
const gameStateLogs = false; // Set to true to log game state changes // set false on release, true for debugging, prevents tons of console logs
        // --- Game Area Dimensions ---
let headingHeight = 0;
const gameAreaWidth = parseFloat(gameArea.getAttribute('width'));
const gameAreaHeight = parseFloat(gameArea.getAttribute('height'));
const default_scale = 1.0; // Scale factor for the game elements
const baseGroupWidth = 100;   // Width before scaling
const baseGroupHeight = 50;  // Height before scaling

const scoreDisplayUse = document.getElementById('scoreDisplay');
const scoresplatUse = document.getElementById('scoresplat');
const canvas = document.getElementById('gameArea');
const ctx = canvas.getContext('2d');
let welcomeBackgroundImageContainer = document.getElementById('welcomeBackgroundImageContainer'); // Assuming you have a container for the welcome background image
let controlsOverlay = document.getElementById('gameControlsOverlay'); // Assuming you have a controls overlay element
let pauseButton = document.getElementById('pauseButton');
let welcomeScreen = document.getElementById('welcomeScreenOverlay');
let pauseMenuOverlay = document.getElementById('pauseMenuOverlay');
let resumeButton = document.getElementById('resumeButton');
let startButton = document.getElementById('startGameButton');
let quitToMenuButton = document.getElementById('quitToMenuButton'); //
let settingsButton = document.getElementById('settingsButtonWelcome'); // Your main game's settings button
let settingsOverlay = document.getElementById('settingsOverlay');
let settingsButtonWelcome = document.getElementById('settingsButtonWelcome');
let closeSettingsButton = document.getElementById('closeSettingsButton');
let rotateMessageOverlay = document.getElementById('rotateMessageOverlay'); // Assume you have this HTML element


let gameTimeAccumulator = 0;
canvas.width = 720; // Default width, same as your old SVG viewBox
canvas.height = 1280; // Default height, same as your old SVG viewBox
let gameAreaViewBoxWidth = canvas.width;
let gameAreaViewBoxHeight = canvas.height;
let liveGameArea = canvas; // Now, liveGameArea refers to the canvas
// --- Game State ---
let activeGameElements = [];
const MAX_ONSCREEN_ELEMENTS = 5;
let lastSpawnTime = 0;
let score = 0;
let lastTimestamp = 0;
let animationFrameId = null;



// Add a counter variable in a scope accessible by gameLogic
// (e.g., globally or just before gameLogic if it's not already defined elsewhere for this purpose)
let spawnCounter = 0;
const SPAWN_INTERVAL_FRAMES = 120; // Spawn roughly every 2 seconds if MAX_DELTA_TIME is ~1/60s


const SPRITE_SHEET_SRC = 'images/pickle/master-sprite.png';
const ASSET_PATHS = {
    masterSheet: 'images/pickle/master-sprite.png',
    // You might still have other images for backgrounds, UI elements not on the sheet, etc.
};
// --- Global or within your game's asset loading scope ---
let spriteSheetImage = null;
let spriteSheetLoaded = false;
const loadedSpriteSheets = {}; // Will primarily hold loadedSpriteSheets.masterSheet
let allAssetsLoaded = false; // Or a more specific flag like masterSheetLoaded
// ***** NEW: Define your animations from the master sheet *****
const ANIMATIONS = {
    "cheff_ketchup_walk": {
        sheet: SPRITE_SHEET_SRC, // Could still be here, or even per-frame
        loop: true,              // Moved to top level of animation definition
        defaultAnimationSpeed: 300, // A fallback if a frame doesn't specify duration
        // NEW: Define a base movement speed for this animation sequence
        baseMovementSpeed: 50,
        frames: [
            // Frame 0 of "cheff_ketchup_walk"
            { sx: 0,  sy: 0, sWidth: 90, sHeight: 150, duration: 50 ,speedModifier: 1},
            // Frame 1 of "cheff_ketchup_walk"
            { sx: 95, sy: 154, sWidth: 92, sHeight: 149, duration: 200 ,speedModifier: 0.2},
            { sx: 100, sy: 0, sWidth: 110, sHeight: 150, duration: 200,speedModifier: 0.2  }//
            // If it was a 3rd frame:

        ]
    },
    // Add more animations here following the same structure
    // "explosion": { startFrameOnSheet: 11, frameWidth: 64, frameHeight: 64, totalFramesInAnimation: 5, animationSpeed: 80, loop: false }
    "pickle_player_idle": {
        sheet: SPRITE_SHEET_SRC, // Could still be here, or even per-frame
        loop: true,              // Moved to top level of animation definition
        defaultAnimationSpeed: 300, // A fallback if a frame doesn't specify duration
        // NEW: Define a base movement speed for this animation sequence
        baseMovementSpeed: 0,
        frames: [

            { sx: 0,  sy: 320, sWidth: 83, sHeight: 115, duration: 500 ,speedModifier: 0}
            //{ sx: 95, sy: 154, sWidth: 92, sHeight: 149, duration: 500 ,speedModifier: 0},
            // { sx: 100, sy: 0, sWidth: 110, sHeight: 150, duration: 500,speedModifier: 0  }


        ]
    }


};


function handleGameResumeAfterSystemPause() {
    const timeNow = performance.now();
    console.log("Game resuming after system interruption (e.g., tab became visible).");

    lastTimestamp = timeNow;
    gameTimeAccumulator = 0;
    lastSpawnTime = timeNow;
            // Ensure game is unpaused
    setPauseState(false);
}




document.addEventListener("visibilitychange", () => {
    if (gameStopped) {
        return; // If game is fully stopped, visibility changes don't matter for game logic
    }

    if (document.hidden) {
        // --- PAGE IS HIDDEN ---
        if (!gamePaused) { // Only "auto-pause" if not already paused by the user
            console.log("Page hidden, auto-pausing game logic.");
            // You might not want to call setPauseState(true) if it shows a pause menu,
            // as this is a system-level pause.
            // Instead, you might have a separate flag or just rely on not running updates.
            // For simplicity, let's assume we treat it like a pause for now.
            // If you *do* call setPauseState(true), make sure its internal logic
            // doesn't conflict with what you want to happen on visibility resume.

            // The most important thing is that your gameLoop will effectively pause
            // because requestAnimationFrame stops firing regularly.
            // We can record the time for logging if desired.
            // timeWhenPauseActuallyStarted = performance.now();

            setPauseState(true); // This will handle timing resets when unpausing
            console.log("Game auto-paused due to page visibility change.");


        }
    } else {
        // --- PAGE IS VISIBLE AGAIN ---
        console.log("Page became visible.");
        // CRITICAL: Reset timing variables to prevent a large deltaTime jump and catch-up.
        handleGameResumeAfterSystemPause();

        // If you had a specific "auto-paused due to visibility" flag,
        // you would clear it here. If you used your main 'gamePaused' flag,
        // and want to auto-resume ONLY if it was visibility that paused it,
        // you'd need more complex flag management.

        // Simplest approach: if the game wasn't *manually* paused by the user,
        // and it becomes visible, it should be running.
        // The handleGameResumeAfterSystemPause() already prepared the timers.
        // If your gameLoop correctly checks a 'gamePaused' flag (for manual pauses),
        // it will resume normally if 'gamePaused' is false.
    }
});





function setPauseState(pause) {
    if (gamePaused === pause) {
        console.warn("Game is already in the requested pause state:", pause);
        return;
    }
    gamePaused = pause;
    if (pause) {
        timeWhenPauseActuallyStarted = performance.now(); // Record when the pause started
        console.log("Game paused at", timeWhenPauseActuallyStarted);
    } else {
        // --- ACTIONS WHEN GAME IS UNPAUSED ---
        const timeNow = performance.now();
        const durationOfPause = timeWhenPauseActuallyStarted > 0 ? (timeNow - timeWhenPauseActuallyStarted) / 1000 : 0;
        console.log(`Game unpaused. Was paused for approx ${durationOfPause.toFixed(2)} seconds.`);

        lastTimestamp = timeNow;         // CRUCIAL: Resets delta time calculation for the *next* frame
        gameTimeAccumulator = 0;          // CRUCIAL: Prevents the fixed-step loop from "catching up" many missed steps
        lastSpawnTime = timeNow;         // CRUCIAL: Prevent immediate spawn after a long pause

        timeWhenPauseActuallyStarted = 0; // Reset pause start time tracker

    }

}


// --- Inside your main game loop's update logic (e.g., updateGameObjects(deltaTime)) ---
// --- Inside your main game loop's update logic (e.g., updateGameObjects(deltaTime)) ---
function updateGameElements(deltaTime, currentTime) { // deltaTime is in seconds, currentTime in ms
        let elementsToKeep = [];
        activeGameElements.forEach(element => {
            if (element.isActive) {
                element.update(deltaTime, currentTime, activeGameElements); // Polymorphic call
                if (element.isActive) { // Check again, as update() might set it to false
                    elementsToKeep.push(element);
                }
            }
        });
        activeGameElements = elementsToKeep;


}




const MAX_DELTA_TIME = 0.01666666667; // 100ms, your fixed time step in seconds
// 0.01666666667 // 16.67ms, roughly 60 FPS

function gameLoop(currentTimestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!liveGameArea) {
        liveGameArea = document.getElementById('gameArea');
        if (!liveGameArea) {
            console.error("CRITICAL: liveGameArea not found! Stopping loop.");
            return;
        }
    }

    if (gameStopped) {
        console.log("Game is stopped. Game loop terminated.");
        return;
    }

    // Initialize lastTimestamp on the very first frame
    if (lastTimestamp === 0) {
        lastTimestamp = currentTimestamp;
        animationFrameId = requestAnimationFrame(gameLoop); // Request next frame and exit this one
        return;
    }

    let deltaTime = (currentTimestamp - lastTimestamp) / 1000; // Delta time in seconds

    // --- Handle Pausing ---
    // If game is paused, we don't update logic or lastTimestamp for delta calc.
    // We just keep requesting frames to keep the loop "alive" for when it unpauses.
    if (gamePaused) {
        if(gameStateLogs ===true)console.log("GameLoop: Game is paused. Skipping updates.");
        // When unpausing, ensure lastTimestamp is reset externally (see unpauseGame example)
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    // --- Update lastTimestamp for the NEXT frame's deltaTime calculation ---
    // This should happen REGARDLESS of interaction pauses, so deltaTime is always fresh.
    lastTimestamp = currentTimestamp;

    // --- DeltaTime Sanity Check (Optional but good for extreme cases) ---
    if (deltaTime <= 0) {
        // console.warn(`GameLoop: Negative or zero deltaTime (${deltaTime}), skipping update logic for this frame.`);
        animationFrameId = requestAnimationFrame(gameLoop); // Still request next frame
        return;
    }
    // Cap deltaTime to prevent massive jumps (e.g., after tab was hidden for a long time
    // and Page Visibility API wasn't used to pause AND reset lastTimestamp)
    const MAX_POSSIBLE_DELTA_TIME = 0.5; // e.g., 500ms
    if (deltaTime > MAX_POSSIBLE_DELTA_TIME) {
        console.warn(`GameLoop: Large deltaTime (${deltaTime}) capped to ${MAX_POSSIBLE_DELTA_TIME}. Consider Page Visibility API for pausing.`);
        deltaTime = MAX_POSSIBLE_DELTA_TIME;
    }

    // --- Fixed-Step Update Loop ---
    gameTimeAccumulator += deltaTime;

    while (gameTimeAccumulator >= MAX_DELTA_TIME) {
        // Only run game logic if not paused by interaction/splat
        if (!gamePaused ) {
            // --- Your Game Logic Updates using MAX_DELTA_TIME ---
            gameLogic(liveGameArea); // Call your game logic function here
            // --- Render Game ---

            updateGameElements(MAX_DELTA_TIME,currentTimestamp); // Pass the FIXED time step

        } else {
            // If there's any logic that should run *despite* these pauses but
            // *during* a fixed step, it would go here. Usually, nothing does.
        }
        gameTimeAccumulator -= MAX_DELTA_TIME;
    }
    if (!gamePaused) {
        // Inside your gameLoop function
        //console.log("About to call drawGameElements from gameLoop");
        drawGameElements(ctx); // <-- ADD THIS LINE
    }
    // --- Rendering (Happens every frame, uses current element states) ---
    // renderAllGameElements(); // (This would be where you draw things based on their updated positions)

    animationFrameId = requestAnimationFrame(gameLoop);
}


function gameLogic(liveGameArea) { // liveGameArea might be the canvas
    // This is where you would put your game logic that needs to run every fixed step

    spawnCounter++;
    if (spawnCounter >= SPAWN_INTERVAL_FRAMES) {
        spawnTestRectangle();
        spawnCounter = 0; // Reset counter
    }

    // The rest of your gameLogic (which is currently empty or commented out)
    // e.g., pickle spawning logic was here, which is commented out.
    // console.log(`Current score: ${score}`);
}

function startGame() {
    playPooledSound('jump', 'sounds/gameOver.wav');
    gamePaused = false; // Reset paused state
    if (animationFrameId === null) {
        hidePauseMenu(); // Hide pause menu if visible
        console.log("Starting new game.");
        score = 0; // Reset score
        initializeGame(); // Reset game state
        //startGame(); // Start the game loop dont do that it's recusive...!
        console.log("Starting game loop.");
        lastTimestamp = performance.now();
        animationFrameId = requestAnimationFrame((timestamp) => gameLoop(timestamp, liveGameArea));
        gameStopped = false; // Game is now running
    } else {
        console.log("Game is already running, cannot start again.");
    }
    if (spriteSheetLoaded) {
        //spawnAnimatedSprite(); // Spawns with "default_fall" animation at random X, top Y
        // CORRECT - passing an object for direction

        // To make Chef half his original sprite sheet size IN THE GAME WORLD:
        //spawnChefKetchupWalking(100, 100, { x: 1, y: 0 }, chefScale);
       // spawnPatrollingChef(nativeGameHeight - 100, chefScale, 50);
        // Spawning:
        //activeGameElements.push(new Player(50, nativeGameHeight - 150, "cheff_ketchup_walk", 1.0));
       // activeGameElements.push(new EnemyPatrol(200, nativeGameHeight - 150, "cheff_ketchup_walk", 1.0, 50, 80, 100, nativeGameWidth - 100));
        const eChef1 = new EnemyPatrol(
            200,
            nativeGameHeight - 150,
            "cheff_ketchup_walk",
            default_scale,//1.0 unless effects are applied
            50,
            80,
            0,
            nativeGameWidth
        );



        activeGameElements.push(eChef1);
        //    constructor(x, y, animationName, spriteScale) {
        //        super(x, y, animationName, spriteScale);
        //        this.entityType = "player_pickle";
        const pPickle1 = new PicklePlayer(
            400,
            nativeGameHeight - 150,
            "pickle_player_idle",default_scale);
        activeGameElements.push(pPickle1);
        // spawnAnimatedSprite("cheff_ketchup_walk", x, y, { scale: 0.5, entityType: 'enemy_chef_ketchup', ... });
    }

}





// 4. Add cleanup on game stop
function stopGame() {
    if (animationFrameId) {
        gameStopped = true; // Set game stopped flag
        gamePaused = false; // Ensure game is not paused
        console.log("Stopping game loop.");
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log("Game loop stopped.");
    }

    // Clean up all active elements
    activeGameElements.forEach(elem => {
        if (elem.element) {
            //elem.element.removeEventListener('click', handleWordBoxClick);
/*                    if (elem.element.parentNode) {
                elem.element.parentNode.removeChild(elem.element);
            }*/
            elem.element = null;
        }
    });

    activeGameElements = [];
    lastTimestamp = 0;

}

function pauseGame() {
    timeWhenPauseActuallyStarted = performance.now();
    if (!animationFrameId) {
        console.log("Game is not running, cannot pause.");
        return; // Game is not running, do nothing
    }

    if (gamePaused) {
        console.log("Game is already paused.");
        return; // Already paused, do nothing
    }

    gamePaused = true;
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null; // don't do this, this tells us the game was not running
    console.log("Game paused.");

    // Show pause menu
    const pauseMenuOverlay = document.getElementById('pauseMenuOverlay');
    if (pauseMenuOverlay) {
        pauseMenuOverlay.style.display = 'flex'; // Show pause menu
    }
}
function hidePauseMenu() {
    const pauseMenuOverlay = document.getElementById('pauseMenuOverlay');
    if (pauseMenuOverlay) {
        pauseMenuOverlay.style.display = 'none'; // Hide pause menu
    }
}

// --- Control and Setup ---
// ... (initializeGame, button event listeners remain the same) ...
function resumeButtonFunc() {
    if (gamePaused) {
        console.log("Resuming game from pause.");
        gamePaused = false; // Reset paused state

        const pauseDuration = performance.now() - timeWhenPauseActuallyStarted;
        lastSpawnTime += pauseDuration;
        lastTimestamp = performance.now();
        animationFrameId = requestAnimationFrame((timestamp) => gameLoop(timestamp, liveGameArea));

        // Hide pause menu if it's visible
        hidePauseMenu();
    } else {
        console.log("Starting new game.");
        initializeGame(); // Reset game state
        startGame(); // Start the game loop
    }
}

function initializeGame() {
    resizeCanvasAndCalculateScale();
    loadSettings(); // Load settings from localStorage
    loadProgress(); // Load progress from localStorage
    // Clear array
    activeGameElements = [];
    lastSpawnTime = performance.now();

}
function showGameControls() {
    if (controlsOverlay) {
        controlsOverlay.style.visibility = 'visible'; // Make controls overlay visible
        controlsOverlay.style.display = 'block'; // Show controls overlay
    } else {
        console.error("Controls overlay not found.");
    }
}
function hideGameControls() {
    if (controlsOverlay) {
        controlsOverlay.style.visibility = 'hidden'; // Hide controls overlay

        controlsOverlay.style.display = 'none'; // Hide controls overlay
    } else {
        console.error("Controls overlay not found.");
    }
}
function showWelcomeScreen(){
    if (welcomeScreen) {
        welcomeBackgroundImageContainer.style.display = 'block'; // Show background image container
    } else {
        console.error("Welcome screen not found.");
    }
}
function hideWelcomeScreen() {
    if (welcomeScreen) {
        welcomeBackgroundImageContainer.style.display = 'none'; // Hide background image container
    } else {
        console.error("Welcome screen not found.");
    }
}


    /**
* Checks the current screen orientation and takes appropriate action.
* This function will be our main handler.
*/
function handleOrientationChange() {
    let currentOrientation = '';
    if (screen.orientation && screen.orientation.type) {
        currentOrientation = screen.orientation.type;
        console.log(`Screen Orientation API: ${currentOrientation}`);
    } else if (window.matchMedia("(orientation: landscape)").matches) {
        currentOrientation = 'landscape-primary'; // General landscape
        console.log('MatchMedia: Landscape');
    } else if (window.matchMedia("(orientation: portrait)").matches) {
        currentOrientation = 'portrait-primary'; // General portrait
        console.log('MatchMedia: Portrait');
    } else if (typeof window.orientation !== 'undefined') {
        // Fallback to window.orientation (degrees)
        console.log(`Window.orientation (degrees): ${window.orientation}`);
        switch (window.orientation) {
            case 0:
            case 180: // Portrait or upside-down portrait
                currentOrientation = 'portrait-primary';
                break;
            case 90:
            case -90: // Landscape
                currentOrientation = 'landscape-primary';
                break;
            default:
                currentOrientation = 'unknown';
        }
    } else {
        currentOrientation = 'unknown';
        console.log('Could not determine orientation.');
    }

    // --- Your Game's Logic for Orientation ---
    // Since you prefer "sensorPortrait" and want to enforce it,
    // your primary goal here is to detect if it's NOT portrait.
    if (currentOrientation.includes('landscape')) {
        console.warn("Device is in Landscape. Game designed for Portrait.");
        if (rotateMessageOverlay) {
            rotateMessageOverlay.innerHTML = "<p>This experience is best in Portrait mode. Please rotate your device.</p>";
            rotateMessageOverlay.style.display = 'flex';
        }
        // Consider implicitly pausing game logic if it's truly unplayable or graphics break
        // if (!gamePaused) { // Assuming 'gamePaused' is your global pause flag
        //    setPauseState(true, 'orientation'); // Pass a reason if your pause system supports it
        // }
    } else if (currentOrientation.includes('portrait')) {
        console.log("Device is in Portrait. Correct orientation for the game.");
        if (rotateMessageOverlay) {
            rotateMessageOverlay.style.display = 'none';
        }
        // If you implicitly paused due to orientation, you might resume here,
        // but be careful not to override a user's explicit pause.
        // if (wasPausedByOrientation && gamePaused) {
        //    setPauseState(false, 'orientation');
        // }
    } else {
        console.log("Orientation is unknown or not strictly portrait/landscape.");
        // Decide how to handle this case, maybe hide the message.
        if (rotateMessageOverlay) {
            rotateMessageOverlay.style.display = 'none';
        }
    }
}

/**
* Initializes orientation detection listeners.
*/
function initOrientationDetection() {
    console.log("Initializing JavaScript orientation detection...");

    // 1. Modern approach: screen.orientation API
    if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
        screen.orientation.addEventListener('change', () => {
            console.log("Event: screen.orientation 'change'");
            handleOrientationChange();
        });
        console.log("Attached listener to screen.orientation 'change'.");
    } else {
        // 2. Fallback: matchMedia for orientation
        const landscapeMatcher = window.matchMedia("(orientation: landscape)");
        if (typeof landscapeMatcher.addEventListener === 'function') {
            landscapeMatcher.addEventListener('change', (e) => {
                console.log(`Event: matchMedia '(orientation: landscape)' changed. Matches: ${e.matches}`);
                handleOrientationChange();
            });
            console.log("Attached listener to matchMedia '(orientation: landscape)'.");
            // Note: You might also want to listen to "(orientation: portrait)" changes
            // if the landscape one doesn't fire reliably on all transitions back to portrait.
            // However, usually one is sufficient as handleOrientationChange checks both.
        } else if (typeof window.addEventListener === 'function') {
            // 3. Older fallback: 'orientationchange' event on window
            window.addEventListener('orientationchange', () => {
                console.log("Event: window 'orientationchange'");
                handleOrientationChange();
            }, false);
            console.log("Attached listener to window 'orientationchange'.");
        } else {
            console.warn("Could not attach any reliable orientation change listeners.");
        }
    }

    // Perform an initial check when the script loads
    console.log("Performing initial orientation check.");
    handleOrientationChange();
}

function showAndroidToast(message) {
    if (typeof AndroidBridge !== "undefined" && AndroidBridge !== null) {
        // We are likely in the Android WebView with the bridge

        AndroidBridge.showToast(message);
        console.log("Called AndroidBridge.showToast('" + message + "')");
    } else {
        // We are likely NOT in the Android WebView, or bridge isn't ready
        //console.warn("AndroidBridge is not defined. Toast functionality skipped.");
        console.log(message);
        // Optionally, provide a fallback or do nothing silently:
        // alert("Toast feature is only available in the app.");
    }
}

function vibrateDevicePattern() {
    if (typeof AndroidBridge !== "undefined" && AndroidBridge !== null) {
        var pattern = "0,200,100,400";
        AndroidBridge.vibrateWithPattern(pattern);
        console.log("Called AndroidBridge.vibrateWithPattern('" + pattern + "')");
    } else {
        console.warn("AndroidBridge is not defined. Vibration functionality skipped.");
        // Optionally, hide the button or provide feedback:
        // document.getElementById('vibrateButton').style.display = 'none';
        // alert("Vibration is only available in the app.");
    }
}

// --- Global or within your game's asset loading scope ---
/*
---------------------------------------

load in sprites

---------------------------------------------------------------
*/
// --- Asset Loading ---

function loadSpriteSheet(callback) {
    spriteSheetImage = new Image();
    spriteSheetImage.onload = () => {
        spriteSheetLoaded = true;
        console.log("Sprite sheet loaded successfully.");
        if (callback) callback();
    };
    spriteSheetImage.onerror = () => {
        console.error("Failed to load sprite sheet.");
        spriteSheetLoaded = false;
    };
    spriteSheetImage.src = SPRITE_SHEET_SRC;
}

    // Call this during your game's initialization phase
    // loadSpriteSheet(() => {
    //    // Now you can safely spawn sprites
    //    spawnAnimatedSprite();
    // });




    // --- Somewhere accessible, perhaps near your activeGameElements array ---
    // const activeGameElements = []; // You already have this

// --- Somewhere accessible, perhaps near your activeGameElements array ---
// const activeGameElements = []; // You already have this

function spawnAnimatedSprite(animationName = "default_fall", initialX, initialY, customProps = {}) {
    // ... (existing code) ...
    if (!spriteSheetLoaded || !spriteSheetImage) {
        console.warn("Sprite sheet not loaded yet. Cannot spawn sprite.");
        return;
    }

    const animData = ANIMATIONS[animationName]; // Get the animation definition
    if (!animData) {
        console.warn(`Animation "${animationName}" not found.`);
        return;
    }
    if (!animData.frames || animData.frames.length === 0) {
        console.warn(`Animation "${animationName}" has no frames defined.`);
        return;
    }

    // --- This is the part you're focusing on ---
    const firstFrameData = animData.frames[0]; // Get data for the VERY FIRST frame of this animation
    const entityScale = customProps.scale || 1.0; // Default to 1 (no change)

    const newSprite = {
        type: 'sprite', // <--- ***** ADD THIS LINE *****
        // ... (other properties) ...
        image: spriteSheetImage,
        x: initialX !== undefined ? initialX : Math.random() * (canvas.width - (firstFrameData.sWidth * entityScale)),
        y: initialY !== undefined ? initialY : -(firstFrameData.sHeight * entityScale),

        // --- Animation Properties from the new structure ---
        animationName: animationName,
        currentFrameIndex: 0,
        totalFramesInAnimation: animData.frames.length,
        animationLoop: animData.loop !== undefined ? animData.loop : true,

        // DIMENSIONS IN NATIVE GAME WORLD
        // These are now scaled by entityScale
        width: firstFrameData.sWidth * entityScale,
        height: firstFrameData.sHeight * entityScale,
        spriteScale: entityScale, // Store the scale for potential future use or dynamic changes

        currentFrameDuration: firstFrameData.duration || animData.defaultAnimationSpeed || 100,
        lastFrameTime: 0,
        // ... (other properties like speed, direction) ...
        ...customProps
    };
    activeGameElements.push(newSprite);
    return newSprite;
}




class PicklePlayer extends Player {
    constructor(x, y, animationName, spriteScale) {
        super(x, y, animationName, spriteScale);
        this.entityType = "player_pickle";
    }

}

class EnemyPatrol extends Character {
    constructor(x, y, animationName, spriteScale, health, speed, patrolMinX, patrolMaxX) {
        super(x, y, animationName, spriteScale, health, speed);
        this.entityType = "enemy_chef_ketchup_patrol";
        this.direction.x = 1; // Start moving right
        this.patrolMinX = patrolMinX;//0 should be
        this.patrolMaxX = patrolMaxX;//nativeGameWidth should be
        if(debugDraw)console.log(`EnemyPatrol CONSTRUCTOR: Spawned with patrolMinX=${this.patrolMinX}, patrolMaxX=${this.patrolMaxX}`);
    }

    update(deltaTime, currentTime, activeGameElements) {
        super.update(deltaTime, currentTime, activeGameElements); // Update animation & basic movement




        // Patrol logic to change this.direction.x and this.facingDirection
        // const currentDrawWidth = this.width; // THIS LINE USES this.width

        // THIS IS THE LINE WHERE this.width IS FETCHED AND USED FOR BOUNDARY CHECKS
        const currentFrameDef = ANIMATIONS[this.animationName].frames[this.currentFrameIndex];

        // Ensure currentFrameDef and its properties are valid before using them
        if (!currentFrameDef || typeof currentFrameDef.sWidth === 'undefined') {
            console.error(`EnemyPatrol Update: Invalid currentFrameDef or sWidth for ${this.animationName}, index ${this.currentFrameIndex}. Entity: ${this.entityType}`);
            // Potentially skip boundary check this frame or use a default width
            return; // Or handle error more gracefully
        }

        const currentSpriteNativeWidth = currentFrameDef.sWidth * this.spriteScale; // THIS IS THE WIDTH OF THE CURRENT VISUAL FRAME
        if(debugDraw)console.log(
            `Boundary Check DEBUG: Chef X: ${this.x.toFixed(2)}, ` +
            `SpriteNativeWidth: ${currentSpriteNativeWidth.toFixed(2)}, ` +
            `CalculatedRightEdge: ${(this.x + currentSpriteNativeWidth).toFixed(2)}, ` +
            `patrolMinX: ${this.patrolMinX}, patrolMaxX: ${this.patrolMaxX}, ` +
            `sWidth: ${currentFrameDef.sWidth}, spriteScale: ${this.spriteScale}`
        );
        // RIGHT BOUNDARY CHECK:
        // Checks if the Chef's RIGHT EDGE (this.x + currentSpriteNativeWidth) has hit or passed nativeGameWidth
        if (this.direction.x > 0 && (this.x + currentSpriteNativeWidth) >= this.patrolMaxX) { // Assuming patrolMaxX is nativeGameWidth for full screen patrol
            this.x = this.patrolMaxX - currentSpriteNativeWidth; // Correctly repositions
            this.direction.x = -1;
            this.facingDirection = -1;
        }
        // LEFT BOUNDARY CHECK:
        // Checks if the Chef's LEFT EDGE (this.x) has hit or passed patrolMinX (usually 0)
        else if (this.direction.x < 0 && this.x <= this.patrolMinX) { // Assuming patrolMinX is 0 for full screen patrol
            this.x = this.patrolMinX; // Correctly repositions
            this.direction.x = 1;
            this.facingDirection = 1;
        }




        // Patrol logic to change this.direction.x and this.facingDirection
/*        const currentDrawWidth = this.width; // Assuming this.width is updated by Sprite class based on frame
        if (this.direction.x > 0 && (this.x + currentDrawWidth) >= this.patrolMaxX) {
            this.x = this.patrolMaxX - currentDrawWidth;
            this.direction.x = -1;
            this.facingDirection = -1;
        } else if (this.direction.x < 0 && this.x <= this.patrolMinX) {
            this.x = this.patrolMinX;
            this.direction.x = 1;
            this.facingDirection = 1;
        }*/
    }
}

class Scenery extends Sprite {
    constructor(x, y, animationName, spriteScale) {
        super(x, y, animationName, spriteScale);
        this.entityType = "scenery_rock"; // Or whatever
    }
    update(deltaTime, currentTime, activeGameElements) {
        super.update(deltaTime, currentTime, activeGameElements); // Just animation
        // Scenery typically doesn't move or have complex logic
    }
}




let chefKetchup; // Variable to hold our Chef Ketchup sprite instance

// Option A: A new function specific for spawning Chef Ketchup with a direction
// Option A: A new function specific for spawning Chef Ketchup with a direction AND SCALE
function spawnChefKetchupWalking(x, y, movementDirection = { x: 1, y: 0 }, desiredScale = 1.0) { // Added desiredScale, default to 1.0
    if(debugDraw)console.log(`Attempting to spawn Chef Ketchup at (${x},${y}) walking towards`, movementDirection, `with scale: ${desiredScale}`);
    // 1. Get the animation definition for the chef's current animation

    const animDef = ANIMATIONS[chef.animationName];

    const customChefProps = {
        entityType: 'enemy_chef_ketchup',
        health: 100,
        direction: movementDirection,
        speed: 50, // You had 5 here before, ensure it's a reasonable speed
        scale: desiredScale // **** THIS IS THE IMPORTANT PART ****
        // Pass the desiredScale to spawnAnimatedSprite
    };

    // 2. Get the specific frame definition (e.g., the first frame for initial placement)
    // It's good practice to check if the frames array exists and is not empty
    if (!animDef.frames || animDef.frames.length === 0) {
        console.error(`Animation "${chef.animationName}" has no frames defined! Cannot determine sHeight.`);
        // Handle error
        return null;
    }
    const currentFrameDef = animDef.frames[0]; // Or animDef.frames[chef.currentFrameIndex] if that exists

    // 3. Now you can access sHeight from the frame definition object
    const sHeight = currentFrameDef.sHeight;

    if (sHeight === undefined) {
        console.error(`sHeight is undefined for the first frame of animation "${chef.animationName}". Check ANIMATIONS object.`);
        // Handle error or use a default
        return null;
    }

    const dHeight = sHeight * chef.spriteScale;
    const desiredPadding = 10;
    // Spawn him in his walk-state (make sure "cheff_ketchup_walk" is defined in ANIMATIONS)
    chefKetchup = spawnAnimatedSprite("cheff_ketchup_walk", x, y, customChefProps);
    chef.y = nativeGameHeight - dHeight - desiredPadding;

    if (chefKetchup) {
        if(debugDraw)console.log("Chef Ketchup spawned walking!", chefKetchup);
        // You can also log the actual scale that got applied if spawnAnimatedSprite returns the object
        // console.log("Chef's actual scale after spawn:", chefKetchup.spriteScale);
        // Or if spawnAnimatedSprite modifies customChefProps, check there.
    } else {
        console.error("Failed to spawn Chef Ketchup for walking.");
    }
    return chefKetchup; // Return the instance if needed
}
function spawnPatrollingChef(startY, scale = 1.0, speed = 50) {
    // Determine spawn X (e.g., start at left edge)
    const startX = 0; // Or some padding from the edge


    // Initial movement direction (e.g., start moving right)
    const initialMovementDirection = { x: 1, y: 0 };

    const customChefProps = {
        entityType: 'enemy_chef_ketchup_patrol', // Make it specific if needed
        health: 100,
        direction: initialMovementDirection,
        speed: speed,
        scale: default_scale,
        facingDirection: 1, // Explicitly set initial facing direction
        // Add patrol boundaries if you want them specific to this chef
        // patrolMinX: 0,
        // patrolMaxX: nativeGameWidth, // Assuming nativeGameWidth is defined
    };
    // Use your existing spawn function
    let chef = spawnAnimatedSprite("cheff_ketchup_walk", startX, startY, customChefProps);


    // 1. Get the animation definition for the chef's current animation
    const animDef = ANIMATIONS[chef.animationName];

    if (!animDef) {
        console.error(`Animation "${chef.animationName}" not found! Cannot determine sHeight.`);
        // Handle error: maybe return, or use a default sHeight
        return null;
    }

    // 2. Get the specific frame definition (e.g., the first frame for initial placement)
    // It's good practice to check if the frames array exists and is not empty
    if (!animDef.frames || animDef.frames.length === 0) {
        console.error(`Animation "${chef.animationName}" has no frames defined! Cannot determine sHeight.`);
        // Handle error
        return null;
    }
    const currentFrameDef = animDef.frames[0]; // Or animDef.frames[chef.currentFrameIndex] if that exists

    // 3. Now you can access sHeight from the frame definition object
    const sHeight = currentFrameDef.sHeight;

    if (sHeight === undefined) {
        console.error(`sHeight is undefined for the first frame of animation "${chef.animationName}". Check ANIMATIONS object.`);
        // Handle error or use a default
        return null;
    }

    const dHeight = sHeight * chef.spriteScale;
    const desiredPadding = 10;


    if(debugDraw)console.log(`Spawning Chef for animation "${chef.animationName}" at y=${chef.y} (sHeight=${sHeight}, dHeight=${dHeight})`);

    chef.y = nativeGameHeight - dHeight - desiredPadding;
    if (chef) {
        if(debugDraw)console.log(`Patrolling Chef spawned at (${startX},${startY}), speed: ${speed}, scale: ${default_scale}`);
    } else {
        console.error("Failed to spawn Patrolling Chef.");
    }
    return chef;
}
function spawnIncompleteChef() { // Or whatever your function is named
    let chef = {
        // ... other properties (x, image, animationName, spriteScale: 1, etc.) ...
        entityType: 'player_chef', // or whatever identifies him
        // ...
    };

    // Calculate Y position
    const animationFrame = ANIMATIONS[chef.animationName].frames[0]; // Assuming frame 0 for initial height
    const sHeight = animationFrame.sHeight; // This should be 149 for chef
    const dHeight = sHeight * chef.spriteScale; // 149 * 1 = 149

    chef.y = nativeGameHeight - dHeight - startY; // Sets y to 561

    activeGameElements.push(chef);
    return chef;
}


function spawnTestRectangle() {//todo when bored convert to new way so it works
    const rectWidth = 50;  // Native game units
    const rectHeight = 50; // Native game units

    const newRect = {
        type: 'rectangle', // Make sure this matches the check in updateGameElements
        x: Math.random() * (nativeGameWidth - rectWidth), // Spawn within native width
        y: -rectHeight,    // Start just above the native game screen
        width: rectWidth,
        height: rectHeight,
        color: `rgb(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255})`,
        speed: 100,        // Native units per second
        direction: { x: 0, y: 1 }, // Moving straight down
        // No entityType needed unless you have other special logic for them
        // No animation properties needed
    };
    activeGameElements.push(newRect);
}
const LETTERBOX_COLOR = "#333333";
function drawGameElements(ctx) {
    // 1. CLEAR THE ENTIRE CANVAS
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. SAVE THE DEFAULT CANVAS STATE (IMPORTANT)
    ctx.save();

    // 3. APPLY GLOBAL SCENE/CAMERA TRANSFORMATIONS
    // These currentOffsetX, currentOffsetY, currentScale are calculated by resizeCanvasAndCalculateScale()
    ctx.translate(currentOffsetX, currentOffsetY);
    ctx.scale(currentScale, currentScale);

    // --- 4. DRAW THE NATIVE GAME AREA BORDER (DEBUG) ---
    // This is now drawn ONCE, within the globally transformed space.
    // (0,0) here refers to the top-left of your NATIVE game world, which is then scaled and positioned.

    // ----------------------------------------------------
    //debug box draw first so my game content can take prority over my border
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2 / currentScale;
    ctx.strokeRect(0, 0, nativeGameWidth, nativeGameHeight);
    // 5. DRAW ALL ACTIVE GAME ELEMENTS
    // Each element's draw method will operate within this globally transformed space.
    activeGameElements.forEach(element => {
        if (element.isActive && typeof element.draw === 'function') {
            // The element.draw(ctx) method should only care about drawing the element
            // at its own this.x, this.y (native coordinates) and with its own orientation.
            element.draw(ctx);
        }
    });
    // 6. RESTORE CANVAS TO DEFAULT STATE
    // This removes the global translate and scale, crucial if you draw UI elements
    // directly on the canvas afterward in screen coordinates.
    ctx.restore();

    // Optional: Draw UI elements that are NOT part of the game world (e.g., score, buttons)
    // These are drawn directly in canvas screen coordinates.
    // drawUI(ctx);
}



/*// At the start or in your resize handler //defined up top
let nativeGameWidth = 1280; // Your chosen native landscape width
let nativeGameHeight = 720; // Your chosen native landscape height
let nativeGameAspectRatio = nativeGameWidth / nativeGameHeight;

let currentScale = 1;
let currentOffsetX = 0;
let currentOffsetY = 0;*/

function resizeCanvasAndCalculateScale() {
    // Set the drawing surface dimensions
    canvas.width = window.innerWidth;  // e.g., 923
    canvas.height = window.innerHeight; // e.g., 363
    if(debugDraw)showAndroidToast(`Canvas attributes set to W=${canvas.width}, H=${canvas.height}`);

    // IMPORTANT: Ensure CSS display size matches attribute size
    // to prevent browser stretching.
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    // (Or use CSS to make the canvas fill its container, and then set
    // canvas.width/height to container.clientWidth/clientHeight)

    // ... rest of your scaling calculations for currentScale, currentOffsetX, currentOffsetY ...
    // These calculations will now use the 923x363 dimensions.
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if(debugDraw)showAndroidToast(`PHONE_SCALE_DEBUG: Canvas W=${canvas.width}, H=${canvas.height}`)
    let screenAspectRatio = canvas.width / canvas.height;

    if(debugDraw)console.log(`PHONE_SCALE_DEBUG: Screen Aspect Ratio=${screenAspectRatio}, Native Aspect Ratio=${nativeGameAspectRatio}`);
    if(debugDraw)showAndroidToast(`aspect ratio: ${screenAspectRatio}`)

    if (screenAspectRatio > nativeGameAspectRatio) {
        // Screen is WIDER than the game's native aspect ratio (pillarbox)
        // Scale is based on height
        currentScale = canvas.height / nativeGameHeight;
        currentOffsetX = (canvas.width - (nativeGameWidth * currentScale)) / 2;
        currentOffsetY = 0;
        if(debugDraw)showAndroidToast(`PHONE_SCALE_DEBUG: Pillarbox. Scale by H. currentScale=${currentScale}`);
    } else {
        // Screen is TALLER/NARROWER than the game's native aspect ratio (letterbox)
        // Scale is based on width
        currentScale = canvas.width / nativeGameWidth;
        currentOffsetX = 0;
        currentOffsetY = (canvas.height - (nativeGameHeight * currentScale)) / 2;
        if(debugDraw)showAndroidToast(`PHONE_SCALE_DEBUG: Letterbox. Scale by W. currentScale=${currentScale}`);
    }
    if(debugDraw)console.log(`nativeGameAspectRatio = ${nativeGameAspectRatio} screen aspect ratio = ${screenAspectRatio}` );
    if(debugDraw)console.log(`PHONE_SCALE_DEBUG: Final - currentScale=${currentScale}, cOffsetX=${currentOffsetX}, cOffsetY=${currentOffsetY}`);
}


// Ensure 'canvas' is defined (e.g., const canvas = document.getElementById('gameArea');)
if (canvas) {
    // Call it once an initial page load to set the size correctly from the start
    resizeCanvasAndCalculateScale();

    // Add an event listener to call resizeCanvasAndCalculateScale whenever the window is resized
    window.addEventListener('resize', resizeCanvasAndCalculateScale);
} else {
    console.error("Canvas element not found when trying to set up resize handling.");
}
//// --- DOMContentLoaded Event Listener ---

document.addEventListener('DOMContentLoaded', () => {


            //load in pause ui

            // Get references to your new UI elements.. refetch them if needed

            // most importantly liveGameArea = document.getElementById('gameArea'); // Re-fetch
            welcomeBackgroundImageContainer = document.getElementById('welcomeBackgroundImageContainer'); // Assuming you have a container for the welcome background image
            liveGameArea = document.getElementById('gameArea'); // Re-fetch the game area SVG element
            quitToMenuButton = document.getElementById('quitToMenuButton'); // Assuming you have a quit button in the pause menu
            controlsOverlay = document.getElementById('gameControlsOverlay'); // Assuming you have a controls overlay element
            pauseButton = document.getElementById('pauseButton');
            welcomeScreen = document.getElementById('welcomeScreenOverlay');
            pauseMenuOverlay = document.getElementById('pauseMenuOverlay');
            resumeButton = document.getElementById('resumeButton');
            settingsButton = document.getElementById('settingsButton');
            settingsButtonWelcome = document.getElementById('settingsButtonWelcome');
            settingsOverlay = document.getElementById('settingsOverlay');
            closeSettingsButton = document.getElementById('closeSettingsButton');
            startButton = document.getElementById('startGameButton');

            if (startButton) {
                startButton.addEventListener('click', () => {
                    if (animationFrameId) {
                        console.log("Game is already running, cannot start again.");
                    } else {
                        console.log("Starting new game.");
                        //initializeGame(); // Reset game state
                        hideWelcomeScreen();
                        showGameControls();
                        hidePauseMenu(); // Hide pause menu if visible
                        startGame(); // Start the game loop
                    }
                });
            }
            // ... get other buttons from pause menu as needed ...

            // --- Event Listeners ---

            if (pauseButton) {
                //pause button click handler
                pauseButton.addEventListener('click', () => {
                    if (animationFrameId && (gamePaused === false)) {// running, so we can pause

                        console.log("Pause button clicked, pausing game.");
                        pauseGame(); // Call the pause function
                    } else {

                    }
                });
            }

            if (resumeButton) {
                resumeButton.addEventListener('click', () => {
                    resumeButtonFunc();// Call the resume function

                });
            }

            if (quitToMenuButton) {
                quitToMenuButton.addEventListener('click', () => {

                    if(gamePaused === true){
                        console.log("Quit to menu button clicked, stopping game.");
                        console.log("Stop button clicked, stopping game.");
                        stopGame(); // Call the stop function
                        hideGameControls();
                        hidePauseMenu(); // Hide pause menu if visible
                        showWelcomeScreen(); // Show welcome screen
                        // Reset game state
                    }
                });
            }
            // Option 2: Define the designed dimensions
            const NATIVE_SVG_WIDTH = 1280; // The width your SVG was designed at
            const NATIVE_SVG_HEIGHT = 720; // The height your SVG was designed at
            const PADDING_VALUE = 5; // 5px padding top and bottom


    // At the top of your script, get the element


    // --- Event Listeners for showing/hiding ---
    function openSettings() {
        loadSettings(); // Load current settings values (doesn't populate UI)
        populateSettingsUI(); // Populate UI elements with loaded settings
        settingsOverlay.classList.add('visible'); // Use this to trigger CSS transition
        console.log("Settings button clicked, showing settings overlay.");
    }

    if (settingsButton && settingsOverlay) {
        settingsButton.addEventListener('click', openSettings);
    }
    if (settingsButtonWelcome && settingsOverlay) {
        settingsButtonWelcome.addEventListener('click', openSettings);
    }

    if (closeSettingsButton && settingsOverlay) {
        closeSettingsButton.addEventListener('click', () => {
            updateSettingsFromUI(); // Reads from UI into JS settings object
            saveSettings();       // Saves JS settings object to localStorage
            // applyGameSettings(); // Applies settings to game (e.g., volume). Optional here if only saving.
            settingsOverlay.classList.remove('visible'); // Hide it
        });
    }


            //settings button click handler

            // --- Event Listeners for showing/hiding ---
            if (settingsButton && settingsOverlay) {
                settingsButton.addEventListener('click', () => {
                    loadSettings(); // Load current settings into UI elements
                    settingsOverlay.classList.remove('hidden');
                    // If you were using display: none; you'd do:
                    populateSettingsUI();
                    //settingsOverlay.style.display = 'flex'; // or 'block' depending on its default display
                    console.log("Settings button clicked, showing settings overlay.");
                });
            }

            if (closeSettingsButton && settingsOverlay) {
                closeSettingsButton.addEventListener('click', () => {
                    updateSettingsFromUI();
                    saveSettings();
                    applyGameSettings();
                    settingsOverlay.classList.add('hidden');
                });
            }

            addListenersForSettingsUI();
            initOrientationDetection();
            resizeCanvasAndCalculateScale();
            loadSpriteSheet(() => {
                console.log("Assets loaded, ready to start or show main menu.");

            });
        });




