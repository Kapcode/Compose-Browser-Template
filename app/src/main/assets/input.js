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
    'Space': 'jump',
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
    const originalKey = event.key; // Keep original if needed for some specific reason, or just use event.key directly
    const processedKey = originalKey.toLowerCase(); // Convert to lowercase for map lookup and state storage

    keyStates[processedKey] = true; // Store raw key state using the lowercase version

    // Use the lowercase key for map lookup
    const action = keyMap[processedKey];
    // OR if some keys in keyMap should remain case-sensitive (like 'Shift' vs 'shift' if you cared)
    // you might need a more nuanced approach, but for WASD, lowercase is what you want.
    // For general character keys like 'a', 'w', 's', 'd', 'p', 'm', you definitely want to check the lowercase version.
    // For special keys like 'ArrowLeft', 'Enter', 'Control', 'Shift', 'Escape', their names don't change with CapsLock.
    // So, a smart way is:
    // const lookupKey = (originalKey.length === 1) ? originalKey.toLowerCase() : originalKey;
    // const action = keyMap[lookupKey];

    // Simpler: If your keyMap is ALL lowercase for character keys, then always use lowercase:
    // const action = keyMap[processedKey]; <--- THIS is what you want for WASD

    if (action) {
        actionStates[action] = true;
        // Logger.debug('Input', `Action started: ${action} (Key: ${originalKey} -> ${processedKey})`);
    } else {
        // Optional: Check if the original key (if different from lowercase) is in the map
        // This handles cases where your keyMap might have "Shift" but not "shift"
        const fallbackAction = keyMap[originalKey];
        if (fallbackAction) {
            actionStates[fallbackAction] = true;
            // Logger.debug('Input', `Action started: ${fallbackAction} (Key: ${originalKey} - direct map)`);
        }
    }
}

function handleKeyUp(event) {
    const originalKey = event.key;
    const processedKey = originalKey.toLowerCase();

    keyStates[processedKey] = false;

    const action = keyMap[processedKey];
    if (action) {
        actionStates[action] = false;
        // Logger.debug('Input', `Action ended: ${action} (Key: ${originalKey} -> ${processedKey})`);
    } else {
        const fallbackAction = keyMap[originalKey];
        if (fallbackAction) {
            actionStates[fallbackAction] = false;
            // Logger.debug('Input', `Action ended: ${fallbackAction} (Key: ${originalKey} - direct map)`);
        }
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