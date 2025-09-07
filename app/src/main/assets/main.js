import * as globals from './globals.js'; // Assuming globals.js now correctly defines its exports
import { assetManager } from './AssetManager.js';//import assetManager singlton
import { LevelManager } from './LevelManager.js';
import * as input from './input.js';
import { GameObject } from './GameObject.js';
import { Sprite } from './Sprite.js';
import { Player } from './Player.js';
import { Character } from './Character.js';
import { handleTilemapCollisions, getTileIdAtTileCoords, TILE_SIZE, TILE_PROPERTIES } from './tileMapManagement.js';
import { setVolume, playPooledSound } from './audioManagement.js';
import { loadSettings, loadProgress, saveProgress, saveSettings, updateSettingsFromUI, applyGameSettings, applyGameProgress, populateSettingsUI, addListenersForSettingsUI } from './settingsManagement.js';
import {createPicklePlayerInstance } from './PickleMan.js';
import { eChef1, createPatrolingChef } from './ChefEnemy.js';
import { Camera } from './Camera.js';
import * as gameState from './gameState.js'
import { TilemapRenderer } from './TilemapRenderer.js';
import { TILE_CONFIG } from './globals.js'; //
import { Logger } from './logger.js';//todo import logger in all other files
//todo change Logger.info to Logger. calls


// --- Initialize Log Level (typically once at application start) ---
Logger.setLogLevel(Logger.LEVELS.INFO); // Or whatever level you want//todo change for release
globals.debugMode(false);//todo change for release;
// --- Example Log Calls ---
Logger.always('AppInit', 'Application Core Initialized.');

// ---- IMMEDIATELY LOG THESE VALUES ----
Logger.info("-------------------------------------------");//todo just testing out the logger here
Logger.info("[Main.js] AT VERY TOP OF MAIN.JS:");
Logger.info("[Main.js] typeof globals:", typeof globals);
Logger.info("[Main.js] globals object:", globals); // This will show all exported members from globals.js
Logger.info("[Main.js] typeof globals.SPRITE_SHEET_PATH:", typeof globals.SPRITE_SHEET_PATH);
Logger.info("[Main.js] Value of globals.SPRITE_SHEET_PATH:", globals.SPRITE_SHEET_PATH);
Logger.info("[Main.js] Value of globals.MASTER_SPRITE_SHEET_KEY:", globals.MASTER_SPRITE_SHEET_KEY);
Logger.info("-------------------------------------------");


//canvas
const levelManager = new LevelManager();
let tilemapRenderer = null;
export let player; // Your player instance
export function setPlayer(newPlayer){
    player = newPlayer;
}
export let canvas = null; 
export let ctx = null;    
window.camera = null;

function initializeCoreGameSystems() {
    const gameWorldWidth = 10000; 
    const gameWorldHeight = 10000; 
    Logger.info(`[Main.js PRE-CAMERA] [Camera] gameWorldWidth intended for constructor: ${gameWorldWidth}, gameWorldHeight: ${gameWorldHeight}`);
    window.camera = new Camera(0, 0, globals.nativeGameWidth, globals.nativeGameHeight,gameWorldWidth, gameWorldHeight); 
    Logger.info(`[Main.js PRE-CAMERA  [Camera]--post constructor] gameWorldWidth intended for constructor: ${gameWorldWidth}, gameWorldHeight: ${gameWorldHeight}`);
    Logger.info("[Main.js] Camera initialized.");
}
let activeGameElements = []; 
let gameAreaViewBoxWidth = 0;
let gameAreaViewBoxHeight = 0;
let liveGameArea = null; 

export let debugDraw = true;
export let animationFrameId = null; 
export const gameStateLogs = false;
export let gameTimeAccumulator = 0;
export let timeWhenPauseActuallyStarted = 0;
export let lastTimestamp = 0;
export let lastSpawnTime = 0;
export let spawnCounter = 0;
export const SPAWN_INTERVAL_FRAMES = 120; 
export let score = 0;

let assetsToLoadCount = 0; 
let assetsSuccessfullyLoadedCount = 0;
let assetsFailedToLoadCount = 0;

