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
      <div className="h-12 bg-[#18182f] border-b border-white/10 flex items-center justify-between px-3 shrink-0">
        {/* Left: Back + Name */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => router.push("/dashboard/designs")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {isEditing ? (
            <Input
              value={designName}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
              autoFocus
              className="w-56 h-7 text-sm font-medium bg-white/10 border-white/20 text-white"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="font-medium text-sm text-white/90 hover:bg-white/10 px-2 py-1 rounded transition-colors max-w-[200px] truncate"
            >
              {designName || "Untitled Design"}
            </button>
          )}

          {lastSaved && (
            <span className="text-[10px] text-white/40 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" />
              Saved
            </span>
          )}
        </div>

        {/* Center: Undo/Redo + Size */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => canvasRef.current?.undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => canvasRef.current?.redo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>

          <div className="mx-1.5 h-5 w-px bg-white/10" />

          {/* Size selector */}
          <div className="relative">
            <button
              onClick={() => setShowSizeMenu(!showSizeMenu)}
              className="flex items-center gap-1.5 text-[11px] text-white/60 font-mono hover:bg-white/10 px-2 py-1 rounded transition-colors"
            >
              <Ruler className="w-3 h-3" />
              {canvasWidth} x {canvasHeight}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showSizeMenu && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setShowSizeMenu(false)} />
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 bg-[#1e1e3a] border border-white/10 rounded-lg shadow-2xl w-64 max-h-96 overflow-y-auto">
                  <div className="p-2 space-y-0.5">
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-2 py-1">Presets</p>
                    {DESIGN_SIZES.filter(s => s.name !== "Custom").map((size) => (
                      <button
                        key={size.name}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs hover:bg-white/10 transition-colors flex justify-between items-center text-white/80 ${
                          canvasWidth === size.width && canvasHeight === size.height ? 'bg-violet-500/20 text-violet-300 font-medium' : ''
                        }`}
                        onClick={() => {
                          onSizeChange?.(size.width, size.height);
                          setCustomW(String(size.width));
                          setCustomH(String(size.height));
                          setShowSizeMenu(false);
                        }}
                      >
                        <span>{size.name}</span>
                        <span className="text-[10px] text-white/40">{size.width}x{size.height}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/10 p-3 space-y-2">
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Custom</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={customW}
                        onChange={(e) => setCustomW(e.target.value)}
                        className="h-7 text-xs bg-white/5 border-white/10 text-white"
                        placeholder="W"
                        min={1}
                        max={10000}
                      />
                      <span className="text-xs text-white/40">x</span>
                      <Input
                        type="number"
                        value={customH}
                        onChange={(e) => setCustomH(e.target.value)}
                        className="h-7 text-xs bg-white/5 border-white/10 text-white"
                        placeholder="H"
                        min={1}
                        max={10000}
                      />
                    </div>
                    <Button size="sm" className="w-full h-7 text-xs bg-violet-600 hover:bg-violet-700" onClick={handleCustomSize}>
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
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="gap-1.5 text-white/70 hover:text-white hover:bg-white/10 h-8 text-xs"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </Button>

          <Button
            size="sm"
            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs"
            onClick={() => setShowExport(true)}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

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
