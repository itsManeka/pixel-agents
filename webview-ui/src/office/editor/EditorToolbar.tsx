import { useCallback, useEffect, useRef, useState } from 'react';

import { getColorizedSprite } from '../colorize.js';
import { getColorizedFloorSprite, getFloorPatternCount, hasFloorSprites } from '../floorTiles.js';
import type { FurnitureCategory, LoadedAssetData } from '../layout/furnitureCatalog.js';
import {
  buildDynamicCatalog,
  getActiveCategories,
  getCatalogByCategory,
} from '../layout/furnitureCatalog.js';
import { getCachedSprite } from '../sprites/spriteCache.js';
import type { FloorColor, TileType as TileTypeVal } from '../types.js';
import { EditTool } from '../types.js';
import { getWallSetCount, getWallSetPreviewSprite } from '../wallTiles.js';

interface EditorToolbarProps {
  activeTool: EditTool;
  selectedTileType: TileTypeVal;
  selectedFurnitureType: string;
  selectedFurnitureUid: string | null;
  selectedFurnitureColor: FloorColor | null;
  floorColor: FloorColor;
  wallColor: FloorColor;
  selectedWallSet: number;
  onToolChange: (tool: EditTool) => void;
  onTileTypeChange: (type: TileTypeVal) => void;
  onFloorColorChange: (color: FloorColor) => void;
  onWallColorChange: (color: FloorColor) => void;
  onWallSetChange: (setIndex: number) => void;
  onSelectedFurnitureColorChange: (color: FloorColor | null) => void;
  onFurnitureTypeChange: (type: string) => void;
  loadedAssets?: LoadedAssetData;
}

/** Render a floor pattern preview at 2x (32x32 canvas showing the 16x16 tile) */
function FloorPatternPreview({
  patternIndex,
  color,
  selected,
  onClick,
}: {
  patternIndex: number;
  color: FloorColor;
  selected: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displaySize = 32;
  const tileZoom = 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = displaySize;
    canvas.height = displaySize;
    ctx.imageSmoothingEnabled = false;

    if (!hasFloorSprites()) {
      ctx.fillStyle = '#444';
      ctx.fillRect(0, 0, displaySize, displaySize);
      return;
    }

    const sprite = getColorizedFloorSprite(patternIndex, color);
    const cached = getCachedSprite(sprite, tileZoom);
    ctx.drawImage(cached, 0, 0);
  }, [patternIndex, color]);

  return (
    <button
      onClick={onClick}
      title={`Floor ${patternIndex}`}
      className={selected ? 'pixel-thumb-btn-selected' : 'pixel-thumb-btn'}
      style={{ width: displaySize, height: displaySize }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: displaySize, height: displaySize, display: 'block' }}
      />
    </button>
  );
}

/** Render a wall set preview showing the first piece (bitmask 0, 16×32) at 1x scale */
function WallSetPreview({
  setIndex,
  color,
  selected,
  onClick,
}: {
  setIndex: number;
  color: FloorColor;
  selected: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayW = 32;
  const displayH = 64;
  const previewZoom = 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = displayW;
    canvas.height = displayH;
    ctx.imageSmoothingEnabled = false;

    const sprite = getWallSetPreviewSprite(setIndex);
    if (!sprite) {
      ctx.fillStyle = '#444';
      ctx.fillRect(0, 0, displayW, displayH);
      return;
    }

    // Colorize the preview sprite using the same colorize path as rendering
    const cacheKey = `wall-preview-${setIndex}-${color.h}-${color.s}-${color.b}-${color.c}`;
    const colorized = getColorizedSprite(cacheKey, sprite, { ...color, colorize: true });
    const cached = getCachedSprite(colorized, previewZoom);
    ctx.drawImage(cached, 0, 0);
  }, [setIndex, color]);

  return (
    <button
      onClick={onClick}
      title={`Wall ${setIndex + 1}`}
      className={selected ? 'pixel-thumb-btn-selected' : 'pixel-thumb-btn'}
      style={{ width: displayW, height: displayH }}
    >
      <canvas ref={canvasRef} style={{ width: displayW, height: displayH, display: 'block' }} />
    </button>
  );
}