function singleAssetProcessed(key, error, assetData, processedCount, totalToProcess) {
    Logger.info(`%c[singleAssetProcessed START] Key: "${key}"`, "color: magenta;");
    if (error) { 
        assetsFailedToLoadCount++;
        Logger.error(`[Main.js] Failed to load asset: "${key}". Error: ${error.message || error}. Total FAILED: ${assetsFailedToLoadCount}`);
    } else {
        assetsSuccessfullyLoadedCount++;
        Logger.info(`[Main.js] Successfully loaded asset: "${key}". Total SUCCESSFUL: ${assetsSuccessfullyLoadedCount}`);
    }
    Logger.info(`%c[singleAssetProcessed END] Key: "${key}" - Failed: ${assetsFailedToLoadCount}, Success: ${assetsSuccessfullyLoadedCount}`, "color: magenta;");
}

async function loadPrerequisitesAndEnableStart() {
    Logger.info("[Main.js] Asset loading complete. Now loading level manifest...");
    const manifestLoaded = await levelManager.loadManifest('levels/levels-manifest.json'); 
    if (!manifestLoaded) {
        Logger.error("[Main.js] CRITICAL: Level manifest failed to load.");
        proceedToGameStartConditionCheck(); 
        return;
    }

    Logger.info("[Main.js] Level manifest loaded. Now pre-loading default level data...");
    const firstLevelDataLoaded = await levelManager.loadDefaultLevel(); 
    if (!firstLevelDataLoaded) { 
        Logger.error("[Main.js] CRITICAL: Failed to pre-load default level data.");
        proceedToGameStartConditionCheck(); 
        return;
    }
    Logger.info("[Main.js] Default level data pre-loaded successfully.");
    proceedToGameStartConditionCheck(); 
}

function allAssetsProcessed(successfulFromManifest, failedFromManifest, totalInManifest) {
    Logger.info(`[Main.js allAssetsProcessed] Asset manifest processing finished. Total in Manifest: ${totalInManifest}, Successful in Manifest: ${successfulFromManifest}, Failed in Manifest: ${failedFromManifest}`);
    loadPrerequisitesAndEnableStart();
}

async function startGame() { 
    showGameControlsOverlay();
    Logger.info("%c[Main.js] startGame() CALLED!", "color: green; font-weight:bold;");
    hideWelcomeScreen();
    if (uiElements.gameLoadError) uiElements.gameLoadError.style.display = 'none';
    playPooledSound('jump', 'sounds/gameOver.wav');

    const initialLevelData = levelManager.getCurrentLevelData();
    if (!initialLevelData) {
        Logger.error("CRITICAL: Initial level data missing in startGame.");
        displayAssetLoadError("Error: Could not retrieve preloaded level data.");
        return;
    }
    setupSceneFromLevelData(initialLevelData);
    
    gameState.setGamePaused(false);
    gameState.setGameStopped(false); 
    if (animationFrameId === null) {
        resizeCanvasAndCalculateScale();
        lastTimestamp = performance.now();
        gameTimeAccumulator = 0;
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        Logger.info("Game might be already running or restarting...");
    }
    Logger.info(`[Main.js startGame] Game initialized. Starting game loop.`);
}

function proceedToGameStartConditionCheck() {
    if (!uiElements || !uiElements.loadingMessage || !uiElements.startGameButton || !uiElements.gameLoadError) {
        Logger.error("[proceedToGameStartConditionCheck] Critical UI elements missing.");
        return;
    }
    Logger.info(`[proceedToGameStartConditionCheck] Counts - ToLoad: ${assetsToLoadCount}, Success: ${assetsSuccessfullyLoadedCount}, Failed: ${assetsFailedToLoadCount}`);

    if (uiElements.loadingMessage) uiElements.loadingMessage.style.display = 'none';

    if (assetsFailedToLoadCount > 0) {
        const errorMessage = `Failed to load ${assetsFailedToLoadCount} essential game file(s). Please refresh.`;
        Logger.error(`CRITICAL: ${errorMessage}`);
        displayAssetLoadError(errorMessage);
        uiElements.startGameButton.disabled = true;
        uiElements.startGameButton.textContent = "Error Loading";
    } else if (assetsSuccessfullyLoadedCount >= assetsToLoadCount && levelManager.isManifestLoaded() && levelManager.getCurrentLevelData()) {
        Logger.info("All prerequisites loaded successfully! Ready for user to start.");
        if (uiElements.gameLoadError) uiElements.gameLoadError.style.display = 'none';
        uiElements.startGameButton.disabled = false;
        uiElements.startGameButton.textContent = "Start Game";
    } else {
        Logger.warn("[proceedToGameStartConditionCheck] Prerequisites not yet met. Assets or level data still loading/pending.");
        uiElements.startGameButton.disabled = true;
        uiElements.startGameButton.textContent = "Loading Game..."; 
    }
}

