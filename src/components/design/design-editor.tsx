"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Object as FabricObject } from "fabric";
import type { DesignCanvasAPI } from "./design-canvas";
import type { ToolType } from "@/types/design";
import { DesignToolbar } from "./design-toolbar";
import { DesignProperties } from "./design-properties";
import { DesignHeader } from "./design-header";
import { DesignTemplates } from "./design-templates";
import { DesignContextMenu } from "./design-context-menu";
import { toast } from "@/components/ui/use-toast";

const DesignCanvas = dynamic(() => import("./design-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      <div className="text-muted-foreground animate-pulse text-sm">Loading editor...</div>
    </div>
  ),
});

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

  // Context menu state
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0 });

  const handleCanvasReady = useCallback(
    (api: DesignCanvasAPI) => {
      canvasAPIRef.current = api;
      if (initialCanvasJSON && initialCanvasJSON !== "{}") {
        setTimeout(() => {
          api.loadJSON(initialCanvasJSON);
        }, 300);
      }
      setTimeout(() => api.zoomToFit(), 400);
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

  // Handle design size change
  const handleSizeChange = useCallback((w: number, h: number) => {
    setDesignWidth(w);
    setDesignHeight(h);
    setTimeout(() => {
      canvasAPIRef.current?.zoomToFit();
    }, 100);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

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
            if (e.shiftKey) {
              canvasAPIRef.current?.redo();
            } else {
              canvasAPIRef.current?.undo();
            }
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
            if (e.shiftKey) {
              canvasAPIRef.current?.ungroup();
            } else {
              canvasAPIRef.current?.group();
            }
            break;
          case "0":
            e.preventDefault();
            canvasAPIRef.current?.zoomToFit();
            break;
          case "1":
            e.preventDefault();
            canvasAPIRef.current?.resetZoom();
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
          body: JSON.stringify({
            name: designName,
            width: designWidth,
            height: designHeight,
            canvasJSON,
            thumbnail,
          }),
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

  // Toggle flowchart mode on canvas when tool changes
  useEffect(() => {
    canvasAPIRef.current?.setFlowchartMode(activeTool === "flowchart");
  }, [activeTool]);

  // Auto-save every 60s
  useEffect(() => {
    if (!currentDesignId) return;
    const interval = setInterval(() => {
      handleSave();
    }, 60000);
    return () => clearInterval(interval);
  }, [currentDesignId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-background">
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
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <DesignToolbar
          canvasRef={canvasAPIRef}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onOpenTemplates={() => setShowTemplates(true)}
          designWidth={designWidth}
          designHeight={designHeight}
        />

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto canvas-area">
          <DesignCanvas
            width={designWidth}
            height={designHeight}
            onSelectionChange={handleSelectionChange}
            onCanvasModified={handleCanvasModified}
            onZoomChange={handleZoomChange}
            onReady={handleCanvasReady}
          />
        </div>

        {/* Right Properties Panel */}
        <DesignProperties
          selectedObject={selectedObject}
          canvasRef={canvasAPIRef}
        />
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
