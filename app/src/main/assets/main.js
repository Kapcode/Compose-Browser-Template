import * as globals from './globals.js'; // Assuming globals.js now correctly defines its exports
import * as assetManager from './assetManager.js';
import * as input from './input.js';
import { GameObject } from './GameObject.js';
import { Sprite } from './Sprite.js';
import { Player } from './Player.js';
import { Character } from './Character.js';
import { handleTilemapCollisions, getTileIdAtTileCoords, TILE_SIZE, TILE_PROPERTIES } from './tileMapManagement.js';
import { setVolume, playPooledSound } from './audioManagement.js';
import { loadSettings, loadProgress, saveProgress, saveSettings, updateSettingsFromUI, applyGameSettings, applyGameProgress, populateSettingsUI, addListenersForSettingsUI } from './settingsManagement.js';
import { pPickle1, createPicklePlayerInstance } from './PickleMan.js';
import { eChef1, createPatrolingChef } from './ChefEnemy.js';
import * as gameState from './gameState.js'
// ---- IMMEDIATELY LOG THESE VALUES ----
console.log("-------------------------------------------");
console.log("[Main.js] AT VERY TOP OF MAIN.JS:");
console.log("[Main.js] typeof globals:", typeof globals);
console.log("[Main.js] globals object:", globals); // This will show all exported members from globals.js
console.log("[Main.js] typeof globals.SPRITE_SHEET_PATH:", typeof globals.SPRITE_SHEET_PATH);
console.log("[Main.js] Value of globals.SPRITE_SHEET_PATH:", globals.SPRITE_SHEET_PATH);
console.log("[Main.js] Value of globals.MASTER_SPRITE_SHEET_KEY:", globals.MASTER_SPRITE_SHEET_KEY);
console.log("-------------------------------------------");


//canvas
export let canvas = null; // Changed from top-level getElementById
export let ctx = null;    // Changed from top-level getContext
let activeGameElements = []; // Initialize as an empty array
//game area
let gameAreaViewBoxWidth = 0;
let gameAreaViewBoxHeight = 0;
let liveGameArea = null; // This will also be the canvas

export let debugDraw = true;

//game state


export let animationFrameId = null; // ID from requestAnimationFrame

export const gameStateLogs = false;


// --- Game Loop Timing ---
export let gameTimeAccumulator = 0;
export let timeWhenPauseActuallyStarted = 0;
export let lastTimestamp = 0;
export let lastSpawnTime = 0;
export let spawnCounter = 0;
export const SPAWN_INTERVAL_FRAMES = 120; // Example
//score
export let score = 0;



//assets/////////////////////////////////////////////////////
let assetsToLoadCount = 0; // <<<< DECLARED HERE (Correct) ..PalmFace
let assetsSuccessfullyLoadedCount = 0;
let assetsFailedToLoadCount = 0;

function assetLoaded(err, key) { // A general callback for each loaded asset
    if (err) {
        console.error(`Error loading asset ${key}:`, err.message);
    } else {
        console.log(`Asset ${key} successfully processed in main.`);
    }
    assetsLoaded++;
    if (assetsLoaded === assetsToLoad) {
        startGame(); // Or whatever your function is to proceed after all assets are loaded
    }
}

// UI elements cache
let uiElements = {
    welcomeScreen: null,
    startGameButton: null,
    loadingMessage: null,
    gameLoadError: null
    // Add other UI elements if you have them, e.g., scoreDisplay, healthBar
};

// main.js (continued)
// assetManager.loadImage will execute for each asset. .. call this every time you load an asset
function singleAssetProcessed(key, error, image) { // key, error, image are provided by assetManager.loadImage
    console.log(`[Main.js] singleAssetProcessed received for key: "${key}". Error: ${error ? error.message : 'No Error'}`);

    if (error) {
        assetsFailedToLoadCount++;
        console.error(`[Main.js] Failed to load asset: "${key}". Error: ${error.message}. Total FAILED: ${assetsFailedToLoadCount}`);
        // Optionally, update UI to show specific asset failure if you want that detail
    } else {
        assetsSuccessfullyLoadedCount++;
        console.log(`[Main.js] Successfully loaded asset: "${key}". Image object:`, image, `Total SUCCESSFUL: ${assetsSuccessfullyLoadedCount}`);
    }

    // Check if ALL assets (from the manifest) have been processed
    if ((assetsSuccessfullyLoadedCount + assetsFailedToLoadCount) === assetsToLoadCount) {
        console.log(`[Main.js] All ${assetsToLoadCount} assets processed. Successful: ${assetsSuccessfullyLoadedCount}, Failed: ${assetsFailedToLoadCount}`);
        proceedToGameStartConditionCheck(); // Now decide what to do (enable start button or show error)
    }
}