function setupSceneFromLevelData(levelData) {
    Logger.info("[Main.js] Setting up scene from level data:", levelData);
    activeGameElements = []; 
    if (levelData.playerStart) {
        tilemapRenderer = new TilemapRenderer(levelData.tilemap, TILE_CONFIG);
        player = createPicklePlayerInstance(levelData.playerStart.x, levelData.playerStart.y, "pickle_player_idle", globals.default_scale, globals.default_player_health, globals.default_player_speed,tilemapRenderer);
        activeGameElements.push(player);
        if(window.camera) window.camera.follow(player);
    } else {
        Logger.error("No playerStart defined in level data!");
    }

    if (levelData.enemies && Array.isArray(levelData.enemies)) {
        levelData.enemies.forEach(enemyInfo => {
            if (enemyInfo.type === "chef_patrol") {
                const chef = createPatrolingChef(enemyInfo.x, enemyInfo.y, "cheff_ketchup_walk", globals.default_scale, enemyInfo.health || 100, enemyInfo.speed || 80, enemyInfo.patrolMinX, enemyInfo.patrolMaxX,tilemapRenderer);
                activeGameElements.push(chef);
            }
        });
    }

    if (levelData.tilemap && window.camera && tilemapRenderer) {
        const mapW = tilemapRenderer.getMapWidth();
        const mapH = tilemapRenderer.getMapHeight();
        Logger.info(`[SetupScene] Tilemap dimensions: ${mapW}x${mapH}. Setting camera world size.`);
        window.camera.setWorldSize(mapW, mapH);
    } else {
        tilemapRenderer = null;
        if(window.camera) window.camera.setWorldSize(globals.nativeGameWidth, globals.nativeGameHeight); // Default if no tilemap
    }
    Logger.info("[Main.js] Scene setup complete for level:", levelData.levelName || levelManager.getCurrentLevelInfo()?.id);
    input.initInput(); 
    hidePauseMenu();   
    score = 0;         
}

function displayAssetLoadError(message) {
    if (uiElements && uiElements.gameLoadError) {
        uiElements.gameLoadError.textContent = message;
        uiElements.gameLoadError.style.display = 'block';
    } else {
        Logger.error("gameLoadError UI element not found. Fallback alert:", message);
        alert("Error loading game: " + message); 
    }
}

let uiElements = {
    welcomeScreen: null,
    startGameButton: null,
    loadingMessage: null,
    gameLoadError: null
};

function handleGameResumeAfterSystemPause() {
    const timeNow = performance.now();
    Logger.info("Game resuming after system interruption.");
    lastTimestamp = timeNow;
    gameTimeAccumulator = 0;
    lastSpawnTime = timeNow; 
    setPauseState(false);
}

document.addEventListener("visibilitychange", () => {
    if (gameState.gameStopped) { 
        Logger.trace("[VisibilityChange] Game is stopped. No action.");
        return;
    }

    if (document.hidden) {
        if (animationFrameId && !gameState.gamePaused) {
            Logger.info("Page hidden or focus lost. Auto-pausing game and showing pause menu.");
            pauseGame(); 
        } else {
            if (!animationFrameId) {
                Logger.trace("[VisibilityChange] Page hidden, but game not running. No action.");
            } else if (gameState.gamePaused) {
                Logger.trace("[VisibilityChange] Page hidden, but game was already paused. No action.");
            }
        }
    } else { 
        Logger.info("Page became visible or regained focus. Game will remain paused if it was auto-paused.");
        // If the game was paused (e.g., due to focus loss), it will stay paused.
        // The user needs to manually resume using the 'Resume' button or 'Escape' key.
        // The pause menu, if shown, will remain visible.
    }
});

function setPauseState(pause) {
    gameState.setGamePaused(pause);
    if (pause) {
        timeWhenPauseActuallyStarted = performance.now(); 
        if (gameStateLogs) Logger.info("Game paused via setPauseState(true).");
    } else {
        const timeNow = performance.now();
        if (gameStateLogs) Logger.info(`Game unpaused via setPauseState(false).`);
        lastTimestamp = timeNow; 
        lastSpawnTime = timeNow; 
        gameTimeAccumulator = 0; 
        timeWhenPauseActuallyStarted = 0;
    }
}

