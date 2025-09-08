// ./BackgroundManager.js
import { BACKGROUND_LAYER_DEFINITIONS } from './backgroundConfig.js';
import { Logger } from './logger.js'; // Assuming you have a Logger

export class BackgroundManager {
    constructor() {
        this.layers = []; // Will store processed layer objects
        this.assetManager = null;
    }

    /**
     * Loads and prepares background layers based on the level data.
     * @param {object} levelData - The loaded level JSON data.
     * @param {object} assetManagerInstance - The global asset manager instance.
     */
    loadLevelBackgrounds(levelData, assetManagerInstance) {
        this.layers = []; // Clear any previous layers
        this.assetManager = assetManagerInstance;

        if (!levelData || !levelData.backgroundLayers || !Array.isArray(levelData.backgroundLayers)) {
            Logger.info('[BackgroundManager] No backgroundLayers array in level data or it is not an array. No backgrounds will be drawn.');
            return;
        }

        if (!this.assetManager) {
            Logger.error('[BackgroundManager] AssetManager instance not provided. Cannot load background images.');
            return;
        }

        levelData.backgroundLayers.forEach(layerInfo => {
            const definition = BACKGROUND_LAYER_DEFINITIONS[layerInfo.id];
            if (!definition) {
                Logger.warn(`[BackgroundManager] No background definition found for ID: ${layerInfo.id}`);
                return;
            }

            const image = this.assetManager.getAsset(definition.assetKey);
            if (!image) {
                Logger.warn(`[BackgroundManager] Image not found in AssetManager for key: ${definition.assetKey} (for layer ID: ${layerInfo.id})`);
                return;
            }

            const processedLayer = {
                image: image,
                assetKey: definition.assetKey,
                scrollFactorX: layerInfo.scrollFactorX !== undefined ? layerInfo.scrollFactorX : definition.scrollFactorX,
                scrollFactorY: layerInfo.scrollFactorY !== undefined ? layerInfo.scrollFactorY : definition.scrollFactorY,
                repeatX: layerInfo.repeatX !== undefined ? layerInfo.repeatX : definition.repeatX,
                repeatY: layerInfo.repeatY !== undefined ? layerInfo.repeatY : definition.repeatY,
                yOffset: (layerInfo.yOffset !== undefined ? layerInfo.yOffset : definition.yOffset) || 0,
                zIndex: definition.zIndex !== undefined ? definition.zIndex : (this.layers.length),
                imgWidth: image.width,
                imgHeight: image.height
            };
            this.layers.push(processedLayer);
        });

        this.layers.sort((a, b) => a.zIndex - b.zIndex);
        Logger.info(`[BackgroundManager] Processed ${this.layers.length} background layers.`);
    }

    /**
     * Draws all active background layers with parallax scrolling.
     * @param {CanvasRenderingContext2D} ctx - The rendering context.
     * @param {object} camera - The game camera object (needs x, y, width, height properties).
     */
    draw(ctx, camera) {
        if (!camera) {
            Logger.warn('[BackgroundManager] Camera not available, cannot draw backgrounds.');
            return;
        }

        this.layers.forEach(layer => {
            if (!layer.image || layer.imgWidth === 0 || layer.imgHeight === 0) return;

            const camX = camera.x;
            const camY = camera.y;
            
            let layerBaseX = (camX * layer.scrollFactorX);
            let layerBaseY = (camY * layer.scrollFactorY) + layer.yOffset;

            ctx.save();

            let drawOffsetX = 0;
            let drawOffsetY = 0;

            if (layer.repeatX) {
                drawOffsetX = - (layerBaseX % layer.imgWidth);
                if (drawOffsetX > 0) drawOffsetX -= layer.imgWidth;
            } else {
                drawOffsetX = -layerBaseX;
            }

            if (layer.repeatY) {
                drawOffsetY = - (layerBaseY % layer.imgHeight);
                if (drawOffsetY > 0) drawOffsetY -= layer.imgHeight;
            } else {
                drawOffsetY = -layerBaseY;
            }
            
            // DEBUG LOG 1 (Added)
            if (layer.assetKey === 'bg_mountains_distant') {
                Logger.debug(`[BG DEBUG mountains] CamX: ${camX.toFixed(2)}, LayerBaseX: ${layerBaseX.toFixed(2)}, ImgWidth: ${layer.imgWidth}, DrawOffsetX: ${drawOffsetX.toFixed(2)}, CamWidth: ${camera.width.toFixed(2)}, RepeatX: ${layer.repeatX}`);
            }
            
            let currentDrawX = drawOffsetX;
            while (currentDrawX < camera.width) {
                // DEBUG LOG 2 (Added)
                if (layer.assetKey === 'bg_mountains_distant' && layer.repeatX) {
                    Logger.debug(`[BG DEBUG mountains DrawLoop] Attempting to draw tile at currentDrawX: ${currentDrawX.toFixed(2)}`);
                }
                let currentDrawY = drawOffsetY;
                while (currentDrawY < camera.height) {
                    ctx.drawImage(layer.image, currentDrawX, currentDrawY, layer.imgWidth, layer.imgHeight);
                    if (!layer.repeatY) break; 
                    currentDrawY += layer.imgHeight;
                }
                if (!layer.repeatX) break; 
                currentDrawX += layer.imgWidth;
            }
            
            ctx.restore();
        });
    }
}
