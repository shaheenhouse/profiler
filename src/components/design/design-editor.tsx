"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Object as FabricObject } from "fabric";
import DesignCanvas, { type DesignCanvasAPI } from "./design-canvas";
import type { ToolType } from "@/types/design";
import { DesignToolbar } from "./design-toolbar";
import { DesignProperties } from "./design-properties";
import { DesignHeader } from "./design-header";
import { DesignTemplates } from "./design-templates";
import { DesignContextMenu } from "./design-context-menu";
import { toast } from "@/components/ui/use-toast";
import { Group, Ungroup, Copy, Trash2, FlipHorizontal, FlipVertical, History, RotateCcw } from "lucide-react";

interface DesignEditorProps {
  designId: string | null;
  initialName: string;
  initialWidth: number;
  initialHeight: number;
  initialCanvasJSON?: string;
}

export function DesignEditor({
  designId,
  initialName,
  initialWidth,
  initialHeight,
  initialCanvasJSON,
}: DesignEditorProps) {
  const canvasAPIRef = useRef<DesignCanvasAPI | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [designName, setDesignName] = useState(initialName);
  const [designWidth, setDesignWidth] = useState(initialWidth);
  const [designHeight, setDesignHeight] = useState(initialHeight);
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(designId);
  const [canvasReady, setCanvasReady] = useState(false);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0 });
  const [snapshots, setSnapshots] = useState<Array<{ id: string; name: string; json: string; createdAt: string }>>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const isMultiSelection = selectedObject?.type === "activeselection" || selectedObject?.type === "activeSelection";

  const handleCanvasReady = useCallback(
    (api: DesignCanvasAPI) => {
      canvasAPIRef.current = api;
      setCanvasReady(true);
      if (initialCanvasJSON && initialCanvasJSON !== "{}") {
        // Wait for layout to settle before loading design
        setTimeout(() => {
          api.loadJSON(initialCanvasJSON);
        }, 150);
      }
    },
    [initialCanvasJSON]
  );

  const handleSelectionChange = useCallback((obj: FabricObject | null) => {
    setSelectedObject(obj);
  }, []);

  const handleCanvasModified = useCallback(() => {}, []);

  const handleZoomChange = useCallback((z: number) => {
    setZoom(z);
  }, []);

  const handleSizeChange = useCallback((w: number, h: number) => {
    setDesignWidth(w);
    setDesignHeight(h);
    // zoomToFit will be triggered by the useEffect on width/height change
  }, []);

  const handleMagicResize = useCallback((w: number, h: number) => {
    const canvas = canvasAPIRef.current?.getCanvas();
    if (!canvas) {
      setDesignWidth(w);
      setDesignHeight(h);
      return;
    }

    const oldW = designWidth || 1;
    const oldH = designHeight || 1;
    const sx = w / oldW;
    const sy = h / oldH;

    canvas.getObjects().forEach((obj: any) => {
      if (obj?._isBgImage) {
        obj.set({
          left: 0,
          top: 0,
          scaleX: w / (obj.width || w),
          scaleY: h / (obj.height || h),
        });
        return;
      }
      obj.set({
        left: (obj.left || 0) * sx,
        top: (obj.top || 0) * sy,
        scaleX: (obj.scaleX || 1) * sx,
        scaleY: (obj.scaleY || 1) * sy,
      });
      obj.setCoords?.();
    });

    canvas.renderAll();
    setDesignWidth(w);
    setDesignHeight(h);
    setTimeout(() => canvasAPIRef.current?.zoomToFit(), 80);
  }, [designWidth, designHeight]);

  useEffect(() => {
    if (!currentDesignId) return;
    try {
      const raw = localStorage.getItem(`design:snapshots:${currentDesignId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSnapshots(parsed);
    } catch {
      // ignore localStorage parse errors
    }
  }, [currentDesignId]);

  const persistSnapshots = useCallback((next: Array<{ id: string; name: string; json: string; createdAt: string }>) => {
    setSnapshots(next);
    if (!currentDesignId) return;
    localStorage.setItem(`design:snapshots:${currentDesignId}`, JSON.stringify(next));
  }, [currentDesignId]);

  const createSnapshot = useCallback(() => {
    const json = canvasAPIRef.current?.toJSON();
    if (!json) return;
    const entry = {
      id: `${Date.now()}`,
      name: `Snapshot ${snapshots.length + 1}`,
      json,
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...snapshots].slice(0, 20);
    persistSnapshots(next);
    toast({ title: "Snapshot created" });
  }, [snapshots, persistSnapshots]);

  const restoreSnapshot = useCallback((snapshotJson: string) => {
    canvasAPIRef.current?.loadJSON(snapshotJson);
    toast({ title: "Snapshot restored" });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Don't handle space for shortcuts (used for panning)
      if (e.code === "Space") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const canvas = canvasAPIRef.current?.getCanvas();
        const active = canvas?.getActiveObject();
        if (active && (active as any).isEditing) return;
        canvasAPIRef.current?.deleteSelected();
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) canvasAPIRef.current?.redo();
            else canvasAPIRef.current?.undo();
            break;
          case "y":
            e.preventDefault();
            canvasAPIRef.current?.redo();
            break;
          case "c":
            e.preventDefault();
            canvasAPIRef.current?.copySelected();
            break;
          case "x":
            e.preventDefault();
            canvasAPIRef.current?.cutSelected();
            break;
          case "v":
            e.preventDefault();
            canvasAPIRef.current?.paste();
            break;
          case "d":
            e.preventDefault();
            canvasAPIRef.current?.duplicate();
            break;
          case "a":
            e.preventDefault();
            canvasAPIRef.current?.selectAll();
            break;
          case "s":
            e.preventDefault();
            handleSave();
            break;
          case "g":
            e.preventDefault();
            if (e.shiftKey) canvasAPIRef.current?.ungroup();
            else canvasAPIRef.current?.group();
            break;
          case "0":
            e.preventDefault();
            canvasAPIRef.current?.zoomToFit();
            break;
          case "1":
            e.preventDefault();
            canvasAPIRef.current?.resetZoom();
            break;
          case "=":
          case "+":
            e.preventDefault();
            canvasAPIRef.current?.zoomIn();
            break;
          case "-":
            e.preventDefault();
            canvasAPIRef.current?.zoomOut();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentDesignId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".canvas-area") || target.tagName === "CANVAS") {
        e.preventDefault();
        setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const canvasJSON = canvasAPIRef.current?.toJSON() || "{}";
      const thumbnail = (await canvasAPIRef.current?.toDataURL("jpeg", 0.3)) || "";

      if (currentDesignId) {
        const res = await fetch(`/api/designs/${currentDesignId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: designName, width: designWidth, height: designHeight, canvasJSON, thumbnail }),
        });
        if (!res.ok) throw new Error("Failed to save");
      } else {
        const res = await fetch("/api/designs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: designName, width: designWidth, height: designHeight, canvasJSON, thumbnail }),
        });
        if (!res.ok) throw new Error("Failed to save");
        const data = await res.json();
        setCurrentDesignId(data.design.id);
        window.history.replaceState({}, "", `/dashboard/design/${data.design.id}`);
      }

      setLastSaved(new Date().toISOString());
      toast({ title: "Design saved!" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle flowchart mode
  useEffect(() => {
    canvasAPIRef.current?.setFlowchartMode(activeTool === "flowchart");
  }, [activeTool]);

  // Auto-save every 60s
  useEffect(() => {
    if (!currentDesignId) return;
    const interval = setInterval(() => handleSave(), 60000);
    return () => clearInterval(interval);
  }, [currentDesignId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#0f0f23]">
      {/* Header */}
      <DesignHeader
        designId={currentDesignId}
        designName={designName}
        onNameChange={setDesignName}
        canvasRef={canvasAPIRef}
        zoom={zoom}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={handleSave}
        canvasWidth={designWidth}
        canvasHeight={designHeight}
        onSizeChange={handleSizeChange}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Toolbar */}
        <DesignToolbar
          canvasRef={canvasAPIRef}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onOpenTemplates={() => setShowTemplates(true)}
          designWidth={designWidth}
          designHeight={designHeight}
          onMagicResize={handleMagicResize}
        />

        {/* Canvas Area - must be relative so DesignCanvas absolute inset-0 works */}
        <div
          className="flex-1 canvas-area min-w-0 min-h-0"
          style={{ position: "relative", overflow: "hidden", height: "100%" }}
        >
          {!canvasReady && (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded bg-amber-500/20 text-amber-200 text-xs px-2 py-1 border border-amber-400/30"
            >
              Initializing canvas...
            </div>
          )}
          
          <DesignCanvas
            width={designWidth}
            height={designHeight}
            onSelectionChange={handleSelectionChange}
            onCanvasModified={handleCanvasModified}
            onZoomChange={handleZoomChange}
            onReady={handleCanvasReady}
          />

          {/* Floating context toolbar - Canva style (appears when objects selected) */}
          {selectedObject && (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: selectedObject ? "calc(50% - 144px)" : "50%",
                transform: "translateX(-50%)",
                zIndex: 20,
              }}
              className="flex items-center gap-0.5 bg-[#1e1e3a]/95 backdrop-blur-md rounded-lg px-2 py-1 shadow-lg border border-white/10"
            >
              {/* Group button - when multiple objects selected */}
              {isMultiSelection && (
                <button
                  onClick={() => canvasAPIRef.current?.group()}
                  className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs px-2.5 py-1.5 rounded hover:bg-white/10 transition-colors"
                  title="Group (Ctrl+G)"
                >
                  <Group className="w-3.5 h-3.5" />
                  <span>Group</span>
                </button>
              )}
              {/* Ungroup button - when a group is selected */}
              {selectedObject.type === "group" && (
                <button
                  onClick={() => canvasAPIRef.current?.ungroup()}
                  className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs px-2.5 py-1.5 rounded hover:bg-white/10 transition-colors"
                  title="Ungroup (Ctrl+Shift+G)"
                >
                  <Ungroup className="w-3.5 h-3.5" />
                  <span>Ungroup</span>
                </button>
              )}
              {/* Separator */}
              <div className="w-px h-4 bg-white/20 mx-1" />
              {/* Duplicate */}
              <button
                onClick={() => canvasAPIRef.current?.duplicate()}
                className="text-white/60 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {/* Flip horizontal */}
              <button
                onClick={() => {
                  const obj = selectedObject;
                  if (obj) {
                    obj.set("flipX", !obj.flipX);
                    canvasAPIRef.current?.getCanvas()?.renderAll();
                  }
                }}
                className="text-white/60 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              {/* Flip vertical */}
              <button
                onClick={() => {
                  const obj = selectedObject;
                  if (obj) {
                    obj.set("flipY", !obj.flipY);
                    canvasAPIRef.current?.getCanvas()?.renderAll();
                  }
                }}
                className="text-white/60 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Flip Vertical"
              >
                <FlipVertical className="w-3.5 h-3.5" />
              </button>
              {/* Separator */}
              <div className="w-px h-4 bg-white/20 mx-1" />
              {/* Delete */}
              <button
                onClick={() => canvasAPIRef.current?.deleteSelected()}
                className="text-white/60 hover:text-red-400 p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Delete (Del)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Bottom zoom bar - Canva style */}
          <div
            style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}
            className="flex items-center gap-2 bg-[#1e1e3a]/90 backdrop-blur-md rounded-lg px-3 py-1.5 shadow-lg border border-white/10"
          >
            <button
              onClick={() => canvasAPIRef.current?.zoomOut()}
              className="text-white/60 hover:text-white p-1 transition-colors"
              title="Zoom Out (Ctrl+-)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            <button
              onClick={() => canvasAPIRef.current?.zoomToFit()}
              className="text-white/80 hover:text-white text-xs font-medium min-w-[48px] text-center transition-colors"
              title="Fit to Screen (Ctrl+0)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => canvasAPIRef.current?.zoomIn()}
              className="text-white/60 hover:text-white p-1 transition-colors"
              title="Zoom In (Ctrl+=)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>

          <div className="absolute bottom-16 left-4 z-20 flex gap-2">
            <button
              onClick={createSnapshot}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded bg-[#1e1e3a]/90 text-white/80 hover:text-white border border-white/10"
              title="Create version snapshot"
            >
              <History className="w-3.5 h-3.5" />
              Snapshot
            </button>
            <button
              onClick={() => setShowSnapshots((p) => !p)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded bg-[#1e1e3a]/90 text-white/80 hover:text-white border border-white/10"
              title="Restore version snapshot"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              History
            </button>
          </div>

          {showSnapshots && (
            <div className="absolute bottom-28 left-4 z-20 w-72 max-h-80 overflow-auto rounded-lg border border-white/10 bg-[#1e1e3a]/95 p-2 space-y-1.5">
              {snapshots.length === 0 ? (
                <p className="text-xs text-white/50 p-2">No snapshots yet.</p>
              ) : (
                snapshots.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => restoreSnapshot(s.json)}
                    className="w-full text-left rounded px-2 py-1.5 text-xs text-white/80 hover:bg-white/10"
                  >
                    <p className="font-medium">{s.name}</p>
                    <p className="text-[10px] text-white/50">{new Date(s.createdAt).toLocaleString()}</p>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Right properties panel - ABSOLUTE overlay so it doesn't push/resize the canvas */}
          {selectedObject && (
            <div
              className="absolute top-0 right-0 bottom-0 z-10 shadow-2xl"
              style={{ width: 288 }}
            >
              <DesignProperties
                selectedObject={selectedObject}
                canvasRef={canvasAPIRef}
              />
            </div>
          )}
        </div>
      </div>

      {/* Templates Modal */}
      <DesignTemplates
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        canvasRef={canvasAPIRef}
      />

      {/* Context Menu */}
      <DesignContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        canvasRef={canvasAPIRef}
        selectedObject={selectedObject}
      />
    </div>
  );
}