//This function runs after all assets in the manifest have been attempted. It decides if the game can proceed.
//runs after every asset has been loaded, can the game start?
function proceedToGameStartConditionCheck() {
    if (uiElements.loadingMessage) {
        uiElements.loadingMessage.style.display = 'none'; // Hide "Loading assets..." message
    }

    if (assetsFailedToLoadCount > 0) {
        // Handle critical asset load failure
        const errorMessage = `Failed to load ${assetsFailedToLoadCount} essential game file(s). Please refresh to try again.`;
        console.error(`CRITICAL: ${errorMessage}`);
        displayAssetLoadError(errorMessage); // Show this error on the page
        if (uiElements.startGameButton) {
            uiElements.startGameButton.disabled = true; // Keep start button disabled
            uiElements.startGameButton.textContent = "Error Loading";
        }
    } else {
        // ALL essential assets loaded SUCCESSFULLY
        console.log("All essential assets loaded successfully! Ready for user to start.");
        if (uiElements.gameLoadError) {
            uiElements.gameLoadError.style.display = 'none'; // Hide any previous error message
        }
        showWelcomeScreen(); // Make sure your welcome screen with the start button is visible
        if (uiElements.startGameButton) {
            uiElements.startGameButton.disabled = false; // ENABLE the start button
            uiElements.startGameButton.textContent = "Start Game"; // Set appropriate text
            console.log("Start button should now be enabled.");
        }
    }
}

function displayAssetLoadError(message) {
    if (uiElements.gameLoadError) {
        uiElements.gameLoadError.textContent = message;
        uiElements.gameLoadError.style.display = 'block'; // Or 'flex', depending on your CSS
        console.error("DISPLAYING ASSET LOAD ERROR ON PAGE:", message);
    } else {
        console.error("Could not display asset load error on page, uiElements.gameLoadError not found. Message:", message);
        alert("Error loading game assets: " + message); // Fallback
    }
}

function handleGameResumeAfterSystemPause() {
    const timeNow = performance.now();
    console.log("Game resuming after system interruption (e.g., tab became visible).");
   let lastTime = performance.now(); console.log("[gameLoop RESUME] lastTime reset to:", lastTime);

    lastTimestamp = timeNow;
    gameTimeAccumulator = 0;
    lastSpawnTime = timeNow;
    // Ensure game is unpaused
    setPauseState(false);
}

document.addEventListener("visibilitychange", () => {
    if (gameState.gameStopped) {
        return; // If game is fully stopped, visibility changes don't matter for game logic
    }

    if (document.hidden) {
        if (!gameState.gamePaused) {
            console.log("Page hidden, auto-pausing game logic.");
            setPauseState(true);
            console.log("Game auto-paused due to page visibility change.");
        }
    } else {
        console.log("Page became visible.");
        handleGameResumeAfterSystemPause();
    }
});

function setPauseState(pause) {

    gameState.setGamePaused(pause);

    if (pause) {

        if (gameStateLogs) console.log("Game paused by gameState.JS.");
    } else {
        const timeNow = performance.now();
        const durationOfPause = timeWhenPauseActuallyStarted > 0 ? (timeNow - timeWhenPauseActuallyStarted) / 1000 : 0;
        if (gameStateLogs) console.log(`Game unpaused. Was paused for approx ${durationOfPause.toFixed(2)} seconds.`);

        lastTimestamp = timeNow;
        gameTimeAccumulator = 0;
        lastSpawnTime = timeNow;
        timeWhenPauseActuallyStarted = 0;
    }
}



const MAX_DELTA_TIME = 0.01666666667; // Approx 60 FPS fixed time step

