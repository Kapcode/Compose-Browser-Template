// TilemapRenderer.js
import * as globals from './globals.js';
import { assetManager} from './AssetManager.js';
import { Logger } from './logger.js';
export class TilemapRenderer {
    constructor(levelTileData, tileConfig) {
        this.tileData = levelTileData; // The tilemap array from levelX.json (e.g., [[1,0,1], [2,2,0]])
        this.tileConfig = tileConfig;
        this.tileSize = this.tileConfig.TILE_SIZE;
        this.rows = this.tileData.length;
        this.cols = this.tileData[0] ? this.tileData[0].length : 0; // Get dimensions

        // THE CRITICAL LINES:
        this.masterSpriteData = assetManager.getSpriteData(globals.MASTER_SPRITE_SHEET_KEY);
        // Line ~14 or ~15:
        this.spriteData = assetManager.getSpriteData(); // For the JSON data
        this.masterSheet = assetManager.getSpriteSheetImage(globals.MASTER_SPRITE_SHEET_KEY); // MASTER_SPRITE_SHEET_KEY is likely "master_spritesheet"
        if (!this.masterSheet || !this.masterSpriteData) {
            Logger.error("TilemapRenderer: Master spritesheet or sprite data not found!");
            // Your new log:
            Logger.trace(`[TilemapRenderer] Master Sheet:`, this.masterSheet); // This prints null
        }
        Logger.trace(`[TilemapRenderer] Initialized for a ${this.cols}x${this.rows} map with tileSize ${this.tileSize}.`);
    }

