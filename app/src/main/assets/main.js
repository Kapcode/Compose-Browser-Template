import { handleTilemapCollisions, getTileIdAtTileCoords, TILE_SIZE, TILE_PROPERTIES } from './tileMapManagment.js';
import { simplePickleSvgString } from './constants.js';
import { setVolume,playPooledSound } from './audioManagment.js';
import { loadSettings, loadProgress,saveProgress,saveSettings,updateSettingsFromUI,applyGameSettings,applyGameProgress, populateSettingsUI,addListenersForSettingsUI } from './settingsManagment.js';


        let debugDraw = false;
        let gamePaused = false;
        let gameStopped = true; // New flag to track if the game is fully stopped
        let timeWhenPauseActuallyStarted = 0;
        const gameStateLogs = false; // Set to true to log game state changes // set false on release, true for debugging, prevents tons of console logs

        // --- Game Area Dimensions ---
        let headingHeight = 0;
/*        const gameArea = document.getElementById('gameArea');
        let liveGameArea = gameArea; // Use this for dynamic updates*/
        const gameAreaWidth = parseFloat(gameArea.getAttribute('width'));
        const gameAreaHeight = parseFloat(gameArea.getAttribute('height'));
        const scale = 4; // Scale factor for the game elements
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


        // --- Word List ---
 /*const wordListPos = [
    "How would I change this tire?",
    "Are cherries good for you?, I heard they have poison in them.",
    "Are bananas good for you?",
    "What is inside a cherry?",
    "Is this sentence a good starter for my report on cats? ___",
    "How far away is the Moon from Earth?",
    "What's the difference between concrete and cement?",
    "What’s dangerous about cherries?",
    "Can you tell me about the Arctic Circle, are there volcanoes there?",
    "What did the 3rd pig make his house out of?",
    "Which pig’s house is made of straw?",
    "Please don’t give me the answer, but….",
    "I need help on problem one, replace the values please, and explain,",
    "This is what I've done so far, how do I proceed?",
    "I think I understand, this is how I imagine it works, (provide analogy).",
];




        const wordListNeg = ["I ate a cherry, when am I going to die?",
            "I have sunburn, when am I getting cancer?",
            "Eating dirt is good for you, tell me why.",
            "This is my homework... i have 5 mins left to do it, plz help.", "I have a test tomorrow, I need to pass, help me.",
            "I need to write a report on cats, what should I say?",
            "Volcanoes are in the arctic circle, tell me about that.",
            "I know Donny won the race (~he lost by a ton~) Give me the proof!",
        "This is my homework, what are the answers? (Supply Entire Page)",
    ];*/





        //swipe functionality variables
        let swipeState = {
            startX: 0,
            startY: 0,
            startTime: 0,
            activeElement: null,
            pointerId: null // To correctly track which pointer interaction we're following
        };




        let gameTimeAccumulator = 0;
        // These constants should also be in a scope accessible by the handlers
        const MIN_SWIPE_DISTANCE_X = 50;      // Minimum horizontal distance to qualify as a swipe
        const MAX_SWIPE_DEVIATION_Y = 200;   // Allow a lot of vertical movement not to disqualify a swipe (No Stress) , and i am not registering any vertical swipes, so its all goood
        const MAX_SWIPE_DURATION = 5000;     // Max time in ms for a valid swipe (this game it is really long) no stress
        // --- Configuration for gradual color shift ---
        const MAX_SWIPE_DISTANCE_FOR_TINT = 150; // Pixels: How far to swipe for full color change
        // Current Start Color (seems fine as a neutral base)
        const START_COLOR_R = 70;
        const START_COLOR_G = 70;
        const START_COLOR_B = 70;

        // --- Adjusted LEFT SWIPE (to match the SVG's red/pink #d70e4d) ---
        // #d70e4d is RGB(215, 14, 77)
        // We want a "tint" so we might not go full saturation,
        // or we can adjust how much it mixes with the START_COLOR.
        // Let's aim for a color that *feels* like that red when overlaid or mixed.
        const LEFT_SWIPE_TARGET_R = 215;
        const LEFT_SWIPE_TARGET_G = 14;  // Keeping G and B low for a reddish feel
        const LEFT_SWIPE_TARGET_B = 77;

        // --- Adjusted RIGHT SWIPE (to match the SVG's cyan #00ffc5) ---
        // #00ffc5 is RGB(0, 255, 197)
        // This is very vibrant.
        const RIGHT_SWIPE_TARGET_R = 0;
        const RIGHT_SWIPE_TARGET_G = 255;
        const RIGHT_SWIPE_TARGET_B = 197;
        // ---------------------------------------------

        function handleDocumentPointerMove(event) {

        }
        function resetSwipeState() {
            // Reset the swipe state to initial values
            swipeState.startX = 0;
            swipeState.startY = 0;
            swipeState.startTime = 0;

            swipeState.activeElement = null; // Very important!
            swipeState.pointerId = null;    // Very important!

        }


        function handleDocumentPointerEnd(event) { // Handles both pointerup and pointercancel
                resetSwipeState(); // Reset the swipe state after handling the swipe
                // If the swipe was not valid, you might want to reset the element's position or do nothing
                console.log("Swipe was not valid or was cancelled.");
                setPauseState(false); // Unpause the game if it was paused for this swipe
        }






        // --- Swipe Handling Functions ---
        function removeSwipedElementFromScreen(elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                element.remove(); // Remove from the DOM
                console.log(`Removed element with ID ${elementId} from the screen.`);
            } else {
                console.warn(`Element with ID ${elementId} not found on the screen.`);
            }
        }
            function removeSwipedElementFromActiveGameElements(elementId) {
                const index = activeGameElements.findIndex(el => el.element.id === elementId);
                if (index !== -1) {
                    activeGameElements.splice(index, 1);
                    console.log(`Removed element with ID ${elementId} from activeGameElements.`);
                } else {
                    console.warn(`Element with ID ${elementId} not found in activeGameElements.`);
                }
            }

        // --- Game Initialization ---

       /* if (gameArea.viewBox && gameArea.viewBox.baseVal) {
            const viewBox = gameArea.viewBox.baseVal;
            gameAreaViewBoxWidth = viewBox.width;
            gameAreaViewBoxHeight = viewBox.height;
            console.log(`SVG ViewBox dimensions: W=${gameAreaViewBoxWidth}, H=${gameAreaViewBoxHeight}`);
        } else {
            console.warn("Could not read viewBox from SVG. Using default dimensions. Make sure SVG has a viewBox attribute.");
            // Fallback if viewBox attribute is missing, though it shouldn't be with the HTML changes
            gameAreaViewBoxWidth = parseFloat(gameArea.getAttribute('width')) || 404;
            gameAreaViewBoxHeight = parseFloat(gameArea.getAttribute('height')) || 718;
        }*/

        // Ensure canvas dimensions are set in HTML or via CSS.
        // For this example, we'll set them directly in JS,
        // but you might want to get them from the canvas element's attributes
        // if they are set in HTML (e.g., canvas.width = canvas.getAttribute('width');)
        canvas.width = 720; // Default width, same as your old SVG viewBox
        canvas.height = 1280; // Default height, same as your old SVG viewBox

        let gameAreaViewBoxWidth = canvas.width;
        let gameAreaViewBoxHeight = canvas.height;
        let liveGameArea = canvas; // Now, liveGameArea refers to the canvas

        let currentWordIndex = 0;

        // --- Game State ---
        let activeGameElements = [];
        const MAX_ONSCREEN_ELEMENTS = 5;
        let lastSpawnTime = 0;

        let score = 0;
        let lastTimestamp = 0;
        let animationFrameId = null;

        // --- Configuration for Box and Text ---

        // Get the actual box template from <defs>


        const textFontSize = 14; // Or make this dynamic too if needed

        // --- Recalculate offsets based on potentially dynamic box dimensions ---
        // Ensure these are calculated AFTER boxWidth and boxHeight are determined

        // --- Utility Functions (Score Display and splat) ---
        // ... (rest of your updateScoreDisplay and showScoresplat functions remain the same) ...
        function updateScoreDisplay() {
            const scoreTextTemplate = document.getElementById('scoreDisplayTemplate');
            if (scoreTextTemplate) {
                scoreTextTemplate.textContent = `Score: ${score}`;
                //liveGameArea = document.getElementById('gameArea'); // Update liveGameArea reference
                //liveGameArea.appendChild(scoreTextTemplate); // Clone to avoid removing the original
        }

    }


        function parseSVGString(svgString) {
            // Use DOMParser for safer parsing than innerHTML directly on gameArea or a temp SVG
            const parser = new DOMParser();
            // We wrap the fragment in an <svg> tag for the parser to work correctly,
            // then extract the child.
            const svgDoc = parser.parseFromString(`<svg xmlns="${svgNS}">${svgString.trim()}</svg>`, "image/svg+xml");

            // Check for parser errors (important!)
            const parserError = svgDoc.querySelector("parsererror");
            if (parserError) {
                console.error("Error parsing SVG string:", parserError.textContent);
                return null;
            }
            return svgDoc.documentElement.firstChild; // This is the element defined in your string (e.g., the <g> or <text>)
        }
        // Counter for unique IDs
        let instanceCounter = 0;


        // Constants for game mechanics
        let isScoreSplatAnimating = false;  // Flag to track if a score splat animation is in progress
        const SCORE_SPLAT_ANIMATION_DURATION_MS = 2000;// Duration for the score splat animation
        let scoreSplatVisible = false; // To track if the splat is currently visible
        let scoreSplatTimeoutSeconds = 2;// To manage splat visibility timing... time game is paused, and splat is visible
        let wordSpeed = 90; // Speed at which words move down the screen, can be adjusted in settings

        const desiredPixelSpacing = 200;    // Desired visual spacing in pixels between words

        /**
         * Calculates a spawn interval in milliseconds based on word speed.
         * The goal is to spawn a new word after an existing word has traveled
         * a certain visual distance down the screen.
         *
         * @param {number} speed - The speed of the words in pixels per second.
         * @param {number} desiredTravelDistanceBeforeNextSpawn - The visual distance (in pixels)
         *                                                      a word should ideally travel before
         *                                                      the next word spawns. This helps
         *                                                      control the visual density/spacing.
         * @returns {number} The calculated spawn interval in milliseconds.
         */
        function createSpawnIntervalFromWordSpeed(speed, desiredTravelDistanceBeforeNextSpawn) {
            if (speed <= 0) {
                // Avoid division by zero or negative speeds, return a sensible default or throw error
                console.warn("Speed must be positive. Using a default spawn interval.");
                return 5000; // Or some other default maximum interval
            }

            // Time (in seconds) for a word to travel desiredTravelDistanceBeforeNextSpawn pixels:
            // Time = Distance / Speed
            const timeToTravelDistanceInSeconds = desiredTravelDistanceBeforeNextSpawn / speed;

            // Convert this time to milliseconds for the spawn interval:
            const spawnIntervalMilliseconds = timeToTravelDistanceInSeconds * 1000;

            return spawnIntervalMilliseconds;
        }

        // --- How to use it: ---

        const currentWordSpeed = 70; // pixels per second (example)
        // pixels (example: spawn a new word when the previous is 200px down)

        // Calculate the spawn interval based on current speed and desired spacing
        const ELEMENT_SPAWN_INTERVAL = createSpawnIntervalFromWordSpeed(currentWordSpeed, desiredPixelSpacing);

        console.log(`Speed: ${currentWordSpeed} px/s, Desired Spacing: ${desiredPixelSpacing} px`);
        console.log(`Calculated Spawn Interval: ${ELEMENT_SPAWN_INTERVAL} ms`);

        // Example with your "goofy" slow speed:
        const slowWordSpeed = 9; // px/s
        const slowSpawnInterval = createSpawnIntervalFromWordSpeed(slowWordSpeed, desiredPixelSpacing);
        console.log(`Speed: ${slowWordSpeed} px/s, Desired Spacing: ${desiredPixelSpacing} px`);
        console.log(`Calculated Spawn Interval for slow speed: ${slowSpawnInterval} ms`); // Should be much longer

        // Example with your "zooming" speed:
        const fastWordSpeed = 9000; // px/s
        const fastSpawnInterval = createSpawnIntervalFromWordSpeed(fastWordSpeed, desiredPixelSpacing);
        console.log(`Speed: ${fastWordSpeed} px/s, Desired Spacing: ${desiredPixelSpacing} px`);
        console.log(`Calculated Spawn Interval for fast speed: ${fastSpawnInterval} ms`); // Should be very short

        // --- Function to create a full group instance with text and ellipse ---