function gameLoop(currentTimestamp) {
    if (!canvas || !ctx) { // Ensure canvas and context are available
        console.error("Canvas or context not initialized. Stopping game loop.");
        gameState.setGameStopped(true);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!liveGameArea) { // liveGameArea is the canvas
        console.error("CRITICAL: liveGameArea (canvas) not found! Stopping loop.");
        gameState.setGameStopped(true);
        return;
    }

    if (gameState.gameStopped) {
        if (gameStateLogs) console.log("Game is stopped. Game loop terminated.");
        return;
    }

    if (lastTimestamp === 0) {
        lastTimestamp = currentTimestamp;
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    let deltaTime = (currentTimestamp - lastTimestamp) / 1000;

    if (gameState.gamePaused) {
        if (gameStateLogs) console.log("GameLoop: Game is paused. Skipping updates.");
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    lastTimestamp = currentTimestamp;

    if (deltaTime <= 0) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    const MAX_POSSIBLE_DELTA_TIME = 0.5;
    if (deltaTime > MAX_POSSIBLE_DELTA_TIME) {
        console.warn(`GameLoop: Large deltaTime (${deltaTime}) capped to ${MAX_POSSIBLE_DELTA_TIME}.`);
        deltaTime = MAX_POSSIBLE_DELTA_TIME;
    }

    gameTimeAccumulator += deltaTime;

    while (gameTimeAccumulator >= MAX_DELTA_TIME) {
        if (!gameState.gamePaused) {
            gameLogic(); // Removed liveGameArea argument, it uses module-scoped canvas
            updateGameElements(MAX_DELTA_TIME, currentTimestamp);
        }
        gameTimeAccumulator -= MAX_DELTA_TIME;
    }

    if (!gameState.gamePaused) {
        drawGameElements(ctx);
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function gameLogic() {
    spawnCounter++;
    if (spawnCounter >= SPAWN_INTERVAL_FRAMES) { // Assuming SPAWN_INTERVAL_FRAMES is in globals
        spawnTestRectangle();
        spawnCounter = 0;
    }
    // console.log(`Current score: ${score}`);
}

function startGame() {
    showGameControlsOverlay();
    console.log("%c[Main.js] startGame() CALLED by button click!", "color: green; font-weight:bold;");

    hideWelcomeScreen(); // Hide the menu/welcome screen
    if (uiElements.gameLoadError) { // Hide any error messages if they were shown
        uiElements.gameLoadError.style.display = 'none';
    }

    playPooledSound('jump', 'sounds/gameOver.wav'); // Assuming this sound ID is defined elsewhere or in HTML
    gameState.setGamePaused(false);
    if (animationFrameId === null) {
        resizeCanvasAndCalculateScale();
        hidePauseMenu();
        console.log("Starting new game.");
        score = 0;
        initializeGame();
        input.initInput();
        console.log("Starting game loop.");
        lastTimestamp = performance.now();
        animationFrameId = requestAnimationFrame((timestamp) => gameLoop(timestamp)); // Removed liveGameArea argument
        gameState.setGameStopped(false);
    } else {
        console.log("Game is already running, cannot start again.");
    }





    console.log(`%c[Main.js startGame] AFTER initializeGame, pPickle1.image is:`, 'color: teal; font-weight: bold;', pPickle1 ? pPickle1.image : "pPickle1 is null");

    createPicklePlayerInstance(100,100,"pickle_player_idle",globals.default_scale,100,100);//x, y, animationName, spriteScale

    initializeGame(pPickle1); // Pass playerInstance if initializeGame needs it to add to activeGameElements

    // --- END OF YOUR EXISTING GAME INITIALIZATION ---

    console.log(`[Main.js startGame] Game initialized. Starting game loop.`);
    if (!animationFrameId) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    createPatrolingChef(200,
        globals.nativeGameHeight - 150,
        "cheff_ketchup_walk",
        globals.default_scale,
        50,
        80,
        0,
        globals.nativeGameWidth / 2);//x,y,animationName,spriteScale,health,speed,patrolMinX,patrolMaxX
    // Add your main Pickle player to the game elements
    if (pPickle1) { // Ensure it's defined
        // You might need to set properties on pPickle1 if not set in constructor,
        // e.g., pPickle1.speed = 200; pPickle1.width = 50; pPickle1.height = 80;
        // Make sure these properties exist on the pPickle1 object/class instance.
        //if (typeof pPickle1.speed === 'undefined') pPickle1.speed = 100; // Default speed
        //if (typeof pPickle1.width === 'undefined') pPickle1.width = 32;   // Example default width
        //if (typeof pPickle1.height === 'undefined') pPickle1.height = 48; // Example default height
        activeGameElements.push(pPickle1);
    }
    if(eChef1){
        activeGameElements.push(eChef1);
    }

}







// You'll also need initializeGame and gameLoop from your existing code
// For example:
function initializeGame(player) { // Modified to accept player
    loadSettings();
    loadProgress();
    lastSpawnTime = performance.now();
    activeGameElements = []; // Clear previous elements
    if (player) {
        activeGameElements.push(player); // Add the newly created player
    }
    // Add other initial game elements like enemies if they are created in startGame
    // e.g., if eChef1 is created in startGame: activeGameElements.push(eChef1);
    console.log("[Main.js] initializeGame done. Active elements:", activeGameElements);
}

function updateGameElements(deltaTime, currentTime) {
    let elementsToKeep = [];
    activeGameElements.forEach(element => {
        if (element.isActive) {
            element.update(deltaTime, currentTime, activeGameElements);
            if (element.isActive) {
                elementsToKeep.push(element);
            }
        }
    });
    activeGameElements = elementsToKeep;
}


function removeInputListeners() {
    input.removeInputListeners();
}


function stopGame() {
    if (animationFrameId) {
        gameState.setGameStopped(true);
        gameState.setGamePaused(false);
        console.log("Stopping game loop.");
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log("Game loop stopped.");
    }

    removeInputListeners();//where is this//todo remove input listeners

    activeGameElements.forEach(elem => {
        if (elem.element) {
            // elem.element.removeEventListener('click', handleWordBoxClick); // Example
            elem.element = null;
        }
    });
    activeGameElements = [];
    lastTimestamp = 0;
}

function pauseGame() {
    // timeWhenPauseActuallyStarted = performance.now(); // This is now set in setPauseState
    if (!animationFrameId) {
        console.log("Game is not running, cannot pause.");
        return;
    }
    if (gameState.gamePaused) {
        console.log("Game is already paused.");
        return;
    }

    setPauseState(true); // Centralize pause logic
    // cancelAnimationFrame(animationFrameId); // setPauseState doesn't cancel, gameLoop handles paused state
    // animationFrameId = null; // Don't nullify if gameLoop keeps running for pause screen
    console.log("Game paused by pauseGame function.");


    if (globals.pauseMenuOverlay) { // Assuming pauseMenuOverlay is fetched and assigned to globals
        globals.pauseMenuOverlay.style.display = 'flex';
    }
}
function showGameControlsOverlay() {//has pause button... opens menu with settings/quite to menu
    document.getElementById('gameControlsOverlay').classList.add('visible');
}
function hideGameControlsOverlay() {
    document.getElementById('gameControlsOverlay').classList.remove('visible');
}

function hidePauseMenu() {
    if (globals.pauseMenuOverlay) {
        globals.pauseMenuOverlay.style.display = 'none';
    }
}

function resumeButtonFunc() {
    if (gameState.gamePaused) {
        console.log("Resuming game from pause.");
        setPauseState(false); // Centralize unpause logic
        // The following lines are now handled by setPauseState(false)
        // const pauseDuration = performance.now() - timeWhenPauseActuallyStarted;
        // lastSpawnTime += pauseDuration;
        // lastTimestamp = performance.now();
        // animationFrameId = requestAnimationFrame((timestamp) => gameLoop(timestamp));

        hidePauseMenu();
    } else {
        // This case seems odd for a resume button. Typically it wouldn't start a new game.
        // If it's a "Start/Resume" button, the logic might be different.
        console.log("Game not paused, or starting new game (from resumeButtonFunc).");
        initializeGame();
        startGame();
    }
}


function showWelcomeScreen() {
    if (uiElements.welcomeScreen) {
        uiElements.welcomeScreen.style.display = 'flex'; // Or 'block', match your CSS
        console.log("Showing welcome screen.");
    } else {
        console.warn("Welcome screen UI element not found.");
    }
}

function hideWelcomeScreen() {
    if (uiElements.welcomeScreen) {
        uiElements.welcomeScreen.style.display = 'none';
        console.log("Hiding welcome screen.");
    } else {
        console.warn("Welcome screen UI element not found.");
    }
}



function handleOrientationChange() {
    let currentOrientation = '';
    // ... (your existing orientation detection logic, no changes needed for globals) ...
    // --- Your Game's Logic for Orientation ---
    if (currentOrientation.includes('landscape')) {
        console.warn("Device is in Landscape. Game designed for Portrait.");
        if (globals.rotateMessageOverlay) {
            globals.rotateMessageOverlay.innerHTML = "<p>This experience is best in Portrait mode. Please rotate your device.</p>";
            globals.rotateMessageOverlay.style.display = 'flex';
        }
        // if (!gamePaused) {
        //    setPauseState(true);
        // }
    } else if (currentOrientation.includes('portrait')) {
        console.log("Device is in Portrait. Correct orientation for the game.");
        if (globals.rotateMessageOverlay) {
            globals.rotateMessageOverlay.style.display = 'none';
        }
        // if (wasPausedByOrientation && gamePaused) { // Need wasPausedByOrientation flag
        //    setPauseState(false);
        // }
    } else {
        console.log("Orientation is unknown or not strictly portrait/landscape.");
        if (globals.rotateMessageOverlay) {
            globals.rotateMessageOverlay.style.display = 'none';
        }
    }
}

function initOrientationDetection() {
    console.log("Initializing JavaScript orientation detection...");
    // ... (your existing orientation init logic, no changes needed for globals) ...
    handleOrientationChange();
}

function showAndroidToast(message) {
    if (typeof AndroidBridge !== "undefined" && AndroidBridge !== null) {
        AndroidBridge.showToast(message);
        console.log("Called AndroidBridge.showToast('" + message + "')");
    } else {
        console.log(message); // Fallback to console
    }
}

function vibrateDevicePattern() {
    if (typeof AndroidBridge !== "undefined" && AndroidBridge !== null) {
        var pattern = "0,200,100,400"; // This could be a global const
        AndroidBridge.vibrateWithPattern(pattern);
        console.log("Called AndroidBridge.vibrateWithPattern('" + pattern + "')");
    } else {
        console.warn("AndroidBridge is not defined. Vibration functionality skipped.");
    }
}



function spawnAnimatedSprite(animationName = "default_fall", initialX, initialY, customProps = {}) {
    if (!isSpriteSheetLoaded() || !getSpriteSheetImage()) { // Use getters from assetManager
        console.warn("Sprite sheet not loaded yet (checked via assetManager). Cannot spawn sprite.");
        return;
    }

    const animData = globals.ANIMATIONS[animationName];
    if (!animData) {
        console.warn(`Animation "${animationName}" not found.`);
        return;
    }
    if (!animData.frames || animData.frames.length === 0) {
        console.warn(`Animation "${animationName}" has no frames defined.`);
        return;
    }

    const firstFrameData = animData.frames[0];
    const entityScale = customProps.scale || 1.0;

    const newSprite = {
        type: 'sprite',
        image: globals.getSpriteSheetImage(),
        x: initialX !== undefined ? initialX : Math.random() * (globals.nativeGameWidth - (firstFrameData.sWidth * entityScale)),
        y: initialY !== undefined ? initialY : -(firstFrameData.sHeight * entityScale),
        animationName: animationName,
        currentFrameIndex: 0,
        totalFramesInAnimation: animData.frames.length,
        animationLoop: animData.loop !== undefined ? animData.loop : true,
        width: firstFrameData.sWidth * entityScale,
        height: firstFrameData.sHeight * entityScale,
        spriteScale: entityScale,
        currentFrameDuration: firstFrameData.duration || animData.defaultAnimationSpeed || 100,
        lastFrameTime: 0,
        ...customProps
    };
    activeGameElements.push(newSprite); // Add to activeGameElements
    return newSprite;
}





class Scenery extends Sprite {
    constructor(x, y, animationName, spriteScale) {
        super(x, y, animationName, spriteScale); // Assumes Sprite uses globals.ANIMATIONS
        this.entityType = "scenery_rock";
    }
    update(deltaTime, currentTime, activeGameElementsRef) {
        super.update(deltaTime, currentTime, activeGameElementsRef);
    }
}

let chefKetchup; // This variable's scope and purpose needs review

function spawnChefKetchupWalking(x, y, movementDirection = { x: 1, y: 0 }, desiredScale = 1.0) {
    if (globals.debugDraw) console.log(`Attempting to spawn Chef Ketchup at (${x},${y}) walking towards`, movementDirection, `with scale: ${desiredScale}`);

    // !!! 'chef' is used here but not defined in this scope. Needs to be passed or defined. !!!
    // Assuming 'chef' was meant to be the 'chefKetchup' instance being created.
    // This function seems to intend to create and configure chefKetchup.

    const animationToSpawn = "cheff_ketchup_walk"; // Explicitly state the animation
    const animDef = globals.ANIMATIONS[animationToSpawn];

    if (!animDef || !animDef.frames || animDef.frames.length === 0) {
        console.error(`Animation "${animationToSpawn}" has no frames or is undefined! Cannot determine sHeight.`);
        return null;
    }

    const customChefProps = {
        entityType: 'enemy_chef_ketchup',
        health: 100,
        direction: movementDirection,
        speed: 50,
        scale: desiredScale
    };

    chefKetchup = spawnAnimatedSprite(animationToSpawn, x, y, customChefProps); // Assign to chefKetchup

    if (chefKetchup) {
        const firstFrameDef = animDef.frames[0];
        const sHeight = firstFrameDef.sHeight;
        if (sHeight === undefined) {
            console.error(`sHeight is undefined for the first frame of animation "${animationToSpawn}".`);
            return chefKetchup; // Return partially initialized chef
        }
        const dHeight = sHeight * chefKetchup.spriteScale;
        const desiredPadding = 10;
        chefKetchup.y = globals.nativeGameHeight - dHeight - desiredPadding; // Use globals.nativeGameHeight

        if (globals.debugDraw) console.log("Chef Ketchup spawned walking!", chefKetchup);
    } else {
        console.error("Failed to spawn Chef Ketchup for walking.");
    }
    return chefKetchup;
}

function spawnPatrollingChef(startY, scale = 1.0, speed = 50) {
    const startX = 0;
    const initialMovementDirection = { x: 1, y: 0 };
    const animationToSpawn = "cheff_ketchup_walk"; // Chef's patrol animation

    const customChefProps = {
        entityType: 'enemy_chef_ketchup_patrol',
        health: 100,
        direction: initialMovementDirection,
        speed: speed,
        scale: globals.default_scale, // Use scale from globals.js
        facingDirection: 1,
        // patrolMinX: 0, // These would be set if EnemyPatrol class constructor doesn't handle defaults
        // patrolMaxX: globals.nativeGameWidth,
    };

    let chef = spawnAnimatedSprite(animationToSpawn, startX, startY, customChefProps);

    if (chef) {
        const animDef = globals.ANIMATIONS[chef.animationName];
        if (!animDef || !animDef.frames || animDef.frames.length === 0) {
            console.error(`Animation "${chef.animationName}" has no frames! Cannot adjust Y.`);
            return chef; // Return partially initialized
        }
        const currentFrameDef = animDef.frames[0];
        const sHeight = currentFrameDef.sHeight;
        if (sHeight === undefined) {
            console.error(`sHeight is undefined for animation "${chef.animationName}".`);
            return chef; // Return partially initialized
        }
        const dHeight = sHeight * chef.spriteScale;
        const desiredPadding = 10;
        chef.y = globals.nativeGameHeight - dHeight - desiredPadding; // Use globals.nativeGameHeight

        if (globals.debugDraw) console.log(`Patrolling Chef spawned at (${startX},${chef.y}), speed: ${speed}, scale: ${globals.default_scale}`);
    } else {
        console.error("Failed to spawn Patrolling Chef.");
    }
    return chef;
}

function spawnIncompleteChef(startX, initialY) { // Added startX, initialY parameters
    // !!! 'startY' was used but not defined. Replaced with initialY. 'chef' also undeclared.
    let tempChef = { // Temporary object to get animation details
        animationName: "cheff_ketchup_walk", // Example, specify the animation
        spriteScale: globals.default_scale // Or a specific scale
    };

    const animationFrame = globals.ANIMATIONS[tempChef.animationName].frames[0];
    const sHeight = animationFrame.sHeight;
    const dHeight = sHeight * tempChef.spriteScale;

    // This function seems incomplete as it doesn't fully create a sprite object to push
    // For now, it calculates a Y. If it's meant to spawn a full sprite, it needs more.
    let calculatedY = globals.nativeGameHeight - dHeight - initialY;
    if (globals.debugDraw) console.log(`Calculated Y for incomplete chef: ${calculatedY}`);

    // To actually spawn it, you'd do something like:
    // return spawnAnimatedSprite(tempChef.animationName, startX, calculatedY, { scale: tempChef.spriteScale, entityType: 'player_chef' });
    // For now, returning nothing as its original intent was unclear beyond the Y calculation.
}


function spawnTestRectangle() {
    const rectWidth = 50;
    const rectHeight = 50;

    const newRect = {
        type: 'rectangle',
        x: Math.random() * (globals.nativeGameWidth - rectWidth),
        y: -rectHeight,
        width: rectWidth,
        height: rectHeight,
        color: `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`,
        speed: 100,
        direction: { x: 0, y: 1 },
        isActive: true, // Make sure spawned elements are active
        draw: function(ctx) { // Add a draw method for simple objects
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        },
        update: function(deltaTime) { // Add an update method
            this.y += this.speed * this.direction.y * deltaTime;
            if (this.y > globals.nativeGameHeight) {
                this.isActive = false;
            }
        }
    };
    activeGameElements.push(newRect);
}

const LETTERBOX_COLOR = "#333333"; // This could be in globals.js

function drawGameElements(passedCtx) {
    // --- DRAWING PHASE ---
    if (passedCtx && canvas) {
        // === THIS IS WHERE YOUR SNIPPET GOES ===
        const scaleToUse = globals.sceneState.currentScale;
        const offsetXToUse = globals.sceneState.currentOffsetX;
        const offsetYToUse = globals.sceneState.currentOffsetY;

        if (scaleToUse === undefined || offsetXToUse === undefined || offsetYToUse === undefined || isNaN(scaleToUse) || scaleToUse <= 0) {
            console.error("[GameLoop Draw] Invalid sceneState transform values. Scale:", scaleToUse, "OffsetX:", offsetXToUse, "OffsetY:", offsetYToUse);
            // Potentially skip drawing for this frame or try to recover
        } else {
            passedCtx.fillStyle = globals.LETTERBOX_COLOR || '#000';
            passedCtx.fillRect(0, 0, canvas.width, canvas.height);

            passedCtx.save();
            passedCtx.translate(offsetXToUse, offsetYToUse);
            passedCtx.scale(scaleToUse, scaleToUse); // Corrected typo

            if (globals.debugDraw !== false) {
                passedCtx.strokeStyle = 'red';
                passedCtx.lineWidth = 2 / scaleToUse;
                passedCtx.strokeRect(0, 0, globals.nativeGameWidth, globals.nativeGameHeight);
            }

            activeGameElements.forEach(element => {
                if (element.isActive && typeof element.draw === 'function') {
                    element.draw(passedCtx);
                }
            });
            passedCtx.restore();
            // drawFixedUI(passedCtx); // For UI elements not affected by game scale/offset
        }
        // =====================================
    }

    // drawUI(passedCtx); // If you have separate UI drawing
}

function resizeCanvasAndCalculateScale() {
    if (!canvas) {
        console.error("Canvas element not found in the DOM.");
        return; // Guard against canvas not being ready
    }


    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (globals.debugDraw) showAndroidToast(`Canvas attributes set to W=${canvas.width}, H=${canvas.height}`);

    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';

    gameAreaViewBoxWidth = canvas.width;  // Update these module-level vars
    gameAreaViewBoxHeight = canvas.height;

    let screenAspectRatio = canvas.width / canvas.height;
    if (globals.debugDraw) console.log(`PHONE_SCALE_DEBUG: Screen Aspect Ratio=${screenAspectRatio}, Native Aspect Ratio=${globals.nativeGameAspectRatio}`);
    if (globals.debugDraw) showAndroidToast(`aspect ratio: ${screenAspectRatio}`);

    if (screenAspectRatio > globals.nativeGameAspectRatio) { // Assuming nativeGameAspectRatio is still a direct export
        globals.sceneState.currentScale = canvas.height / globals.nativeGameHeight; // Mutate property of exported object
        globals.sceneState.currentOffsetX = (canvas.width - (globals.nativeGameWidth * globals.sceneState.currentScale)) / 2;
        globals.sceneState.currentOffsetY = 0;
    } else {
        globals.sceneState.currentScale = canvas.width / globals.nativeGameWidth;
        globals.sceneState.currentOffsetX = 0;
        globals.sceneState.currentOffsetY = (canvas.height - (globals.nativeGameHeight * globals.sceneState.currentScale)) / 2;
    }
    if (globals.debugDraw) console.log(`nativeGameAspectRatio = ${globals.nativeGameAspectRatio} screen aspect ratio = ${screenAspectRatio}`);
    if (globals.debugDraw) console.log(`PHONE_SCALE_DEBUG: Final - currentScale=${globals.currentScale}, cOffsetX=${globals.currentOffsetX}, cOffsetY=${globals.currentOffsetY}`);
}






















///////////////////////////////////////////////////////////////////////////////////////

////DOM ON LOADED EVENT HANDLER//////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////


document.addEventListener('DOMContentLoaded', () => {

    canvas = document.getElementById('gameArea');
    if (canvas) {
        ctx = canvas.getContext('2d');
        liveGameArea = canvas; // liveGameArea is the canvas
        canvas.width = 720;  // Initial default (will be resized)
        canvas.height = 1280;// Initial default
        gameAreaViewBoxWidth = canvas.width;
        gameAreaViewBoxHeight = canvas.height;
        window.addEventListener('resize', resizeCanvasAndCalculateScale);//only call resizeCanvasAndCalculateScale on this line!
    } else {
        console.error("CRITICAL: Canvas element 'gameArea' not found in the DOM.");
        return; // Stop further execution if canvas isn't found
    }

    //welcome UI


    // Step 1: GET the element from the HTML document
    const welcomeScreenElement = document.getElementById('welcomeScreen');
    // Step 2: STORE the reference in your uiElements object
    uiElements.welcomeScreen = welcomeScreenElement;
    console.log("Attempting to get 'welcomeScreen'. Result:", uiElements.welcomeScreen);


    uiElements.startGameButton = document.getElementById('startGameButton');
    console.log("Attempting to get 'startGameButton'. Result:", uiElements.startGameButton);

    uiElements.loadingMessage = document.getElementById('loadingMessage');
    console.log("Attempting to get 'loadingMessage'. Result:", uiElements.loadingMessage);

    uiElements.gameLoadError = document.getElementById('gameLoadError');
    console.log("Attempting to get 'gameLoadError'. Result:", uiElements.gameLoadError);


    // Now you can check if they were found and use them:
    if (uiElements.startGameButton) {
        uiElements.startGameButton.disabled = true;
        uiElements.startGameButton.textContent = "Loading...";
        uiElements.startGameButton.addEventListener('click', () => {
            console.log("Start Game button was clicked by the user!");
            startGame();
        });
    } else {
        console.error("Start Game Button ('startGameButton') was NOT found in the DOM!");
    }

    if (uiElements.loadingMessage) {
        uiElements.loadingMessage.style.display = 'block';
    } else {
        console.warn("Loading message UI element ('loadingMessage') not found.");
    }

    if (uiElements.welcomeScreen) {
        showWelcomeScreen(); // Call your function that uses uiElements.welcomeScreen
    } else {
        console.warn("Welcome screen UI element ('welcomeScreen') was not found, so showWelcomeScreen() might not work as expected.");
    }



    //input


    // --- Initialize references to UI elements (now that DOM is ready) ---
    // These now assign to the properties of the imported 'globals' object.
    // This assumes globals.js exports these variable names (e.g., export let welcomeBackgroundImageContainer = null;)
    // It's generally better for globals.js to just hold data/config, and main.js to manage its DOM elements.
    // However, if you intend other modules to access these UI elements via globals.js, this is one way.
    // A cleaner way is for globals.js to provide IDs, and main.js (or a UI module) to fetch and manage them.

    // For now, I'm fetching them and assigning them to local vars that match the names
    // you had in globals.js, as directly assigning to globals.someButton might be confusing
    // if globals.js wasn't designed to have its exported DOM references reassigned from outside.

    let welcomeBackgroundImageContainer = document.getElementById('welcomeBackgroundImageContainer');
    let controlsOverlay = document.getElementById('gameControlsOverlay');
    let pauseButton = document.getElementById('pauseButton');
    let welcomeScreen = document.getElementById('welcomeScreen'); // This is the overlay itself
    let pauseMenuOverlay = document.getElementById('pauseMenuOverlay');
    let resumeButton = document.getElementById('resumeButton');
    let startButton = document.getElementById('startGameButton');
    let quitToMenuButton = document.getElementById('quitToMenuButton');
    let settingsButtonWelcome = document.getElementById('settingsButtonWelcome');
    let settingsButtonGame = document.getElementById('settingsButton'); // Assuming settingsButton is the one in the game controls
    let settingsOverlay = document.getElementById('settingsOverlay');
    let closeSettingsButton = document.getElementById('closeSettingsButton');
    let rotateMessageOverlay = document.getElementById('rotateMessageOverlay');

    // --- Assign DOM elements to globals using setter functions ---

    // Assuming globals.js has: export let welcomeBackgroundImageContainer = null;
    // and: export function setWelcomeBackgroundImageContainer(el) { welcomeBackgroundImageContainer = el; }
    // (This one was already in your example)
    if (welcomeBackgroundImageContainer) {
        globals.setWelcomeBackgroundImageContainer(welcomeBackgroundImageContainer);
    } else {
        console.warn("DOM element 'welcomeBackgroundImageContainer' not found for globals init.");
    }

    // For controlsOverlay
    // Assuming globals.js: export let controlsOverlay = null;
    // and: export function setControlsOverlay(el) { controlsOverlay = el; }
    if (controlsOverlay) {
        globals.setControlsOverlay(controlsOverlay);
    } else {
        console.warn("DOM element 'gameControlsOverlay' not found for globals init.");
    }

    // For pauseButton
    // Assuming globals.js: export let pauseButton = null;
    // and: export function setPauseButton(el) { pauseButton = el; }
    if (pauseButton) {
        globals.setPauseButton(pauseButton);
    } else {
        console.warn("DOM element 'pauseButton' not found for globals init.");
    }

    // For welcomeScreen
    // Assuming globals.js: export let welcomeScreen = null;
    // and: export function setWelcomeScreen(el) { welcomeScreen = el; }
    if (welcomeScreen) {
        globals.setWelcomeScreen(welcomeScreen);
    } else {
        console.warn("DOM element 'welcomeScreenOverlay' not found for globals init.");
    }

    // For pauseMenuOverlay
    // Assuming globals.js: export let pauseMenuOverlay = null;
    // and: export function setPauseMenuOverlay(el) { pauseMenuOverlay = el; }
    if (pauseMenuOverlay) {
        globals.setPauseMenuOverlay(pauseMenuOverlay);
    } else {
        console.warn("DOM element 'pauseMenuOverlay' not found for globals init.");
    }

    // For resumeButton
    // Assuming globals.js: export let resumeButton = null;
    // and: export function setResumeButton(el) { resumeButton = el; }
    if (resumeButton) {
        globals.setResumeButton(resumeButton);
    } else {
        console.warn("DOM element 'resumeButton' not found for globals init.");
    }

    // For startButton
    // Assuming globals.js: export let startButton = null;
    // and: export function setStartButton(el) { startButton = el; }
    if (startButton) {
        globals.setStartButton(startButton);
    } else {
        console.warn("DOM element 'startGameButton' not found for globals init.");
    }

    // For quitToMenuButton
    // Assuming globals.js: export let quitToMenuButton = null;
    // and: export function setQuitToMenuButton(el) { quitToMenuButton = el; }
    if (quitToMenuButton) {
        globals.setQuitToMenuButton(quitToMenuButton);
    } else {
        console.warn("DOM element 'quitToMenuButton' not found for globals init.");
    }

    // For settingsOverlay
    // Assuming globals.js: export let settingsOverlay = null;
    // and: export function setSettingsOverlay(el) { settingsOverlay = el; }
    if (settingsOverlay) {
        globals.setSettingsOverlay(settingsOverlay);
    } else {
        console.warn("DOM element 'settingsOverlay' not found for globals init.");
    }

    // For rotateMessageOverlay
    // Assuming globals.js: export let rotateMessageOverlay = null;
    // and: export function setRotateMessageOverlay(el) { rotateMessageOverlay = el; }
    if (rotateMessageOverlay) {
        globals.setRotateMessageOverlay(rotateMessageOverlay);
    } else {
        console.warn("DOM element 'rotateMessageOverlay' not found for globals init.");
    }

    if (startButton) {
        startButton.addEventListener('click', () => {
            if (animationFrameId) {
                console.log("Game is already running, cannot start again.");
            } else {
                console.log("Starting new game from Start Button.");
                if (welcomeScreen) welcomeScreen.style.display = 'none'; // Assuming welcomeScreen is the overall welcome overlay
                if (welcomeBackgroundImageContainer) welcomeBackgroundImageContainer.style.display = 'none';
                showGameControlsOverlay();
                hidePauseMenu();
                startGame();
            }
        });
    }

    if (pauseButton) {
        pauseButton.addEventListener('click', () => {
            if (animationFrameId && !gameState.gamePaused) {
                console.log("Pause button clicked, pausing game.");
                pauseGame();
            }
        });
    }

    if (resumeButton) {
        resumeButton.addEventListener('click', () => {
            resumeButtonFunc();
        });
    }

    if (quitToMenuButton) {
        quitToMenuButton.addEventListener('click', () => {
            if (gameState.gamePaused) { // Typically quit from a paused state
                console.log("Quit to menu button clicked, stopping game.");
                stopGame();
                hideGameControlsOverlay();
                hidePauseMenu();
                if (welcomeScreen) welcomeScreen.style.display = 'block'; // Show welcome screen overlay
                if (welcomeBackgroundImageContainer) welcomeBackgroundImageContainer.style.display = 'block';

            }
        });
    }

    function openSettings() {

        loadSettings();
        populateSettingsUI();
        if (settingsOverlay) settingsOverlay.classList.add('visible');
        console.log("Settings button clicked, showing settings overlay.");
    }

    if (settingsButtonGame && settingsOverlay) { // Assuming settingsButton is the in-game one
        settingsButtonGame.addEventListener('click', openSettings);
    }
    if (settingsButtonWelcome && settingsOverlay) {
        settingsButtonWelcome.addEventListener('click', openSettings);
    }

    if (closeSettingsButton && settingsOverlay) {
        closeSettingsButton.addEventListener('click', () => {
            updateSettingsFromUI();
            saveSettings();
            applyGameSettings(); // Apply immediately if needed
            if (settingsOverlay) settingsOverlay.classList.remove('visible');
        });
    }

    addListenersForSettingsUI();
    initOrientationDetection();
    // resizeCanvasAndCalculateScale(); // Already called after canvas init


    //SETUP ASSET LOADING




    // --- ASSET LOADING ---
    const assetsManifest = [
        { key: globals.MASTER_SPRITE_SHEET_KEY, path: globals.SPRITE_SHEET_PATH },
        // Add other assets like:
        // { key: "enemy_spritesheet", path: "images/enemy_sprites.png" },
        // { key: "background_level1", path: "images/backgrounds/level1.jpg" },
    ];
    console.log("[Main.js DOMContentLoaded] Constructed assetsManifest:", JSON.stringify(assetsManifest, null, 2));

    if (!assetsManifest || assetsManifest.length === 0) {
        console.warn("Asset manifest is empty or undefined. Proceeding as if all assets are loaded.");
        assetsToLoadCount = 0; // Ensure counters are zero
        assetsSuccessfullyLoadedCount = 0;
        assetsFailedToLoadCount = 0;
        proceedToGameStartConditionCheck(); // This will enable the start button
        return; // Skip asset loading loop
    }

    assetsToLoadCount = assetsManifest.length;
    assetsSuccessfullyLoadedCount = 0; // Reset counters
    assetsFailedToLoadCount = 0;

    if (assetsToLoadCount > 0) {
        assetsManifest.forEach(asset => {
            console.log(`[Main.js DOMContentLoaded] Requesting asset load for: Key="${asset.key}", Path="${asset.path}"`);
            if (typeof asset.key === 'undefined' || typeof asset.path === 'undefined' || asset.path === null) {
                const errorMessage = `Asset in manifest has undefined/null key or path: Key="${asset.key}", Path="${asset.path}"`;
                console.error(`%c${errorMessage}`, 'color:red; font-weight:bold;');
                // Treat this as an immediate failure for this asset entry
                singleAssetProcessed(asset.key || "unknown_asset_key", new Error(errorMessage), null);
            } else {
                assetManager.loadImage(asset.key, asset.path, singleAssetProcessed);
            }
        });
    } else {
        // Should have been caught by the earlier check, but as a safeguard
        console.log("[Main.js DOMContentLoaded] No assets to load from manifest. Proceeding.");
        proceedToGameStartConditionCheck();
    }




});
