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
} from "lucide-react";
import type { DesignCanvasAPI } from "./design-canvas";
import { DesignExport } from "./design-export";

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
}: DesignHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showExport, setShowExport] = useState(false);

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

        {/* Center: Undo/Redo + Zoom */}
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
          <span className="text-xs font-mono w-12 text-center" title={`Canvas: ${canvasWidth} x ${canvasHeight}px`}>
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
            title="Fit to View"
          >
            <Maximize className="w-4 h-4" />
          </Button>

          <div className="mx-2 h-6 w-px bg-border" />

          <span className="text-[10px] text-muted-foreground font-mono">
            {canvasWidth} x {canvasHeight}
          </span>
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