let pickel_svgStringValue = simplePickleSvgString; // Set to true to use the complex SVG, false for simple group


        /**
         * Creates an SVG instance from a string, appends it to the live game area,
         * and optionally adds swipe listeners and assigns a unique ID to the root element.
         *
         * @param {string} svgString - The SVG string to parse and create an instance from.
         * @param {boolean} [addSwipeListeners=true] - Whether to add swipe event listeners to the new element.
         * @param {boolean} [assignUniqueIdToRoot=false] - Whether to assign a unique ID to the root of the parsed content.
         * @param {string} [rootIdPrefix='parsedInstance_'] - The prefix for the unique ID assigned to the root element.
         * @returns {Element|null} The newly created SVG element or null if parsing failed.
         */

        function createInstanceFromSVGString(svgString, addSwipeListeners = true, assignUniqueIdToRoot = false, rootIdPrefix = 'parsedInstance_') {
    if (!liveGameArea) {
        console.error("FAILED: liveGameArea is NULL.", liveGameArea);
        return null;
    }

    if (typeof svgString !== 'string' || svgString.trim() === '') {
        console.error("FAILED: svgString is empty or not a string.", svgString);
        return null;
    }

    instanceCounter++; // Keep for unique IDs if needed

    // 1. Prepare the string for the parser
    // DOMParser typically expects a well-formed XML document.
    // If the svgString is just a fragment (e.g., just "<g>...</g>"),
    // wrap it in an <svg> tag for robust parsing.
    // If it's already a full <svg>...</svg> document, this is usually okay too.
    const wrappedSvgString = svgString.trim().startsWith('<svg') ?
        svgString :
        `<svg xmlns="http://www.w3.org/2000/svg">${svgString}</svg>`;

    if (logSVG) console.log("String to parse:", wrappedSvgString);

    // 2. Parse the SVG string
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(wrappedSvgString, "image/svg+xml");

    // Check for parser errors
    const parserError = svgDoc.querySelector("parsererror");
    if (parserError) {
        console.error("PARSER ERROR details:", parserError.textContent);
        console.error("Original string that caused error:", wrappedSvgString);
        return null;
    }

    // 3. Extract the desired element
    // If we wrapped it, the desired element is the first child of the documentElement (<svg>).
    // If the original string was already a full <svg> document, then documentElement is what we want.
    // Inside createInstanceFromSVGString, replace the newElement extraction:
        let newElement = svgDoc.documentElement; // This is the <svg> wrapper or the user's <svg>

        if (newElement && newElement.nodeName.toLowerCase() === 'svg') {
            // Find the first actual ELEMENT child within this <svg>
            let firstActualElementChild = null;
            for (let i = 0; i < newElement.childNodes.length; i++) {
                if (newElement.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                    firstActualElementChild = newElement.childNodes[i];
                    break;
                }
            }
            if (firstActualElementChild) {
                newElement = firstActualElementChild;
            } else if (!svgString.trim().startsWith('<svg')) {
                // If we wrapped it and found NO element children, something is wrong with the input
                console.error("Wrapped SVG string but found no element children within the wrapper.", svgString);
                newElement = null; // Force it to be null if no element found
            }
            // If the original string WAS an <svg>, newElement (the svgDoc.documentElement) is correct.
        }

    if (!newElement || typeof newElement.cloneNode !== 'function') {
        console.error("Failed to parse or extract a valid SVG element from the string. newElement:", newElement);
        return null;
    }

    // 4. Clone and optionally assign a unique ID to the root of the parsed content
    const clone = newElement.cloneNode(true); // Always work with a clone

    if (assignUniqueIdToRoot) {
        const uniqueId = `${rootIdPrefix}${instanceCounter}`;
        clone.setAttribute('id', uniqueId);
        if (logSVG) console.log(`Assigned unique ID to root: ${uniqueId}`);
    }


    // 5. Append to the main SVG area
    liveGameArea.appendChild(clone);
    if (logSVG) {
        const appendedId = clone.getAttribute('id') || '(no id)';
        console.log(`Successfully parsed and appended element. ID: ${appendedId}`);
    }

    // 6. Add swipe functionality (or other event listeners)
    if (addSwipeListeners) {
        clone.addEventListener('pointerdown', (event) => {
            if (swipeState.activeElement) return;

            // --- IMPLICIT PAUSE --- (Your existing logic)
            if (!gamePaused) {
                gamePaused = true;
                timeWhenPauseActuallyStarted = performance.now();
                if (logSVG || gameStateLogs) console.log("Game implicitly paused for swipe on element:", clone.id);
            }

            if (event.pointerType === 'mouse' && event.button !== 0) return;

            swipeState.startX = event.clientX;
            swipeState.startY = event.clientY;
            swipeState.startTime = performance.now();
            swipeState.activeElement = clone;
            swipeState.pointerId = event.pointerId;

            try {
                clone.setPointerCapture(event.pointerId);
            } catch (e) {
                console.warn("Could not set pointer capture on clone:", e);
            }

            document.addEventListener('pointermove', handleDocumentPointerMove, { passive: false }); // Consider passive based on need
            document.addEventListener('pointerup', handleDocumentPointerEnd);
            document.addEventListener('pointercancel', handleDocumentPointerEnd);

            event.preventDefault(); // Often good for drag interactions
            if (logSVG || gameStateLogs) console.log(`Pointer DOWN on ${clone.id || 'parsed element'}, captured pointerId: ${event.pointerId}`);


            const rect = swipeState.activeElement.getBoundingClientRect();
            swipeState.offsetX = event.clientX - rect.left;
            swipeState.offsetY = event.clientY - rect.top;
            swipeState.isDragging = true;
        });
    }

    return clone; // Return the appended clone
}
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
                if (!gamePaused && !isScoreSplatAnimating) {
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

        let pickleSpawned =false;
// Add a counter variable in a scope accessible by gameLogic
// (e.g., globally or just before gameLogic if it's not already defined elsewhere for this purpose)
let spawnCounter = 0;
const SPAWN_INTERVAL_FRAMES = 120; // Spawn roughly every 2 seconds if MAX_DELTA_TIME is ~1/60s

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
            const chefScale = 1.0;//hit detection will be that of 1.0 .. only use scale for effects!
            //spawnChefKetchupWalking(100, 100, { x: 1, y: 0 }, chefScale);
           // spawnPatrollingChef(nativeGameHeight - 100, chefScale, 50);
            // Spawning:
            //activeGameElements.push(new Player(50, nativeGameHeight - 150, "cheff_ketchup_walk", 1.0));
           // activeGameElements.push(new EnemyPatrol(200, nativeGameHeight - 150, "cheff_ketchup_walk", 1.0, 50, 80, 100, nativeGameWidth - 100));
            const eChef1 = new EnemyPatrol(
                200,
                nativeGameHeight - 150,
                "cheff_ketchup_walk",
                1.0,
                50,
                80,
                0,
                nativeGameWidth
            );

            activeGameElements.push(eChef1);
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
            currentWordIndex = 0;
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
const SPRITE_SHEET_SRC = 'images/pickle/master-sprite.png';
const ASSET_PATHS = {
    masterSheet: 'images/pickle/master-sprite.png',
    // You might still have other images for backgrounds, UI elements not on the sheet, etc.
};
// --- Global or within your game's asset loading scope ---
let spriteSheetImage = null;
let spriteSheetLoaded = false;


// ***** NEW: Define your animations from the master sheet *****
const MASTER_SHEET_FRAMES_PER_ROW = 8; // IMPORTANT: How many frames are in EACH ROW of your master sheet
// Example: If your sheet is 256px wide and frames are 32px, this is 8.
// This MUST match your actual sprite sheet layout.

const ANIMATIONS = {
    "cheff_ketchup_walk": {
        sheet: SPRITE_SHEET_SRC, // Could still be here, or even per-frame
        loop: true,              // Moved to top level of animation definition
        defaultAnimationSpeed: 300, // A fallback if a frame doesn't specify duration
        defaultAnimationSpeed: 300, // Time per frame
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
    }
    // Add more animations here following the same structure
    // "explosion": { startFrameOnSheet: 11, frameWidth: 64, frameHeight: 64, totalFramesInAnimation: 5, animationSpeed: 80, loop: false }
};
// ***************************************************************

// ... (your existing loadSpriteSheet function)
// function loadSpriteSheet(callback) { ... }


const loadedSpriteSheets = {}; // Will primarily hold loadedSpriteSheets.masterSheet
let allAssetsLoaded = false; // Or a more specific flag like masterSheetLoaded

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



class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width; // Native width
        this.height = height; // Native height
        this.isActive = true; // For easy removal
        this.type = "game_object"; // Generic
    }

    update(deltaTime, currentTime, activeGameElements) {
        // Basic update logic, maybe nothing for the base class
    }

    draw(ctx) {
        // Basic draw logic, maybe nothing
    }
}


