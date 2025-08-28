// ./gameState.js
export let gamePaused = false;
export let gameStopped = true; // Or initial state
export let timeWhenPauseActuallyStarted = 0;
export const gameStateLogs = []; // If this is truly global state

// Functions to modify this state, also exported
export function setGamePaused(isPaused) {
    gamePaused = isPaused;
    if (isPaused) {
        timeWhenPauseActuallyStarted = performance.now(); // Or your logic
    }
    // Log changes if needed
    gameStateLogs.push(`Game paused: ${gamePaused} at ${timeWhenPauseActuallyStarted}`);
    console.log(`[gameState] Game paused: ${gamePaused}`);
}

export function setGameStopped(isStopped) {
    gameStopped = isStopped;
    gameStateLogs.push(`Game stopped: ${gameStopped}`);
    console.log(`[gameState] Game stopped: ${gameStopped}`);
}

// Add other relevant state and modifiers here