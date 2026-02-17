"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Download,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Loader2,
  Check,
  ChevronDown,
  Ruler,
} from "lucide-react";
import type { DesignCanvasAPI } from "./design-canvas";
import { DesignExport } from "./design-export";
import { DESIGN_SIZES } from "@/types/design";

interface DesignHeaderProps {
  designId: string | null;
  designName: string;
  onNameChange: (name: string) => void;
  canvasRef: React.RefObject<DesignCanvasAPI | null>;
  zoom: number;
  isSaving: boolean;
  lastSaved: string | null;
  onSave: () => void;
  canvasWidth: number;
  canvasHeight: number;
  onSizeChange?: (width: number, height: number) => void;
}

export function DesignHeader({
  designId,
  designName,
  onNameChange,
  canvasRef,
  zoom,
  isSaving,
  lastSaved,
  onSave,
  canvasWidth,
  canvasHeight,
  onSizeChange,
}: DesignHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [customW, setCustomW] = useState(String(canvasWidth));
  const [customH, setCustomH] = useState(String(canvasHeight));

  const handleCustomSize = () => {
    const w = parseInt(customW);
    const h = parseInt(customH);
    if (w > 0 && h > 0 && w <= 10000 && h <= 10000) {
      onSizeChange?.(w, h);
      setShowSizeMenu(false);
    }
  };

  return (
    <>
      <div className="h-14 bg-background border-b flex items-center justify-between px-4 shrink-0">
        {/* Left: Back + Name */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/designs")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {isEditing ? (
            <Input
              value={designName}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
              autoFocus
              className="w-64 h-8 text-sm font-medium"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="font-medium text-sm hover:bg-muted px-2 py-1 rounded transition-colors"
            >
              {designName || "Untitled Design"}
            </button>
          )}

          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>

        {/* Center: Undo/Redo + Zoom + Size */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => canvasRef.current?.undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => canvasRef.current?.redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>

          <div className="mx-2 h-6 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => canvasRef.current?.zoomOut()}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => canvasRef.current?.zoomIn()}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => canvasRef.current?.zoomToFit()}
            title="Fit to View (Ctrl+0)"
          >
            <Maximize className="w-4 h-4" />
          </Button>

          <div className="mx-2 h-6 w-px bg-border" />

          {/* Size selector */}
          <div className="relative">
            <button
              onClick={() => setShowSizeMenu(!showSizeMenu)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono hover:bg-muted px-2 py-1 rounded transition-colors"
            >
              <Ruler className="w-3 h-3" />
              {canvasWidth} x {canvasHeight}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showSizeMenu && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setShowSizeMenu(false)} />
                <div className="absolute top-full mt-1 right-0 z-50 bg-popover border rounded-lg shadow-lg w-64 max-h-96 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1">Preset Sizes</p>
                    {DESIGN_SIZES.filter(s => s.name !== "Custom").map((size) => (
                      <button
                        key={size.name}
                        className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-accent transition-colors flex justify-between items-center ${
                          canvasWidth === size.width && canvasHeight === size.height ? 'bg-accent font-medium' : ''
                        }`}
                        onClick={() => {
                          onSizeChange?.(size.width, size.height);
                          setCustomW(String(size.width));
                          setCustomH(String(size.height));
                          setShowSizeMenu(false);
                        }}
                      >
                        <span>{size.name}</span>
                        <span className="text-xs text-muted-foreground">{size.width}x{size.height}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Custom Size</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={customW}
                        onChange={(e) => setCustomW(e.target.value)}
                        className="h-7 text-xs"
                        placeholder="Width"
                        min={1}
                        max={10000}
                      />
                      <span className="text-xs text-muted-foreground">x</span>
                      <Input
                        type="number"
                        value={customH}
                        onChange={(e) => setCustomH(e.target.value)}
                        className="h-7 text-xs"
                        placeholder="Height"
                        min={1}
                        max={10000}
                      />
                    </div>
                    <Button size="sm" className="w-full h-7 text-xs" onClick={handleCustomSize}>
                      Apply
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Save + Export */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>

          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowExport(true)}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Export Dialog */}
      <DesignExport
        open={showExport}
        onClose={() => setShowExport(false)}
        canvasRef={canvasRef}
        designName={designName}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />
    </>
  );
}