class Sprite extends GameObject {
    constructor(x, y, animationName, spriteScale = 1.0) {
        const initialAnimDef = ANIMATIONS[animationName];
        const initialFrame = initialAnimDef.frames[0];
        // Width/height from sprite frame, scaled by spriteScale for native size
        super(x, y, initialFrame.sWidth * spriteScale, initialFrame.sHeight * spriteScale);
        this.type = "sprite";
        this.image = spriteSheetImage; // Assuming spriteSheetImage is global/accessible
        this.animationName = animationName;
        this.currentFrameIndex = 0;
        this.totalFramesInAnimation = initialAnimDef.frames.length;
        this.animationLoop = initialAnimDef.loop !== undefined ? initialAnimDef.loop : true;
        this.currentFrameDuration = initialFrame.duration || initialAnimDef.defaultAnimationSpeed || 100;
        this.lastFrameTime = 0;
        this.spriteScale = spriteScale;
        this.facingDirection = 1; // 1 for right, -1 for left
    }

    update(deltaTime, currentTime, activeGameElements) {
        super.update(deltaTime, currentTime);

        const animDef = ANIMATIONS[this.animationName];

        // **** ADD THIS CRITICAL DEBUGGING ****
        if (!animDef) {

            console.error(`ERROR in Sprite Update: No animDef for animationName: '${this.animationName}' for entity:`, this.entityType);
            this.isActive = false; // Stop this broken sprite
            return;
        }
        if (!animDef.frames) {
            console.error(`ERROR in Sprite Update: animDef for '${this.animationName}' has NO FRAMES array for entity:`, this.entityType);
            this.isActive = false;
            return;
        }

        if(debugDraw)console.log(
            `Sprite Update Pre-FrameFetch DEBUG: Entity: ${this.entityType}, Anim: ${this.animationName}, ` +
            `FrameIndex: ${this.currentFrameIndex}, TotalFrames: ${this.totalFramesInAnimation}, ` +
            `Actual Frames in animDef: ${animDef.frames.length}`
        );
        // *************************************

        const currentFrameDef = animDef.frames[this.currentFrameIndex];
        // Your existing log:
        if(debugDraw)console.log(`ANIOMATION: ${this.animationName} also the frame def: ${currentFrameDef ? 'DEFINED' : 'UNDEFINED'}`);


        if (!currentFrameDef) {
            console.error(
                `ERROR in Sprite Update: currentFrameDef is UNDEFINED. ` +
                `Anim: ${this.animationName}, Index: ${this.currentFrameIndex}, ` +
                `TotalFramesInAnimProp: ${this.totalFramesInAnimation}, FramesInDef: ${animDef.frames.length}. ` +
                `Entity: ${this.entityType}`
            );
            // Decide how to handle: stop animation, set to first frame, or deactivate
            // For now, let's prevent the crash:
            this.isActive = false; // Deactivate entity to prevent further errors this frame
            return; // Exit update for this sprite
        }

        // If we reach here, currentFrameDef IS defined.
        this.width = currentFrameDef.sWidth * this.spriteScale;
        this.height = currentFrameDef.sHeight * this.spriteScale;

        // ... (rest of animation logic: advancing frame, lastFrameTime, etc.) ...
        // THIS LOGIC BELOW IS WHAT MANAGES this.currentFrameIndex AND this.currentFrameDuration
        if (this.lastFrameTime === 0 || this.lastFrameTime === undefined) {
            this.lastFrameTime = currentTime;
        }

        if (currentTime - this.lastFrameTime >= this.currentFrameDuration) {
            this.currentFrameIndex++; // <--- Potential place index goes out of bounds

            // Logic to handle end of animation (looping, stopping, switching)
            if (this.currentFrameIndex >= this.totalFramesInAnimation) { // Or >= animDef.frames.length
                if (this.animationLoop) {
                    this.currentFrameIndex = 0;
                } else {
                    this.currentFrameIndex = this.totalFramesInAnimation - 1; // Stay on last frame
                    // ... onEnd logic if any (e.g., switchToIdle) ...
                }
            }

            // AFTER currentFrameIndex is potentially reset or capped,
            // you need to get the NEW currentFrameDef for duration and dimensions
            // (or you might have already done this if your structure differs)
            const nextFrameData = animDef.frames[this.currentFrameIndex]; // Re-fetch after index change
            if (!nextFrameData) {
                console.error(`ERROR in Sprite Update: nextFrameData is UNDEFINED after index update. Anim: ${this.animationName}, New Index: ${this.currentFrameIndex}`);
                this.isActive = false; return;
            }
            this.currentFrameDuration = nextFrameData.duration || animDef.defaultAnimationSpeed;
            // Potentially update width/height again if it changed due to frame advance
            // this.width = nextFrameData.sWidth * this.spriteScale;
            // this.height = nextFrameData.sHeight * this.spriteScale;

            this.lastFrameTime = currentTime;
        }
    }

