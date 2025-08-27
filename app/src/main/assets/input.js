const keyStates = {};
const actionStates = {};


// --- Configuration: Map keys to game actions ---
// This allows easy remapping later
const keyMap = {
    // Movement
    'ArrowLeft': 'moveLeft',
    'a': 'moveLeft',
    'ArrowRight': 'moveRight',
    'd': 'moveRight',
    'ArrowUp': 'moveUp', // Or 'jump'
    'w': 'moveUp',     // Or 'jump'
    'ArrowDown': 'moveDown', // Or 'crouch'
    's': 'moveDown',   // Or 'crouch'

    // Actions
    ' ': 'jump',        // Space bar for jump
    'Enter': 'actionPrimary', // Or 'fire', 'interact'
    'Control': 'actionSecondary', // Or 'specialAbility'
    'Shift': 'sprint',

    // UI / System
    'Escape': 'pauseGame',
    'p': 'pauseGame',
    'm': 'toggleMute'
    // Add more mappings as needed
};

// --- Event Listeners ---
function handleKeyDown(event) {
    const key = event.key; // e.g., "ArrowLeft", "a", " "
    keyStates[key.toLowerCase()] = true; // Store raw key state

    const action = keyMap[key]; // Check if this key is mapped to an action
    if (action) {
        actionStates[action] = true;
        // console.log(`Action started: ${action}`);
    }
    // Optional: Prevent default browser behavior for certain keys (e.g., space scrolling)
    // if (action === 'jump' || action === 'fire') {
    //     event.preventDefault();
    // }
}

function handleKeyUp(event) {
    const key = event.key;
    keyStates[key.toLowerCase()] = false; // Store raw key state

    const action = keyMap[key];
    if (action) {
        actionStates[action] = false;
        // console.log(`Action ended: ${action}`);
    }
}

// --- Public API for querying input ---

/**
 * Checks if a specific game action is currently active (key is held down).
 * @param {string} actionName - The name of the action (e.g., 'moveLeft', 'jump').
 * @returns {boolean} True if the action is active, false otherwise.
 */
export function isActionActive(actionName) {
    return !!actionStates[actionName]; // Use !! to ensure boolean true/false
}

/**
 * Checks if a specific key is currently pressed down.
 * Useful for direct key checks if an action isn't mapped.
 * @param {string} keyName - The key identifier (e.g., 'a', 'ArrowLeft', ' ').
 * @returns {boolean} True if the key is pressed, false otherwise.
 */
export function isKeyDown(keyName) {
    return !!keyStates[keyName.toLowerCase()];
}

/**
 * (Advanced) Checks if an action was just pressed in this frame.
 * This requires a bit more state management (tracking previous frame's state).
 * For now, we'll keep it simple with isActionActive.
 * You could add:
 * let previousActionStates = {};
 * export function isActionJustPressed(actionName) {
 *     return !!actionStates[actionName] && !previousActionStates[actionName];
 * }
 * // And then in an updateInputState() function called once per frame:
 * // previousActionStates = { ...actionStates };
 */


// --- Initialization ---
/**
 * Initializes the input listeners. Call this once when the game starts.
 */
export function initInput() {
    // Clear any previous states if re-initializing
    for (const key in keyStates) delete keyStates[key];
    for (const key in actionStates) delete actionStates[key];

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    console.log("Input system initialized.");
}

/**
 * Call this if you need to remove listeners, e.g., when the game ends or player is not in control.
 */
export function removeInputListeners() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    console.log("Input system listeners removed.");
}

// Example of how you might update previous states for "just pressed" logic
// This would be called at the END of your game loop's input processing phase.
// export function updateInputFrameEnd() {
//     previousActionStates = { ...actionStates };
// }