/** Slider control for a single color parameter */
function ColorSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[20px] text-[#999] w-28 text-right shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-12"
        style={{ accentColor: 'rgba(90, 140, 255, 0.8)' }}
      />
      <span className="text-[20px] text-[#999] w-48 text-right shrink-0">{value}</span>
    </div>
  );
}

const DEFAULT_FURNITURE_COLOR: FloorColor = { h: 0, s: 0, b: 0, c: 0 };

export function EditorToolbar({
  activeTool,
  selectedTileType,
  selectedFurnitureType,
  selectedFurnitureUid,
  selectedFurnitureColor,
  floorColor,
  wallColor,
  selectedWallSet,
  onToolChange,
  onTileTypeChange,
  onFloorColorChange,
  onWallColorChange,
  onWallSetChange,
  onSelectedFurnitureColorChange,
  onFurnitureTypeChange,
  loadedAssets,
}: EditorToolbarProps) {
  const [activeCategory, setActiveCategory] = useState<FurnitureCategory>('desks');
  const [showColor, setShowColor] = useState(false);
  const [showWallColor, setShowWallColor] = useState(false);
  const [showFurnitureColor, setShowFurnitureColor] = useState(false);

  // Build dynamic catalog from loaded assets
  useEffect(() => {
    if (loadedAssets) {
      try {
        console.log(
          `[EditorToolbar] Building dynamic catalog with ${loadedAssets.catalog.length} assets...`,
        );
        const success = buildDynamicCatalog(loadedAssets);
        console.log(`[EditorToolbar] Catalog build result: ${success}`);

        // Reset to first available category if current doesn't exist
        const activeCategories = getActiveCategories();
        if (activeCategories.length > 0) {
          const firstCat = activeCategories[0]?.id;
          if (firstCat) {
            console.log(`[EditorToolbar] Setting active category to: ${firstCat}`);
            setActiveCategory(firstCat);
          }
        }
      } catch (err) {
        console.error(`[EditorToolbar] Error building dynamic catalog:`, err);
      }
    }
  }, [loadedAssets]);

  const handleColorChange = useCallback(
    (key: keyof FloorColor, value: number) => {
      onFloorColorChange({ ...floorColor, [key]: value });
    },
    [floorColor, onFloorColorChange],
  );

  const handleWallColorChange = useCallback(
    (key: keyof FloorColor, value: number) => {
      onWallColorChange({ ...wallColor, [key]: value });
    },
    [wallColor, onWallColorChange],
  );

  // For selected furniture: use existing color or default
  const effectiveColor = selectedFurnitureColor ?? DEFAULT_FURNITURE_COLOR;
  const handleSelFurnColorChange = useCallback(
    (key: keyof FloorColor, value: number) => {
      onSelectedFurnitureColorChange({ ...effectiveColor, [key]: value });
    },
    [effectiveColor, onSelectedFurnitureColorChange],
  );

  const categoryItems = getCatalogByCategory(activeCategory);

  const patternCount = getFloorPatternCount();
  // Wall is TileType 0, floor patterns are 1..patternCount
  const floorPatterns = Array.from({ length: patternCount }, (_, i) => i + 1);

  const thumbSize = 36; // 2x for items

  const isFloorActive = activeTool === EditTool.TILE_PAINT || activeTool === EditTool.EYEDROPPER;
  const isWallActive = activeTool === EditTool.WALL_PAINT;
  const isEraseActive = activeTool === EditTool.ERASE;
  const isFurnitureActive =
    activeTool === EditTool.FURNITURE_PLACE || activeTool === EditTool.FURNITURE_PICK;

  return (
    <div className="absolute bottom-68 left-10 z-50 pixel-panel py-6 px-8 flex flex-col-reverse gap-6 max-w-[calc(100vw-20px)]">
      {/* Tool row — at the bottom */}
      <div className="flex gap-4 flex-wrap">
        <button
          className={isFloorActive ? 'pixel-editor-btn-active' : 'pixel-editor-btn'}
          onClick={() => onToolChange(EditTool.TILE_PAINT)}
          title="Paint floor tiles"
        >
          Floor
        </button>
        <button
          className={isWallActive ? 'pixel-editor-btn-active' : 'pixel-editor-btn'}
          onClick={() => onToolChange(EditTool.WALL_PAINT)}
          title="Paint walls (click to toggle)"
        >
          Wall
        </button>
        <button
          className={isEraseActive ? 'pixel-editor-btn-active' : 'pixel-editor-btn'}
          onClick={() => onToolChange(EditTool.ERASE)}
          title="Erase tiles to void"
        >
          Erase
        </button>
        <button
          className={isFurnitureActive ? 'pixel-editor-btn-active' : 'pixel-editor-btn'}
          onClick={() => onToolChange(EditTool.FURNITURE_PLACE)}
          title="Place furniture"
        >
          Furniture
        </button>
      </div>

      {/* Sub-panel: Floor tiles — stacked bottom-to-top via column-reverse */}
      {isFloorActive && (
        <div className="flex flex-col-reverse gap-6">
          {/* Color toggle + Pick — just above tool row */}
          <div className="flex gap-4 items-center">
            <button
              className={showColor ? 'pixel-editor-btn-active' : 'pixel-editor-btn'}
              onClick={() => setShowColor((v) => !v)}
              title="Adjust floor color"
            >
              Color
            </button>
            <button
              className={
                activeTool === EditTool.EYEDROPPER ? 'pixel-editor-btn-active' : 'pixel-editor-btn'
              }
              onClick={() => onToolChange(EditTool.EYEDROPPER)}
              title="Pick floor pattern + color from existing tile"
            >
              Pick
            </button>
          </div>

          {/* Color controls (collapsible) — above Wall/Color/Pick */}
          {showColor && (
            <div className="pixel-color-panel">
              <ColorSlider
                label="H"
                value={floorColor.h}
                min={0}
                max={360}
                onChange={(v) => handleColorChange('h', v)}
              />
              <ColorSlider
                label="S"
                value={floorColor.s}
                min={0}
                max={100}
                onChange={(v) => handleColorChange('s', v)}
              />
              <ColorSlider
                label="B"
                value={floorColor.b}
                min={-100}
                max={100}
                onChange={(v) => handleColorChange('b', v)}
              />
              <ColorSlider
                label="C"
                value={floorColor.c}
                min={-100}
                max={100}
                onChange={(v) => handleColorChange('c', v)}
              />
            </div>
          )}

          {/* Floor pattern horizontal carousel — at the top */}
          <div className="pixel-carousel">
            {floorPatterns.map((patIdx) => (
              <FloorPatternPreview
                key={patIdx}
                patternIndex={patIdx}
                color={floorColor}
                selected={selectedTileType === patIdx}
                onClick={() => onTileTypeChange(patIdx as TileTypeVal)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sub-panel: Wall — stacked bottom-to-top via column-reverse */}
      {isWallActive && (
        <div className="flex flex-col-reverse gap-6">
          {/* Color toggle — just above tool row */}
          <div className="flex gap-4 items-center">
            <button
              className={showWallColor ? 'pixel-editor-btn-active' : 'pixel-editor-btn'}
              onClick={() => setShowWallColor((v) => !v)}
              title="Adjust wall color"
            >
              Color
            </button>
          </div>

          {/* Color controls (collapsible) */}
          {showWallColor && (
            <div className="pixel-color-panel">
              <ColorSlider
                label="H"
                value={wallColor.h}
                min={0}
                max={360}
                onChange={(v) => handleWallColorChange('h', v)}
              />
              <ColorSlider
                label="S"
                value={wallColor.s}
                min={0}
                max={100}
                onChange={(v) => handleWallColorChange('s', v)}
              />
              <ColorSlider
                label="B"
                value={wallColor.b}
                min={-100}
                max={100}
                onChange={(v) => handleWallColorChange('b', v)}
              />
              <ColorSlider
                label="C"
                value={wallColor.c}
                min={-100}
                max={100}
                onChange={(v) => handleWallColorChange('c', v)}
              />
            </div>
          )}

          {/* Wall set picker — horizontal carousel at the top */}
          {getWallSetCount() > 0 && (
            <div className="pixel-carousel">
              {Array.from({ length: getWallSetCount() }, (_, i) => (
                <WallSetPreview
                  key={i}
                  setIndex={i}
                  color={wallColor}
                  selected={selectedWallSet === i}
                  onClick={() => onWallSetChange(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-panel: Furniture — stacked bottom-to-top via column-reverse */}
      {isFurnitureActive && (
        <div className="flex flex-col-reverse gap-4">
          {/* Category tabs + Pick — just above tool row */}
          <div className="flex gap-2 flex-wrap items-center">
            {getActiveCategories().map((cat) => (
              <button
                key={cat.id}
                className={activeCategory === cat.id ? 'pixel-tab-active' : 'pixel-tab'}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
            <div className="w-[1px] h-14 bg-white/15 mx-2 shrink-0" />
            <button
              className={
                activeTool === EditTool.FURNITURE_PICK
                  ? 'pixel-editor-btn-active'
                  : 'pixel-editor-btn'
              }
              onClick={() => onToolChange(EditTool.FURNITURE_PICK)}
              title="Pick furniture type from placed item"
            >
              Pick
            </button>
          </div>
          {/* Furniture items — single-row horizontal carousel at 2x */}
          <div className="pixel-carousel">
            {categoryItems.map((entry) => {
              const cached = getCachedSprite(entry.sprite, 2);
              const isSelected = selectedFurnitureType === entry.type;
              return (
                <button
                  key={entry.type}
                  onClick={() => onFurnitureTypeChange(entry.type)}
                  title={entry.label}
                  className={`${isSelected ? 'pixel-thumb-btn-selected' : 'pixel-thumb-btn'} flex items-center justify-center`}
                  style={{ width: thumbSize, height: thumbSize }}
                >
                  <canvas
                    ref={(el) => {
                      if (!el) return;
                      const ctx = el.getContext('2d');
                      if (!ctx) return;
                      const scale =
                        Math.min(thumbSize / cached.width, thumbSize / cached.height) * 0.85;
                      el.width = thumbSize;
                      el.height = thumbSize;
                      ctx.imageSmoothingEnabled = false;
                      ctx.clearRect(0, 0, thumbSize, thumbSize);
                      const dw = cached.width * scale;
                      const dh = cached.height * scale;
                      ctx.drawImage(cached, (thumbSize - dw) / 2, (thumbSize - dh) / 2, dw, dh);
                    }}
                    style={{ width: thumbSize, height: thumbSize }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected furniture color panel — shows when any placed furniture item is selected */}
      {selectedFurnitureUid && (
        <div className="flex flex-col-reverse gap-3">
          <div className="flex gap-4 items-center">
            <button
              className={showFurnitureColor ? 'pixel-editor-btn-active' : 'pixel-editor-btn'}
              onClick={() => setShowFurnitureColor((v) => !v)}
              title="Adjust selected furniture color"
            >
              Color
            </button>
            {selectedFurnitureColor && (
              <button
                className="pixel-editor-btn text-[20px] py-2 px-6"
                onClick={() => onSelectedFurnitureColorChange(null)}
                title="Remove color (restore original)"
              >
                Clear
              </button>
            )}
          </div>
          {showFurnitureColor && (
            <div className="pixel-color-panel">
              {effectiveColor.colorize ? (
                <>
                  <ColorSlider
                    label="H"
                    value={effectiveColor.h}
                    min={0}
                    max={360}
                    onChange={(v) => handleSelFurnColorChange('h', v)}
                  />
                  <ColorSlider
                    label="S"
                    value={effectiveColor.s}
                    min={0}
                    max={100}
                    onChange={(v) => handleSelFurnColorChange('s', v)}
                  />
                </>
              ) : (
                <>
                  <ColorSlider
                    label="H"
                    value={effectiveColor.h}
                    min={-180}
                    max={180}
                    onChange={(v) => handleSelFurnColorChange('h', v)}
                  />
                  <ColorSlider
                    label="S"
                    value={effectiveColor.s}
                    min={-100}
                    max={100}
                    onChange={(v) => handleSelFurnColorChange('s', v)}
                  />
                </>
              )}
              <ColorSlider
                label="B"
                value={effectiveColor.b}
                min={-100}
                max={100}
                onChange={(v) => handleSelFurnColorChange('b', v)}
              />
              <ColorSlider
                label="C"
                value={effectiveColor.c}
                min={-100}
                max={100}
                onChange={(v) => handleSelFurnColorChange('c', v)}
              />
              <label className="flex items-center gap-4 text-[20px] text-[#999] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!effectiveColor.colorize}
                  onChange={(e) =>
                    onSelectedFurnitureColorChange({
                      ...effectiveColor,
                      colorize: e.target.checked || undefined,
                    })
                  }
                  style={{ accentColor: 'rgba(90, 140, 255, 0.8)' }}
                />
                Colorize
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