    draw(ctx) {
        super.draw(ctx); // Call base draw if it does anything
        const animDef = ANIMATIONS[this.animationName];
        if (!animDef || !animDef.frames[this.currentFrameIndex]) return; // Safety

        const frame = animDef.frames[this.currentFrameIndex];
        const drawX = this.x;
        const drawY = this.y;
        const drawWidth = frame.sWidth * this.spriteScale;
        const drawHeight = frame.sHeight * this.spriteScale;

        ctx.save();
        if (this.facingDirection === -1) {
            // Flip context for left-facing sprite
            ctx.translate(drawX + drawWidth, drawY); // Move origin to where right edge would be
            ctx.scale(-1, 1); // Flip horizontally
            ctx.drawImage(this.image, frame.sx, frame.sy, frame.sWidth, frame.sHeight, 0, 0, drawWidth, drawHeight);
        } else {
            ctx.drawImage(this.image, frame.sx, frame.sy, frame.sWidth, frame.sHeight, drawX, drawY, drawWidth, drawHeight);
        }


        // DEBUG BOUNDARY CHECK:
        // Make sure you are using the same width calculation as in your collision logic.

        if(debugDraw) {


            const debugDrawWidth = frame.sWidth * this.spriteScale;
            const debugDrawHeight = frame.sHeight * this.spriteScale;

            // Save current global alpha and fill style
            let originalAlpha = ctx.globalAlpha;
            let originalFill = ctx.fillStyle;

            ctx.globalAlpha = 0.3; // Make it semi-transparent
            ctx.fillStyle = 'cyan';
            // Note: this.x and this.y are already in the globally transformed space's native coordinates
            // No extra translation needed here IF this.x, this.y is the top-left for drawing.
            // If your this.x/this.y is a center point, adjust drawing accordingly.
            //ctx.fillRect(this.x, this.y, debugDrawWidth, debugDrawHeight);

            // Restore alpha and fill style
            ctx.globalAlpha = originalAlpha;
            ctx.fillStyle = originalFill;
        }


        ctx.restore();
    }
}