const MAX_DELTA_TIME = 0.01666666667;

function gameLoop(currentTimestamp) {
    if (gameState.gameStopped || !animationFrameId) { 
        animationFrameId = null; 
        return;
    }

    let deltaTime = (currentTimestamp - lastTimestamp) / 1000;
    lastTimestamp = currentTimestamp;
    deltaTime = Math.min(deltaTime, MAX_DELTA_TIME * 5); 

    if (!gameState.gamePaused) {
        gameTimeAccumulator += deltaTime;
        while (gameTimeAccumulator >= MAX_DELTA_TIME) {
            if (window.camera) window.camera.update(); 
            updateGameElements(MAX_DELTA_TIME, currentTimestamp); 
            gameTimeAccumulator -= MAX_DELTA_TIME;
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(globals.sceneState.currentOffsetX, globals.sceneState.currentOffsetY);
    ctx.scale(globals.sceneState.currentScale, globals.sceneState.currentScale);
    if (window.camera) ctx.translate(-window.camera.x, -window.camera.y);

    if (tilemapRenderer && window.camera) tilemapRenderer.draw(ctx, window.camera, { bufferTiles: 2 });
    activeGameElements.forEach(element => {
        if (element && typeof element.draw === 'function') element.draw(ctx,window.camera); 
    });
    ctx.restore();

    if (globals.DEBUG_MODE && window.camera && typeof window.camera.drawDeadZoneDebug === 'function') {
        window.camera.drawDeadZoneDebug(ctx, globals.sceneState.currentScale, globals.sceneState.currentOffsetX, globals.sceneState.currentOffsetY);
    }
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    animationFrameId = requestAnimationFrame(gameLoop);
}

function initializeGame() { 
    loadSettings();
    loadProgress();
    Logger.info("[Main.js] initializeGame called (player setup moved to setupSceneFromLevelData).");
}

function updateGameElements(deltaTime, currentTime) {
    let elementsToKeep = [];
    activeGameElements.forEach(element => {
        if (element.isActive) {
            element.update(deltaTime, currentTime, activeGameElements);
            if (element.isActive) elementsToKeep.push(element);
        }
    });
    activeGameElements = elementsToKeep;
}

function removeInputListeners() {
    input.removeInputListeners();
}

function stopGame() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    gameState.setGameStopped(true); 
    gameState.setGamePaused(false); 
    Logger.info("Game fully stopped.");
    removeInputListeners();
    activeGameElements = [];
    lastTimestamp = 0;
    hideGameControlsOverlay();
    showWelcomeScreen();
}

function pauseGame() {
    if (gameState.gameStopped || !animationFrameId) {
        Logger.info("Game is not running or is stopped, cannot pause.");
        return;
    }
    if (gameState.gamePaused) {
        Logger.info("Game is already paused. No action.");
        return;
    }
    setPauseState(true); 
    Logger.info("Game paused by pauseGame function.");
    if (globals.pauseMenuOverlay) globals.pauseMenuOverlay.style.display = 'flex';
}

function showGameControlsOverlay() {
    const overlay = document.getElementById('gameControlsOverlay');
    if (overlay) overlay.classList.add('visible');
}
function hideGameControlsOverlay() {
    const overlay = document.getElementById('gameControlsOverlay');
    if (overlay) overlay.classList.remove('visible');
}

function hidePauseMenu() {
    if (globals.pauseMenuOverlay) globals.pauseMenuOverlay.style.display = 'none';
}

function resumeButtonFunc() {
    if (gameState.gamePaused && !gameState.gameStopped) { 
        Logger.info("Resuming game from pause.");
        setPauseState(false); 
        hidePauseMenu();
    } else {
        Logger.info("Game not pausable or already running/stopped, cannot resume via resumeButtonFunc.");
    }
}

function showWelcomeScreen() {
    if (uiElements.welcomeScreen) uiElements.welcomeScreen.style.display = 'flex'; 
    hideGameControlsOverlay();
    hidePauseMenu();
}

function hideWelcomeScreen() {
    if (uiElements.welcomeScreen) uiElements.welcomeScreen.style.display = 'none';
}

function resizeCanvasAndCalculateScale() {
    if (!canvas) {
        Logger.error("Canvas element not found for resize.");
        return; 
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    gameAreaViewBoxWidth = canvas.width;  
    gameAreaViewBoxHeight = canvas.height;
    let screenAspectRatio = canvas.width / canvas.height;
    if (screenAspectRatio > globals.nativeGameAspectRatio) { 
        globals.sceneState.currentScale = canvas.height / globals.nativeGameHeight; 
        globals.sceneState.currentOffsetX = (canvas.width - (globals.nativeGameWidth * globals.sceneState.currentScale)) / 2;
        globals.sceneState.currentOffsetY = 0;
    } else {
        globals.sceneState.currentScale = canvas.width / globals.nativeGameWidth;
        globals.sceneState.currentOffsetX = 0;
        globals.sceneState.currentOffsetY = (canvas.height - (globals.nativeGameHeight * globals.sceneState.currentScale)) / 2;
    }
    Logger.info(`Resize: Scale=${globals.sceneState.currentScale.toFixed(2)}, OffsetX=${globals.sceneState.currentOffsetX.toFixed(2)}, OffsetY=${globals.sceneState.currentOffsetY.toFixed(2)}`);
}

function handleGlobalKeyDown(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) return;
    switch (event.key) {
        case 'Escape':
            Logger.trace(`[Keyboard] Esc. Settings: ${globals.settingsOverlay?.classList.contains('visible')}, Stopped: ${gameState.gameStopped}, Paused: ${gameState.gamePaused}`);
            if (globals.settingsOverlay?.classList.contains('visible')) {
                document.getElementById('closeSettingsButton')?.click(); 
            } else if (!gameState.gameStopped) { 
                if (gameState.gamePaused) resumeButtonFunc(); else pauseGame();
            } else {
                 Logger.info("[Keyboard] Esc: Game stopped & settings not open. No action.");
            }
            event.preventDefault(); 
            break;
        case 'Enter':
            Logger.trace(`[Keyboard] Enter. Welcome: ${uiElements.welcomeScreen?.style.display !== 'none'}, StartBtnEnabled: ${!uiElements.startGameButton?.disabled}`);
            if (uiElements.welcomeScreen?.style.display !== 'none' && !uiElements.startGameButton?.disabled) {
                if (!(globals.settingsOverlay?.classList.contains('visible'))) startGame();
                else Logger.info("[Keyboard] Enter: Settings overlay visible. No start game.");
            } else {
                Logger.info("[Keyboard] Enter: Not on welcome or start not enabled. No action.");
            }
            if (uiElements.welcomeScreen?.style.display !== 'none') event.preventDefault();
            break;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    initializeCoreGameSystems();
    canvas = document.getElementById('gameArea');
    if (canvas) {
        ctx = canvas.getContext('2d');
        liveGameArea = canvas; 
        window.addEventListener('resize', resizeCanvasAndCalculateScale);
        resizeCanvasAndCalculateScale(); 
    } else {
        Logger.error("CRITICAL: Canvas element 'gameArea' not found.");
        return; 
    }

    uiElements.welcomeScreen = document.getElementById('welcomeScreen');
    uiElements.startGameButton = document.getElementById('startGameButton');
    uiElements.loadingMessage = document.getElementById('loadingMessage');
    uiElements.gameLoadError = document.getElementById('gameLoadError');

    if (uiElements.startGameButton) {
        uiElements.startGameButton.disabled = true;
        uiElements.startGameButton.textContent = "Loading Game..."; // Initial text
        uiElements.startGameButton.addEventListener('click', () => {
            if (!(globals.settingsOverlay?.classList.contains('visible'))) startGame();
            else Logger.info("Start Game button: Settings overlay visible. Game not started.");
        });
    } else {
        Logger.error("Start Game Button ('startGameButton') NOT found.");
    }
    if (uiElements.loadingMessage) uiElements.loadingMessage.style.display = 'block';
    if (uiElements.welcomeScreen) showWelcomeScreen(); 
    
    globals.setWelcomeBackgroundImageContainer?.(document.getElementById('welcomeBackgroundImageContainer'));
    globals.setControlsOverlay?.(document.getElementById('gameControlsOverlay'));
    globals.setPauseButton?.(document.getElementById('pauseButton'));
    globals.setWelcomeScreen?.(uiElements.welcomeScreen); 
    globals.setPauseMenuOverlay?.(document.getElementById('pauseMenuOverlay'));
    globals.setResumeButton?.(document.getElementById('resumeButton'));
    globals.setStartButton?.(uiElements.startGameButton); 
    globals.setQuitToMenuButton?.(document.getElementById('quitToMenuButton'));
    globals.setSettingsOverlay?.(document.getElementById('settingsOverlay'));
    globals.setRotateMessageOverlay?.(document.getElementById('rotateMessageOverlay'));

    document.getElementById('pauseButton')?.addEventListener('click', () => {
        if (animationFrameId && !gameState.gamePaused && !gameState.gameStopped) pauseGame();
    });
    document.getElementById('resumeButton')?.addEventListener('click', resumeButtonFunc);
    document.getElementById('quitToMenuButton')?.addEventListener('click', () => {
        if (gameState.gamePaused || (animationFrameId && !gameState.gameStopped)) stopGame(); 
    });

    function openSettings() {
        loadSettings();
        populateSettingsUI();
        globals.settingsOverlay?.classList.add('visible');
        Logger.info("Settings shown.");
    }
    document.getElementById('settingsButton')?.addEventListener('click', openSettings);
    document.getElementById('settingsButtonWelcome')?.addEventListener('click', openSettings);
    document.getElementById('closeSettingsButton')?.addEventListener('click', () => {
        updateSettingsFromUI();
        saveSettings();
        applyGameSettings(); 
        globals.settingsOverlay?.classList.remove('visible');
    });

    addListenersForSettingsUI();
    document.addEventListener('keydown', handleGlobalKeyDown);

    const assetsManifest = [
        { key: globals.MASTER_SPRITE_SHEET_KEY, type: 'masterSpriteSheet', jsonPath: globals.SPRITE_SHEET_JSON_PATH, imagePath: globals.SPRITE_SHEET_PATH }
    ];
    if (!assetsManifest || assetsManifest.length === 0) {
        Logger.warn("Asset manifest empty. Proceeding without asset loading.");
        assetsToLoadCount = 0; assetsSuccessfullyLoadedCount = 0; assetsFailedToLoadCount = 0;
        proceedToGameStartConditionCheck(); 
    } else {
        await processManifest(assetsManifest, singleAssetProcessed, allAssetsProcessed);
    }
});

export async function processManifest(manifest, progressCallback, completionCallback) {
    Logger.info(`%c[processManifest START]`, "color: green; font-weight: bold;");
    let loadedCount = 0, failedCount = 0;
    assetsToLoadCount = manifest.length;
    assetsSuccessfullyLoadedCount = 0; assetsFailedToLoadCount = 0;

    for (const asset of manifest) {
        let currentAssetKey = asset.key || "UNKNOWN_KEY";
        try {
            if (!asset.key || !asset.type) throw new Error(`Asset missing key or type: ${JSON.stringify(asset)}`);
            let loadedAssetData = null;
            if (asset.type === "masterSpriteSheet") {
                if (!asset.jsonPath || !asset.imagePath) throw new Error(`MasterSpriteSheet "${currentAssetKey}" missing paths.`);
                await assetManager.loadMasterSpriteSheet(asset.jsonPath, asset.imagePath, currentAssetKey);
                loadedAssetData = assetManager.getMasterSheetImage();
            } else if (asset.type === "image") {
                if (!asset.path) throw new Error(`Image "${currentAssetKey}" missing path.`);
                loadedAssetData = await assetManager.loadImage(currentAssetKey, asset.path);
            } else if (asset.type === "audio") {
                loadedAssetData = `Audio data for ${currentAssetKey}`;
            } else {
                throw new Error(`Unknown asset type: ${asset.type}`);
            }
            loadedCount++;
            if (progressCallback) progressCallback(currentAssetKey, null, loadedAssetData, loadedCount + failedCount, assetsToLoadCount);
        } catch (error) {
            failedCount++;
            Logger.error(`[processManifest] ERROR for asset "${currentAssetKey}":`, error.message);
            if (progressCallback) progressCallback(currentAssetKey, error, null, loadedCount + failedCount, assetsToLoadCount);
        }
    }
    Logger.info(`[processManifest] Loop COMPLETE. Manifest Totals - Loaded: ${loadedCount}, Failed: ${failedCount} of ${assetsToLoadCount}`);
    if (completionCallback) completionCallback(loadedCount, failedCount, assetsToLoadCount);
    Logger.info(`%c[processManifest END]`, "color: green; font-weight: bold;");
}