    draw(ctx, camera, options = {}) { // Pass the camera object to the draw method
        const bufferl = options.bufferTiles !== undefined ? Math.max(0, options.bufferTiles) : 0;
        Logger.trace("EFFECTIVE BUFFER VALUE:", bufferl);
        if (!this.masterSheet || !this.masterSpriteData || !this.tileData) {
            Logger.warn("[TilemapRenderer.draw] Assets not ready or tileData missing.");
            return;
        }
        if (!camera || camera.x === undefined || camera.y === undefined || camera.width === undefined || camera.height === undefined) {
            Logger.warn("[TilemapRenderer.draw] Invalid camera object provided.");
            return;
        }
        if (!this.tileSize || this.tileSize <= 0) {
            Logger.warn("[TilemapRenderer.draw] Invalid tileSize.");
            return;
        }

        const buffer = options.bufferTiles !== undefined ? Math.max(0, options.bufferTiles) : 0; // Ensure buffer is not negative

        // Calculate which part of the map is visible through the camera
        let calculatedStartCol = Math.floor(camera.x / this.tileSize);
        let calculatedEndCol = Math.ceil((camera.x + camera.width) / this.tileSize); // Use ceil to include partially visible tiles
        let calculatedStartRow = Math.floor(camera.y / this.tileSize);
        let calculatedEndRow = Math.ceil((camera.y + camera.height) / this.tileSize); // Use ceil

        const startCol = calculatedStartCol + buffer;
        const endCol = calculatedEndCol + buffer;

        // --- ADD THESE LINES ---
        const startRow = calculatedStartRow + buffer;
        const endRow = calculatedEndRow + buffer; // Or just calculatedEndRow + buffer;
        // --- END OF ADDED LINES ---

        Logger.trace("[TM RENDER] Map Dims for Clamping: cols=", this.cols, "rows=", this.rows);




        // --- DETAILED LOGS ---
       // Logger.trace(`%c[TilemapRenderer.draw] PlayerY: ${camera.target ? camera.target.y : 'N/A'}`, "background: #eee; color: #333");
        //Logger.trace(`%c  Camera Viewport: x=${camX.toFixed(2)}, y=${camY.toFixed(2)}, w=${camWidth}, h=${camHeight}`, "color: blue;");
        //Logger.trace(`%c  Tile Size: ${tileSize}`, "color: blue;");
        //Logger.trace(`%c  Calculated Tile Indices: startCol=${startCol}, endCol=${endCol}, startRow=${startRow}, endRow=${endRow}`, "color: green; font-weight: bold;");

        // Calculate which part of the map is visible through the camera
        let viewStartCol = Math.floor(camera.x / this.tileSize);
        let viewEndCol = Math.ceil((camera.x + camera.width) / this.tileSize);
        let viewStartRow = Math.floor(camera.y / this.tileSize);
        let viewEndRow = Math.ceil((camera.y + camera.height) / this.tileSize);
        Logger.trace(`[TM VIEW] View Tile Range: C(${viewStartCol}-${viewEndCol}), R(${viewStartRow}-${viewEndRow})`);


        const bufferedStartCol = viewStartCol - buffer;
        const bufferedEndCol = viewEndCol + buffer;
        const bufferedStartRow = viewStartRow - buffer;
        const bufferedEndRow = viewEndRow + buffer;




        //should be
        // Clamp to map boundaries
        const clampedStartCol = Math.max(0, bufferedStartCol);         // Uses bufferedStartCol
        const clampedEndCol = Math.min(this.cols - 1, bufferedEndCol); // Uses bufferedEndCol
        const clampedStartRow = Math.max(0, bufferedStartRow);         // Uses bufferedStartRow
        const clampedEndRow = Math.min(this.rows - 1, bufferedEndRow); // Uses bufferedEndRow
        Logger.trace(`[TM BUFFERED] Buffered Tile Range (pre-clamp): C(${bufferedStartCol}-${bufferedEndCol}), R(${bufferedStartRow}-${bufferedEndRow})`);

        Logger.trace("[TM RENDER] Map Dims for Clamping: cols=", this.cols, "rows=", this.rows);
        // Clamp to map boundaries
        Logger.trace(`[TM CLAMPED] Final Loop Tile Range: C(${clampedStartCol}-${clampedEndCol}), R(${clampedStartRow}-${clampedEndRow})`);

        // Your old log line for PlayerY can stay
        Logger.trace(`%c[TilemapRenderer.draw] PlayerY: ${camera.target ? camera.target.y : 'N/A'}`, "background: #eee; color: #333");
        // Remove or comment out your old line 69 log to avoid confusion with the new ones above.







        for (let row = clampedStartRow; row <= clampedEndRow; row++) {
            for (let col = clampedStartCol; col <= clampedEndCol; col++) {
                const tileId = this.tileData[row][col];
                const tileTypeInfo = this.tileConfig.MAP[tileId];

                if (tileTypeInfo && tileTypeInfo.spriteName) {
                    const spriteInfo = this.masterSpriteData.frames[tileTypeInfo.spriteName];
                    if (spriteInfo) {
                        const sourceX = spriteInfo.frame.x;
                        const sourceY = spriteInfo.frame.y;
                        const sourceWidth = spriteInfo.frame.w;
                        const sourceHeight = spriteInfo.frame.h;

                       // const drawX = col * this.tileSize;
                       // const drawY = row * this.tileSize;
                        const screenDrawX = col * this.tileSize - camera.x;
                        const screenDrawY = row * this.tileSize - camera.y;
                        // The actual drawing on the canvas.
                        // The camera.apply(ctx) in the main game loop will handle translating this
                        // to the correct screen position.
                        ctx.drawImage(
                            this.masterSheet,
                            sourceX, sourceY, sourceWidth, sourceHeight,
                            screenDrawX, screenDrawY, this.tileSize, this.tileSize
                        );
                    } else {
                        // Logger.warn(`TilemapRenderer: Sprite '${tileTypeInfo.spriteName}' not found in master sheet data for tile ID ${tileId}.`);
                    }
                }
            }
        }
    }

    // Helper function to get tile type at a specific world coordinate (useful for collision)
    getTileAt(worldX, worldY) {
        if (!this.tileData) return null;
        const col = Math.floor(worldX / this.tileSize);
        const row = Math.floor(worldY / this.tileSize);

        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            const tileId = this.tileData[row][col];
            return this.tileConfig.MAP[tileId] ? { id: tileId, ...this.tileConfig.MAP[tileId] } : null;
        }
        return null; // Out of bounds
    }

    // Get tile by grid coordinates
    getTileByGrid(col, row) {
        if (!this.tileData) return null;
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            const tileId = this.tileData[row][col];
            return this.tileConfig.MAP[tileId] ? { id: tileId, ...this.tileConfig.MAP[tileId] } : null;
        }
        return null;
    }

    getMapWidth() {
        return this.cols * this.tileSize;
    }

    getMapHeight() {
        return this.rows * this.tileSize;
    }
}