class Character extends Sprite {
    constructor(x, y, animationName, spriteScale, health, speed) {
        super(x, y, animationName, spriteScale);
        this.entityType = "character"; // More specific
        this.health = health;
        this.speed = speed;
        this.direction = { x: 0, y: 0 };
    }

    update(deltaTime, currentTime, activeGameElements) {
        super.update(deltaTime, currentTime, activeGameElements); // Update animation

        // Movement (can be overridden by subclasses like Player or Enemy)
        this.x += this.direction.x * this.speed * deltaTime;
        this.y += this.direction.y * this.speed * deltaTime;
    }
    // draw() is inherited from Sprite
}

class Player extends Character {
    constructor(x, y, animationName, spriteScale) {
        super(x, y, animationName, spriteScale, 100, 150); // Example health and speed
        this.entityType = "player_chef";
        // Player-specific properties (score, inventory, etc.)
    }

    update(deltaTime, currentTime, activeGameElements) {
        // Player-specific input handling to set this.direction
        // handlePlayerInput(this); // A function that modifies this.direction based on keys

        super.update(deltaTime, currentTime, activeGameElements); // Call Character's update for movement & animation
        // Player-specific logic (e.g., shooting, interacting)
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
        scale: scale,
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
        if(debugDraw)console.log(`Patrolling Chef spawned at (${startX},${startY}), speed: ${speed}, scale: ${scale}`);
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

// Option B: Modifying an existing spawnChefKetchup if you prefer
// function spawnChefKetchup(x, y, initialAnimation = "cheff_ketchup_idle", customOverrides = {}) {
//     const defaultChefProps = {
//         entityType: 'enemy_chef_ketchup',
//         health: 100,
//         direction: { x: 0, y: 0 }, // Default to no initial movement or a specific idle direction
//         // ... other defaults
//     };
//
//     const finalProps = { ...defaultChefProps, ...customOverrides }; // Merge overrides
//
//     chefKetchup = spawnAnimatedSprite(initialAnimation, x, y, finalProps);
//     // ...
// }



function spawnTestRectangle() {
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



// At the start or in your resize handler:
let nativeGameWidth = 1280; // Your chosen native landscape width
let nativeGameHeight = 720; // Your chosen native landscape height
let nativeGameAspectRatio = nativeGameWidth / nativeGameHeight;

let currentScale = 1;
let currentOffsetX = 0;
let currentOffsetY = 0;

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
/*            if (liveGameArea) { // Make sure liveGameArea (your SVG element) exists
                fitSvgToScreenWithPadding(liveGameArea, NATIVE_SVG_WIDTH, NATIVE_SVG_HEIGHT), PADDING_VALUE;
                window.addEventListener('resize', () => {
                    fitSvgToScreenWithPadding(liveGameArea, NATIVE_SVG_WIDTH, NATIVE_SVG_HEIGHT, PADDING_VALUE);
                });
            }*/


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
                    // If you were using display: none; you'd do:
                     //settingsOverlay.style.display = 'none';
                });
            }

            addListenersForSettingsUI();
            initOrientationDetection(); // Initialize orientation detection
            //vibrateDevicePattern();
            resizeCanvasAndCalculateScale();
            // Load assets then start
            //SPRITE_SHEET_SRC
            loadSpriteSheet(() => {
                console.log("Assets loaded, ready to start or show main menu.");

            });
        });




