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
        //Logger._log(`TM: asset manager sprite data in constructor`,assetManager.getSpriteData());//crash
        //Logger._log(`TM: asset manager sprite data in constructor`,assetManager.getSpriteSheetImage(globals.MASTER_SPRITE_SHEET_KEY));//crash

       //console.log(`TM constructor: cols rows tileSize`,this.cols,this.rows,this.tileSize);//no crash

        // THE CRITICAL LINES:
        this.masterSpriteData = assetManager.getSpriteData(globals.MASTER_SPRITE_SHEET_KEY);

        // Line ~14 or ~15:
        this.spriteData = assetManager.getSpriteData(); // For the JSON data
        this.masterSheet = assetManager.getSpriteSheetImage(globals.MASTER_SPRITE_SHEET_KEY); // MASTER_SPRITE_SHEET_KEY is likely "master_spritesheet"
        //Logger._log(`TM: asset manager sprite data in constructor`,this.masterSpriteData,this.masterSheet);
        //console.log(`TM: asset manager sprite data in constructor`,JSON.stringify(this.tileData),this.masterSheet);//crash
        //Logger.trace(`TM: asset manager sprite data in constructor`,this.masterSheet);//crash //that only crashes if you dont use logger correctly. _log not log

        if (!this.masterSheet || !this.masterSpriteData) {
            Logger.error("TilemapRenderer: Master spritesheet or sprite data not found!");
            // Your new log:
           // Logger.trace(`[TilemapRenderer] Master Sheet:`, this.masterSheet); // This prints null
        }
        Logger.trace(`[TilemapRenderer] Initialized for a ${this.cols}x${this.rows} map with tileSize ${this.tileSize}.`);
    }

    draw(ctx, camera, options = {}) { // Pass the camera object to the draw method
        Logger.trace(`TilemapRenderer.draw: camera.x=${camera.x}, camera.y=${camera.y}, camera.width=${camera.width}, camera.height=${camera.height}`);
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
        Logger.trace(`TM draw pre-all-calculations: cols rows tileSize`,this.cols,this.rows,this.tileSize);

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

       // Logger.trace("[TM RENDER] Map Dims for Clamping: cols=", this.cols, "rows=", this.rows);

        Logger.trace(`[TM RENDER] (before clamp) startCol=${startCol}, endCol=${endCol}, startRow=${startRow}, endRow=${endRow}, buffer=${buffer}, tileSize=${this.tileSize}, camera.x=${camera.x}, camera.y=${camera.y}, this.cols=${this.cols}, this.rows=${this.rows}`);


        let viewStartCol = Math.floor(camera.x / this.tileSize);
        let viewEndCol = Math.ceil((camera.x + camera.width) / this.tileSize);
        let viewStartRow = Math.floor(camera.y / this.tileSize);
        let viewEndRow = Math.ceil((camera.y + camera.height) / this.tileSize);

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

        Logger.trace(`[TM CLAMPED] Clamped Tile Range: C(${clampedStartCol}-${clampedEndCol}), R(${clampedStartRow}-${clampedEndRow})`);////////////
        Logger.trace(`[TM BUFFERED] Buffered Tile Range: C(${bufferedStartCol}-${bufferedEndCol}), R(${bufferedStartRow}-${bufferedEndRow})`);
        Logger.trace(`[TM VIEW] View Tile Range: C(${viewStartCol}-${viewEndCol}), R(${viewStartRow}-${viewEndRow})`);

        let tilesProcessedInLoop = 0; // Use a different name if you already have 'tilesProcessed'
        for (let row = clampedStartRow; row <= clampedEndRow; row++) {
            for (let col = clampedStartCol; col <= clampedEndCol; col++) {
                tilesProcessedInLoop++;
                const tileId = this.tileData[row][col];
                const tileTypeInfo = this.tileConfig.MAP[tileId];

                if (tilesProcessedInLoop >= 65 && tilesProcessedInLoop <= 75) { // Log around the suspected cutoff
                    Logger.trace(`TAGGG[TM Detailed Log] Tile #${tilesProcessedInLoop} (World R:${row}, C:${col})`);
                    Logger.trace(`TAGGG  Raw tileId from tileData: ${tileId}`);
                    Logger.trace(`TAGGG  tileTypeInfo from tileConfig.MAP[${tileId}]:`, tileTypeInfo);
                    if (tileTypeInfo && tileTypeInfo.spriteName) {
                        Logger.trace(`TAGGG    tileTypeInfo.spriteName: ${tileTypeInfo.spriteName}`);
                        if (this.masterSpriteData && this.masterSpriteData.frames) {
                            const spriteInfoForThisTile = this.masterSpriteData.frames[tileTypeInfo.spriteName];
                            Logger.trace(`TAGGG    spriteInfo from masterSpriteData.frames['${tileTypeInfo.spriteName}']:`, spriteInfoForThisTile);
                            if (!spriteInfoForThisTile) {
                                Logger.trace(`TAGGG      ----> CONDITION 2 (if spriteInfo) will FAIL here!`);
                            }
                        } else {
                            Logger.trace('TAGGG      MasterSpriteData or .frames is missing!');
                        }
                    } else {
                        if (!tileTypeInfo) {
                            Logger.trace(`TAGGG      ----> CONDITION 1 (if tileTypeInfo...) will FAIL here because tileTypeInfo is falsy!`);
                        } else if (!tileTypeInfo.spriteName) {
                            Logger.trace(`TAGGG      ----> CONDITION 1 (if tileTypeInfo.spriteName...) will FAIL here because spriteName is missing/falsy!`);
                        }
                    }
                    console.groupEnd();
                }

                // Your existing drawing logic:
                if (tileTypeInfo && tileTypeInfo.spriteName) {
                    const spriteInfo = this.masterSpriteData.frames[tileTypeInfo.spriteName];
                    if (spriteInfo) {
                        const drawX = col * this.tileSize;
                        const drawY = row * this.tileSize;
                        let debug = false;
                        if (debug) {
                            ctx.strokeStyle = 'red';
                            ctx.strokeRect(drawX, drawY, this.tileSize, this.tileSize);
                        } else {
                            const sX = spriteInfo.frame.x;
                            const sY = spriteInfo.frame.y;
                            const sW = spriteInfo.frame.w;
                            const sH = spriteInfo.frame.h;
                            ctx.drawImage(
                                this.masterSheet,
                                sX, sY, sW, sH,
                                drawX, drawY, this.tileSize, this.tileSize
                            );
                        }
                    }
                }
            }
        }
        Logger.debug(`[TM] Total tiles processed by loop: ${tilesProcessedInLoop}`); // You already have a similar log

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


    // In TilemapRenderer.js

    // ... (constructor and other methods) ...

    getTileIdAt(col, row) {
        // Check bounds to prevent errors
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.tileData[row][col]; // Assuming this.tileData is your 2D array of IDs
        }
        return -1; // Or any value that your TILE_CONFIG.MAP doesn't use for actual tiles
        // This often signifies "out of bounds"
    }

    isTileSolid(col, row) {
        const tileId = this.getTileIdAt(col, row);

        // Treat out-of-bounds as solid to prevent walking off the map,
        // or return false if you want to allow falling off edges.
        if (tileId === -1) {
            // Logger.debug(`[isTileSolid] Coords (${col},${row}) are out of bounds. Treating as SOLID.`);
            return true; // Common practice to make map boundaries solid
        }

        // Get the properties for this specific tile ID from your config
        const tileProperties = this.tileConfig.MAP[tileId];

        // If there's no definition for this tileId, or if it has no 'solid' property,
        // or if 'solid' is explicitly false, then it's not solid.
        if (tileProperties && tileProperties.solid === true) { // Check for explicit true
            // Logger.debug(`[isTileSolid] Coords (${col},${row}), ID: ${tileId}. Is SOLID.`);
            return true;
        }

        // Logger.debug(`[isTileSolid] Coords (${col},${row}), ID: ${tileId}. Not solid.`);
        return false; // Default to not solid
    }


}
