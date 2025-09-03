// TilemapRenderer.js
import * as globals from './globals.js';
import { assetManager} from './AssetManager.js';
export class TilemapRenderer {
    constructor(levelTileData, tileConfig) {
        this.tileData = levelTileData; // The tilemap array from levelX.json (e.g., [[1,0,1], [2,2,0]])
        this.tileConfig = tileConfig;
        this.tileSize = this.tileConfig.TILE_SIZE;
        this.rows = this.tileData.length;
        this.cols = this.tileData[0] ? this.tileData[0].length : 0; // Get dimensions

        this.masterSheet = assetManager.getAsset(globals.MASTER_SPRITE_SHEET_KEY);
        this.masterSpriteData = assetManager.getSpriteData(globals.MASTER_SPRITE_SHEET_KEY);

        if (!this.masterSheet || !this.masterSpriteData) {
            console.error("TilemapRenderer: Master spritesheet or sprite data not found!");
        }
        console.log(`[TilemapRenderer] Initialized for a ${this.cols}x${this.rows} map with tileSize ${this.tileSize}.`);
    }

    draw(ctx, camera) { // Pass the camera object to the draw method
        if (!this.masterSheet || !this.masterSpriteData || !this.tileData) {
            return;
        }

        // Calculate which part of the map is visible through the camera
        // This is an optimization: only draw tiles currently in the camera's view
        const startCol = Math.floor(camera.x / this.tileSize);
        const endCol = Math.ceil((camera.x + camera.width) / this.tileSize);
        const startRow = Math.floor(camera.y / this.tileSize);
        const endRow = Math.ceil((camera.y + camera.height) / this.tileSize);

        // Clamp to map boundaries
        const clampedStartCol = Math.max(0, startCol);
        const clampedEndCol = Math.min(this.cols, endCol);
        const clampedStartRow = Math.max(0, startRow);
        const clampedEndRow = Math.min(this.rows, endRow);

        for (let row = clampedStartRow; row < clampedEndRow; row++) {
            for (let col = clampedStartCol; col < clampedEndCol; col++) {
                const tileId = this.tileData[row][col];
                const tileTypeInfo = this.tileConfig.MAP[tileId];

                if (tileTypeInfo && tileTypeInfo.spriteName) {
                    const spriteInfo = this.masterSpriteData.frames[tileTypeInfo.spriteName];
                    if (spriteInfo) {
                        const sourceX = spriteInfo.frame.x;
                        const sourceY = spriteInfo.frame.y;
                        const sourceWidth = spriteInfo.frame.w;
                        const sourceHeight = spriteInfo.frame.h;

                        const drawX = col * this.tileSize;
                        const drawY = row * this.tileSize;

                        // The actual drawing on the canvas.
                        // The camera.apply(ctx) in the main game loop will handle translating this
                        // to the correct screen position.
                        ctx.drawImage(
                            this.masterSheet,
                            sourceX, sourceY, sourceWidth, sourceHeight,
                            drawX, drawY, this.tileSize, this.tileSize
                        );
                    } else {
                        // console.warn(`TilemapRenderer: Sprite '${tileTypeInfo.spriteName}' not found in master sheet data for tile ID ${tileId}.`);
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
