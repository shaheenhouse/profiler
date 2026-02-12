"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Canvas as FabricCanvas, Object as FabricObject } from "fabric";

export interface DesignCanvasAPI {
  getCanvas: () => FabricCanvas | null;
  toJSON: () => string;
  loadJSON: (json: string) => void;
  toDataURL: (format?: string, quality?: number) => Promise<string>;
  addText: (text?: string, options?: Record<string, unknown>) => void;
  addShape: (type: string) => void;
  addImage: (url: string) => void;
  addSVGIcon: (svgString: string, options?: { size?: number; fill?: string }) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImage: (url: string) => void;
  deleteSelected: () => void;
  selectAll: () => void;
  clearCanvas: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  group: () => void;
  ungroup: () => void;
  copySelected: () => void;
  cutSelected: () => void;
  paste: () => void;
  alignToCanvas: (type: "left" | "center-h" | "right" | "top" | "center-v" | "bottom") => void;
  undo: () => void;
  redo: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  zoomToFit: () => void;
  getZoom: () => number;
  duplicate: () => void;
  toggleDrawingMode: (enabled: boolean) => void;
  setDrawingBrush: (options: { color?: string; width?: number }) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  // Image filters
  applyImageFilter: (filterType: string, value: number) => void;
  removeImageFilters: () => void;
  getImageFilters: () => Record<string, number>;
  // Flowchart connection points
  setFlowchartMode: (enabled: boolean) => void;
  // Connector / arrow styling
  updateConnectorStyle: (options: {
    color?: string;
    strokeWidth?: number;
    lineStyle?: "solid" | "dashed" | "dotted";
    headStyle?: "filled" | "outline" | "open" | "diamond" | "circle" | "none";
    hasStartHead?: boolean;
  }) => void;
  getConnectorStyle: () => {
    color: string;
    strokeWidth: number;
    lineStyle: "solid" | "dashed" | "dotted";
    headStyle: "filled" | "outline" | "open" | "diamond" | "circle" | "none";
    hasStartHead: boolean;
  } | null;
}

interface DesignCanvasProps {
  width: number;
  height: number;
  onSelectionChange?: (object: FabricObject | null) => void;
  onCanvasModified?: () => void;
  onZoomChange?: (zoom: number) => void;
  onReady?: (api: DesignCanvasAPI) => void;
}

export default function DesignCanvas({
  width,
  height,
  onSelectionChange,
  onCanvasModified,
  onZoomChange,
  onReady,
}: DesignCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isLoadingRef = useRef(false);
  const clipboardRef = useRef<FabricObject | null>(null);
  const artboardRef = useRef<FabricObject | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const designWidthRef = useRef(width);
  const designHeightRef = useRef(height);

  const saveToHistory = useCallback(() => {
    if (isLoadingRef.current || !fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let canvasEl: HTMLCanvasElement | null = null;

    const initCanvas = async () => {
      const fabric = await import("fabric");
      if (!isMounted || !containerRef.current) return;

      canvasEl = document.createElement("canvas");
      containerRef.current.appendChild(canvasEl);

      // Use container dimensions so canvas fills workspace
      const cw = wrapperRef.current?.clientWidth || width + 200;
      const ch = wrapperRef.current?.clientHeight || height + 200;

      const canvas = new fabric.Canvas(canvasEl, {
        width: cw,
        height: ch,
        backgroundColor: "transparent",
        preserveObjectStacking: true,
        selection: true,
        controlsAboveOverlay: true,
      });

      if (!isMounted) {
        canvas.dispose();
        if (canvasEl.parentNode) canvasEl.remove();
        return;
      }

      fabricRef.current = canvas;

      // Create artboard — the white "design page" that zooms with content
      const artboard = new fabric.Rect({
        left: 0,
        top: 0,
        width,
        height,
        fill: "#ffffff",
        selectable: false,
        evented: false,
        excludeFromExport: true,
        hoverCursor: "default",
      } as any);
      try {
        (artboard as any).shadow = new fabric.Shadow({
          color: "rgba(0,0,0,0.12)",
          blur: 15,
          offsetX: 0,
          offsetY: 4,
        });
      } catch { /* shadow optional */ }
      (artboard as any)._isArtboard = true;
      canvas.add(artboard);
      artboardRef.current = artboard;

      // Center artboard in viewport
      const fitZoom = Math.min((cw - 60) / width, (ch - 60) / height, 1);
      const vpw = width * fitZoom;
      const vph = height * fitZoom;
      canvas.viewportTransform = [fitZoom, 0, 0, fitZoom, (cw - vpw) / 2, (ch - vph) / 2];

      // Resize canvas when container resizes
      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry && fabricRef.current) {
          const { width: rw, height: rh } = entry.contentRect;
          if (rw > 0 && rh > 0) {
            fabricRef.current.setDimensions({ width: rw, height: rh });
            fabricRef.current.requestRenderAll();
          }
        }
      });
      if (wrapperRef.current) ro.observe(wrapperRef.current);
      resizeObserverRef.current = ro;

      // Customize controls appearance
      try {
        fabric.FabricObject.prototype.set({
          transparentCorners: false,
          borderColor: "#6366f1",
          cornerColor: "#6366f1",
          cornerStrokeColor: "#ffffff",
          cornerStyle: "circle",
          cornerSize: 10,
          borderScaleFactor: 2,
          padding: 4,
        } as any);
      } catch {
        // Some versions may not support all properties
      }

      // ── Pan support (Alt + drag or middle-click drag) ──
      let isPanning = false;
      let panLastX = 0;
      let panLastY = 0;

      canvas.on("mouse:down", (opt) => {
        const ev = opt.e as any;
        if (ev.altKey || ev.button === 1) {
          isPanning = true;
          panLastX = ev.clientX || 0;
          panLastY = ev.clientY || 0;
          canvas.selection = false;
          const el = (canvas as any).upperCanvasEl;
          if (el) el.style.cursor = "grabbing";
        }
      });
      canvas.on("mouse:move", (opt) => {
        if (!isPanning) return;
        const ev = opt.e as any;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += (ev.clientX || 0) - panLastX;
          vpt[5] += (ev.clientY || 0) - panLastY;
          panLastX = ev.clientX || 0;
          panLastY = ev.clientY || 0;
          canvas.requestRenderAll();
        }
      });
      canvas.on("mouse:up", () => {
        if (isPanning) {
          isPanning = false;
          canvas.selection = true;
          const el = (canvas as any).upperCanvasEl;
          if (el) el.style.cursor = "";
        }
      });

      canvas.on("selection:created", (e) => {
        onSelectionChange?.(e.selected?.[0] || null);
      });
      canvas.on("selection:updated", (e) => {
        onSelectionChange?.(e.selected?.[0] || null);
      });
      canvas.on("selection:cleared", () => {
        onSelectionChange?.(null);
      });
      canvas.on("object:modified", () => {
        saveToHistory();
        onCanvasModified?.();
      });
      canvas.on("object:added", () => {
        if (!isLoadingRef.current) {
          saveToHistory();
          onCanvasModified?.();
        }
      });
      canvas.on("object:removed", () => {
        if (!isLoadingRef.current) {
          saveToHistory();
          onCanvasModified?.();
        }
      });

      canvas.on("mouse:wheel", async (opt) => {
        // Only zoom when Ctrl (or Cmd) is held; otherwise let the page scroll
        if (!opt.e.ctrlKey && !opt.e.metaKey) return;

        opt.e.preventDefault();
        opt.e.stopPropagation();
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 5) zoom = 5;
        if (zoom < 0.05) zoom = 0.05;
        const fb = await import("fabric");
        const point = new fb.Point(opt.e.offsetX, opt.e.offsetY);
        canvas.zoomToPoint(point, zoom);
        onZoomChange?.(zoom);
      });

      saveToHistory();

      // ═══════════════════════════════════════════════
      // ── Flowchart Connection Points System ──
      // ═══════════════════════════════════════════════
      let fcMode = false;
      let fcHoveredShape: FabricObject | null = null;
      let fcNearPort: { name: string; x: number; y: number } | null = null;
      let fcCreating = false;
      let fcStart: { x: number; y: number } | null = null;
      let fcEnd: { x: number; y: number } | null = null;

      function fcGetPorts(shape: any): { name: string; x: number; y: number }[] {
        if (!shape) return [];
        try {
          if (!shape.aCoords) shape.setCoords();
        } catch { return []; }
        const c = shape.aCoords;
        if (!c || !c.tl) return [];
        return [
          { name: "top", x: (c.tl.x + c.tr.x) / 2, y: (c.tl.y + c.tr.y) / 2 },
          { name: "right", x: (c.tr.x + c.br.x) / 2, y: (c.tr.y + c.br.y) / 2 },
          { name: "bottom", x: (c.bl.x + c.br.x) / 2, y: (c.bl.y + c.br.y) / 2 },
          { name: "left", x: (c.tl.x + c.bl.x) / 2, y: (c.tl.y + c.bl.y) / 2 },
        ];
      }

      // After-render overlay: draw connection points & temp connector
      canvas.on("after:render", () => {
        if (!fcMode) return;
        const ctx = (canvas as any).contextContainer as CanvasRenderingContext2D | null;
        if (!ctx) return;
        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

        ctx.save();
        ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);

        // Draw connection points on hovered shape
        if (fcHoveredShape && !fcCreating) {
          const ports = fcGetPorts(fcHoveredShape);
          for (const pt of ports) {
            const isNear = fcNearPort?.name === pt.name;
            const r = isNear ? 9 : 7;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
            ctx.fillStyle = isNear ? "#2563EB" : "rgba(59, 130, 246, 0.8)";
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();
            // Plus icon
            ctx.beginPath();
            ctx.moveTo(pt.x - 3, pt.y);
            ctx.lineTo(pt.x + 3, pt.y);
            ctx.moveTo(pt.x, pt.y - 3);
            ctx.lineTo(pt.x, pt.y + 3);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // Draw temporary connector line during drag
        if (fcCreating && fcStart && fcEnd) {
          const dx = fcEnd.x - fcStart.x;
          const dy = fcEnd.y - fcStart.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 5) {
            // Dashed line
            ctx.beginPath();
            ctx.moveTo(fcStart.x, fcStart.y);
            ctx.lineTo(fcEnd.x, fcEnd.y);
            ctx.strokeStyle = "#3B82F6";
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrowhead
            const ang = Math.atan2(dy, dx);
            const hl = 14;
            ctx.beginPath();
            ctx.moveTo(fcEnd.x, fcEnd.y);
            ctx.lineTo(fcEnd.x - hl * Math.cos(ang - Math.PI / 6), fcEnd.y - hl * Math.sin(ang - Math.PI / 6));
            ctx.lineTo(fcEnd.x - hl * Math.cos(ang + Math.PI / 6), fcEnd.y - hl * Math.sin(ang + Math.PI / 6));
            ctx.closePath();
            ctx.fillStyle = "#3B82F6";
            ctx.fill();
          }

          // Highlight snap targets (green dots on nearby shape ports)
          const objs = canvas.getObjects();
          for (const obj of objs) {
            if (obj === fcHoveredShape || (obj as any)._isConnector) continue;
            const ports = fcGetPorts(obj);
            for (const pt of ports) {
              if (Math.hypot(pt.x - fcEnd.x, pt.y - fcEnd.y) < 25) {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(34, 197, 94, 0.85)";
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            }
          }
        }

        ctx.restore();
      });

      // Helper: get pointer in scene/canvas coordinates (Fabric v7 compatible)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function fcGetPointer(e: any): { x: number; y: number } {
        const c = canvas as any;
        if (c.getScenePoint) {
          const p = c.getScenePoint(e);
          return { x: p.x, y: p.y };
        }
        if (c.getPointer) {
          const p = c.getPointer(e);
          return { x: p.x, y: p.y };
        }
        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
        const offsetX = e.offsetX ?? e.clientX ?? 0;
        const offsetY = e.offsetY ?? e.clientY ?? 0;
        return {
          x: (offsetX - vpt[4]) / vpt[0],
          y: (offsetY - vpt[5]) / vpt[3],
        };
      }

      // Helper: find target object under mouse (Fabric v7 compatible)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function fcFindTarget(e: any): FabricObject | null {
        const result = canvas.findTarget(e) as any;
        if (!result) return null;
        // In Fabric v7, findTarget may return {target, targets} wrapper
        if (result.target !== undefined) return result.target as FabricObject;
        return result as FabricObject;
      }

      // Mouse move: detect hovered shape & nearest port
      canvas.on("mouse:move", (opt) => {
        if (!fcMode) return;
        const pointer = fcGetPointer(opt.e);

        if (fcCreating) {
          fcEnd = { x: pointer.x, y: pointer.y };
          canvas.requestRenderAll();
          return;
        }

        // Restore previous hovered shape selectability
        if (fcHoveredShape) {
          (fcHoveredShape as any).selectable = true;
        }
        canvas.selection = true;

        const target = fcFindTarget(opt.e);
        const tAny = target as any;
        if (target && tAny.type !== "activeSelection" && !tAny._isConnector && !tAny._isArtboard && !tAny._isBgImage
            && !(tAny.group && tAny.group._isConnector)) {
          fcHoveredShape = target;
          const ports = fcGetPorts(target);
          let closest: typeof ports[0] | null = null;
          let closestDist = 22;
          for (const pt of ports) {
            const d = Math.hypot(pt.x - pointer.x, pt.y - pointer.y);
            if (d < closestDist) { closest = pt; closestDist = d; }
          }
          fcNearPort = closest;

          const el = (canvas as any).upperCanvasEl;
          if (el) el.style.cursor = fcNearPort ? "crosshair" : "";

          // Prevent shape selection when near a port
          if (fcNearPort) {
            (target as any).selectable = false;
            canvas.selection = false;
          }
        } else {
          fcHoveredShape = null;
          fcNearPort = null;
          const el = (canvas as any).upperCanvasEl;
          if (el) el.style.cursor = "";
        }

        canvas.requestRenderAll();
      });

      // Mouse down: start creating connector from port
      canvas.on("mouse:down", (opt) => {
        if (!fcMode || !fcNearPort || !fcHoveredShape) return;

        fcCreating = true;
        fcStart = { x: fcNearPort.x, y: fcNearPort.y };
        fcEnd = { x: fcNearPort.x, y: fcNearPort.y };

        canvas.discardActiveObject();
        canvas.forEachObject((obj: any) => {
          obj._fcPrev = obj.selectable;
          obj.selectable = false;
        });
        canvas.selection = false;
        canvas.requestRenderAll();
      });

      // Mouse up: finalize connector arrow
      canvas.on("mouse:up", async () => {
        if (!fcCreating) return;

        // Restore selectability
        canvas.forEachObject((obj: any) => {
          obj.selectable = obj._fcPrev !== undefined ? obj._fcPrev : true;
          delete obj._fcPrev;
        });
        canvas.selection = true;
        fcCreating = false;

        if (!fcStart || !fcEnd) {
          fcStart = null; fcEnd = null;
          canvas.requestRenderAll();
          return;
        }

        const dist = Math.hypot(fcEnd.x - fcStart.x, fcEnd.y - fcStart.y);
        if (dist < 25) {
          fcStart = null; fcEnd = null;
          canvas.requestRenderAll();
          return;
        }

        // Snap endpoint to nearest shape port if close
        let finalEnd = { ...fcEnd };
        const objs = canvas.getObjects();
        for (const obj of objs) {
          if ((obj as any)._isConnector) continue;
          const ports = fcGetPorts(obj);
          for (const pt of ports) {
            if (Math.hypot(pt.x - fcEnd.x, pt.y - fcEnd.y) < 25) {
              finalEnd = { x: pt.x, y: pt.y };
              break;
            }
          }
        }

        // Create permanent connector (line + arrowhead group)
        const fb = await import("fabric");
        const dx = finalEnd.x - fcStart.x;
        const dy = finalEnd.y - fcStart.y;
        const ang = Math.atan2(dy, dx);
        const hl = 14;

        const line = new fb.Line(
          [fcStart.x, fcStart.y, finalEnd.x, finalEnd.y],
          { stroke: "#475569", strokeWidth: 2.5 }
        );
        const head = new fb.Polygon([
          { x: finalEnd.x, y: finalEnd.y },
          { x: finalEnd.x - hl * Math.cos(ang - Math.PI / 7), y: finalEnd.y - hl * Math.sin(ang - Math.PI / 7) },
          { x: finalEnd.x - hl * Math.cos(ang + Math.PI / 7), y: finalEnd.y - hl * Math.sin(ang + Math.PI / 7) },
        ], { fill: "#475569" });

        const group = new fb.Group([line, head]);
        (group as any)._isConnector = true;
        (group as any)._headStyle = "filled";
        (group as any)._lineStyle = "solid";
        canvas.add(group);
        canvas.setActiveObject(group);

        fcStart = null;
        fcEnd = null;

        canvas.requestRenderAll();
        saveToHistory();
        onCanvasModified?.();
      });

      const api: DesignCanvasAPI = {
        getCanvas: () => fabricRef.current,

        toJSON: () => {
          if (!fabricRef.current) return "{}";
          const json = fabricRef.current.toJSON() as any;
          // Save with design dimensions and artboard color as background
          json.width = designWidthRef.current;
          json.height = designHeightRef.current;
          const ab = artboardRef.current as any;
          json.background = ab?.fill || "#ffffff";
          return JSON.stringify(json);
        },

        loadJSON: async (json: string) => {
          if (!fabricRef.current) return;
          isLoadingRef.current = true;
          try {
            const parsed = JSON.parse(json);
            const bgColor = parsed.background || parsed.backgroundColor || "#ffffff";
            await fabricRef.current.loadFromJSON(parsed);

            // Restore canvas to container dimensions (not design dimensions)
            const containerEl = wrapperRef.current;
            if (containerEl) {
              fabricRef.current.setDimensions({
                width: containerEl.clientWidth,
                height: containerEl.clientHeight,
              });
            }
            fabricRef.current.backgroundColor = "transparent";

            // Re-create artboard
            const fb = await import("fabric");
            const dw = designWidthRef.current;
            const dh = designHeightRef.current;
            const ab = new fb.Rect({
              left: 0, top: 0, width: dw, height: dh,
              fill: bgColor,
              selectable: false, evented: false,
              excludeFromExport: true,
              hoverCursor: "default",
            } as any);
            try {
              (ab as any).shadow = new fb.Shadow({
                color: "rgba(0,0,0,0.12)", blur: 15, offsetX: 0, offsetY: 4,
              });
            } catch { /* shadow optional */ }
            (ab as any)._isArtboard = true;
            fabricRef.current.add(ab);
            fabricRef.current.sendObjectToBack(ab);
            artboardRef.current = ab;

            // Center view
            api.zoomToFit();
            fabricRef.current.renderAll();
            saveToHistory();
          } catch (err) {
            console.error("Error loading canvas JSON:", err);
          } finally {
            isLoadingRef.current = false;
          }
        },

        toDataURL: async (format = "png", quality = 1) => {
          if (!fabricRef.current) return "";
          try {
            const fb = await import("fabric");
            const dw = designWidthRef.current;
            const dh = designHeightRef.current;
            // Get artboard color
            const ab = artboardRef.current as any;
            const bgColor = ab?.fill || "#ffffff";

            // Get the JSON (excludes artboard due to excludeFromExport)
            const jsonData = fabricRef.current.toJSON() as any;
            // Ensure design dimensions and background
            jsonData.width = dw;
            jsonData.height = dh;
            jsonData.background = bgColor;

            const tempEl = document.createElement("canvas");
            const tempCanvas = new fb.StaticCanvas(tempEl, {
              width: dw,
              height: dh,
            });
            await tempCanvas.loadFromJSON(jsonData);
            tempCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];
            tempCanvas.renderAll();

            const exportEl = tempCanvas.toCanvasElement(1);
            const dataUrl = exportEl.toDataURL(`image/${format}`, quality);
            tempCanvas.dispose();
            return dataUrl;
          } catch (err) {
            console.error("toDataURL error:", err);
            return "";
          }
        },

        addText: async (text = "Edit this text", options = {}) => {
          if (!fabricRef.current) return;
          const fb = await import("fabric");
          const textObj = new fb.IText(text, {
            left: width / 2 - 100,
            top: height / 2 - 20,
            fontSize: 36,
            fontFamily: "Arial",
            fill: "#333333",
            fontWeight: "normal",
            fontStyle: "normal",
            textAlign: "left",
            ...options,
          });
          fabricRef.current.add(textObj);
          fabricRef.current.setActiveObject(textObj);
          fabricRef.current.renderAll();
        },

        addShape: async (type: string) => {
          if (!fabricRef.current) return;
          const fb = await import("fabric");
          const centerX = width / 2;
          const centerY = height / 2;
          let shape: FabricObject | null = null;

          switch (type) {
            case "rectangle":
              shape = new fb.Rect({
                left: centerX - 75, top: centerY - 50,
                width: 150, height: 100,
                fill: "#4F46E5", rx: 8, ry: 8,
              });
              break;
            case "circle":
              shape = new fb.Circle({
                left: centerX - 50, top: centerY - 50,
                radius: 50, fill: "#EC4899",
              });
              break;
            case "triangle":
              shape = new fb.Triangle({
                left: centerX - 50, top: centerY - 50,
                width: 100, height: 100, fill: "#F59E0B",
              });
              break;
            case "line":
              shape = new fb.Line(
                [centerX - 100, centerY, centerX + 100, centerY],
                { stroke: "#333333", strokeWidth: 3 }
              );
              break;
            case "star": {
              const pts = [];
              for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? 60 : 30;
                const a = (Math.PI / 5) * i - Math.PI / 2;
                pts.push({ x: centerX + r * Math.cos(a), y: centerY + r * Math.sin(a) });
              }
              shape = new fb.Polygon(pts, { fill: "#F59E0B" });
              break;
            }
            case "polygon": {
              const hexPts = [];
              for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 6;
                hexPts.push({ x: centerX + 50 * Math.cos(a), y: centerY + 50 * Math.sin(a) });
              }
              shape = new fb.Polygon(hexPts, { fill: "#10B981" });
              break;
            }
            case "arrow": {
              const aPts = [
                { x: centerX - 60, y: centerY - 10 },
                { x: centerX + 20, y: centerY - 10 },
                { x: centerX + 20, y: centerY - 25 },
                { x: centerX + 60, y: centerY },
                { x: centerX + 20, y: centerY + 25 },
                { x: centerX + 20, y: centerY + 10 },
                { x: centerX - 60, y: centerY + 10 },
              ];
              shape = new fb.Polygon(aPts, { fill: "#6366F1" });
              break;
            }

            // ── Flowchart Shapes ──
            case "process":
              shape = new fb.Rect({
                left: centerX - 80, top: centerY - 40,
                width: 160, height: 80,
                fill: "#3B82F6", rx: 12, ry: 12,
                stroke: "#2563EB", strokeWidth: 2,
              });
              break;

            case "decision": {
              const dPts = [
                { x: centerX, y: centerY - 60 },
                { x: centerX + 80, y: centerY },
                { x: centerX, y: centerY + 60 },
                { x: centerX - 80, y: centerY },
              ];
              shape = new fb.Polygon(dPts, {
                fill: "#F59E0B", stroke: "#D97706", strokeWidth: 2,
              });
              break;
            }

            case "terminator":
              shape = new fb.Rect({
                left: centerX - 80, top: centerY - 30,
                width: 160, height: 60,
                fill: "#10B981", rx: 30, ry: 30,
                stroke: "#059669", strokeWidth: 2,
              });
              break;

            case "data-io": {
              const ioPts = [
                { x: centerX - 60, y: centerY - 40 },
                { x: centerX + 80, y: centerY - 40 },
                { x: centerX + 60, y: centerY + 40 },
                { x: centerX - 80, y: centerY + 40 },
              ];
              shape = new fb.Polygon(ioPts, {
                fill: "#06B6D4", stroke: "#0891B2", strokeWidth: 2,
              });
              break;
            }

            case "database": {
              shape = new fb.Path(
                "M 0 25 C 0 11 27 0 60 0 C 93 0 120 11 120 25 L 120 115 C 120 129 93 140 60 140 C 27 140 0 129 0 115 Z M 0 25 C 0 39 27 50 60 50 C 93 50 120 39 120 25",
                {
                  left: centerX - 60, top: centerY - 70,
                  fill: "#8B5CF6", stroke: "#7C3AED", strokeWidth: 2,
                  scaleX: 1, scaleY: 1,
                }
              );
              break;
            }

            case "document": {
              shape = new fb.Path(
                "M 0 0 L 180 0 L 180 100 Q 135 130 90 100 Q 45 70 0 100 Z",
                {
                  left: centerX - 90, top: centerY - 55,
                  fill: "#EC4899", stroke: "#DB2777", strokeWidth: 2,
                }
              );
              break;
            }

            case "cloud-shape": {
              shape = new fb.Path(
                "M 50 110 C 20 110 0 90 0 70 C 0 50 15 35 35 30 C 30 10 50 0 70 0 C 90 0 105 10 110 30 C 115 25 125 25 135 30 C 160 30 175 50 175 70 C 175 90 160 110 135 110 Z",
                {
                  left: centerX - 87, top: centerY - 55,
                  fill: "#64748B", stroke: "#475569", strokeWidth: 2,
                }
              );
              break;
            }

            case "subroutine": {
              // Double-bordered rectangle using a group
              const outerRect = new fb.Rect({
                left: 0, top: 0, width: 160, height: 80,
                fill: "#A855F7", stroke: "#9333EA", strokeWidth: 2,
                rx: 4, ry: 4,
              });
              const leftLine = new fb.Line([12, 0, 12, 80], {
                stroke: "#9333EA", strokeWidth: 2,
              });
              const rightLine = new fb.Line([148, 0, 148, 80], {
                stroke: "#9333EA", strokeWidth: 2,
              });
              const subGroup = new fb.Group([outerRect, leftLine, rightLine], {
                left: centerX - 80, top: centerY - 40,
              });
              shape = subGroup as unknown as FabricObject;
              break;
            }

            case "predefined-process": {
              shape = new fb.Rect({
                left: centerX - 80, top: centerY - 40,
                width: 160, height: 80,
                fill: "#F97316", stroke: "#EA580C", strokeWidth: 3,
                rx: 4, ry: 4,
              });
              break;
            }

            // ── Connectors ──
            case "connector-arrow": {
              const line = new fb.Line(
                [centerX - 100, centerY, centerX + 80, centerY],
                { stroke: "#333333", strokeWidth: 3 }
              );
              const head = new fb.Polygon([
                { x: centerX + 80, y: centerY - 12 },
                { x: centerX + 100, y: centerY },
                { x: centerX + 80, y: centerY + 12 },
              ], { fill: "#333333" });
              const cg1 = new fb.Group([line, head]);
              (cg1 as any)._isConnector = true;
              shape = cg1 as unknown as FabricObject;
              break;
            }

            case "connector-double": {
              const dLine = new fb.Line(
                [centerX - 80, centerY, centerX + 80, centerY],
                { stroke: "#333333", strokeWidth: 3 }
              );
              const headR = new fb.Polygon([
                { x: centerX + 80, y: centerY - 12 },
                { x: centerX + 100, y: centerY },
                { x: centerX + 80, y: centerY + 12 },
              ], { fill: "#333333" });
              const headL = new fb.Polygon([
                { x: centerX - 80, y: centerY - 12 },
                { x: centerX - 100, y: centerY },
                { x: centerX - 80, y: centerY + 12 },
              ], { fill: "#333333" });
              const cg2 = new fb.Group([dLine, headR, headL]);
              (cg2 as any)._isConnector = true;
              shape = cg2 as unknown as FabricObject;
              break;
            }

            case "connector-dashed": {
              const dashLine = new fb.Line(
                [centerX - 100, centerY, centerX + 80, centerY],
                { stroke: "#333333", strokeWidth: 3, strokeDashArray: [10, 6] }
              );
              const dashHead = new fb.Polygon([
                { x: centerX + 80, y: centerY - 12 },
                { x: centerX + 100, y: centerY },
                { x: centerX + 80, y: centerY + 12 },
              ], { fill: "#333333" });
              const cg3 = new fb.Group([dashLine, dashHead]);
              (cg3 as any)._isConnector = true;
              shape = cg3 as unknown as FabricObject;
              break;
            }

            case "connector-curved": {
              const curvePath = new fb.Path(
                `M ${centerX - 100} ${centerY} Q ${centerX} ${centerY - 80} ${centerX + 80} ${centerY}`,
                { stroke: "#333333", strokeWidth: 3, fill: "" }
              );
              const curveHead = new fb.Polygon([
                { x: centerX + 80, y: centerY - 12 },
                { x: centerX + 100, y: centerY },
                { x: centerX + 80, y: centerY + 12 },
              ], { fill: "#333333" });
              const cg4 = new fb.Group([curvePath, curveHead]);
              (cg4 as any)._isConnector = true;
              shape = cg4 as unknown as FabricObject;
              break;
            }

            case "connector-elbow": {
              const elbowPath = new fb.Polyline([
                { x: centerX - 100, y: centerY },
                { x: centerX - 100, y: centerY - 50 },
                { x: centerX + 80, y: centerY - 50 },
                { x: centerX + 80, y: centerY },
              ], { stroke: "#333333", strokeWidth: 3, fill: "" });
              const elbowHead = new fb.Polygon([
                { x: centerX + 68, y: centerY },
                { x: centerX + 80, y: centerY + 16 },
                { x: centerX + 92, y: centerY },
              ], { fill: "#333333" });
              const cg5 = new fb.Group([elbowPath, elbowHead]);
              (cg5 as any)._isConnector = true;
              shape = cg5 as unknown as FabricObject;
              break;
            }
          }

          if (shape) {
            fabricRef.current.add(shape);
            fabricRef.current.setActiveObject(shape);
            fabricRef.current.renderAll();
          }
        },

        addImage: async (url: string) => {
          if (!fabricRef.current) return;
          const fb = await import("fabric");
          try {
            const img = await fb.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
            const maxW = width * 0.6;
            const maxH = height * 0.6;
            const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1);
            img.set({
              left: width / 2 - ((img.width || 0) * scale) / 2,
              top: height / 2 - ((img.height || 0) * scale) / 2,
              scaleX: scale, scaleY: scale,
            });
            fabricRef.current.add(img);
            fabricRef.current.setActiveObject(img);
            fabricRef.current.renderAll();
          } catch (err) {
            console.error("Error adding image:", err);
          }
        },

        addSVGIcon: async (svgString: string, options?: { size?: number; fill?: string }) => {
          if (!fabricRef.current) return;
          const fb = await import("fabric");
          try {
            const result = await fb.loadSVGFromString(svgString);
            if (!result.objects || result.objects.length === 0) return;
            const validObjects = result.objects.filter(Boolean) as FabricObject[];
            let obj: FabricObject;
            if (validObjects.length === 1) {
              obj = validObjects[0];
            } else {
              obj = new fb.Group(validObjects);
            }
            const size = options?.size || 120;
            const objW = obj.width || 24;
            const objH = obj.height || 24;
            const scale = Math.min(size / objW, size / objH);
            obj.set({
              left: width / 2 - (objW * scale) / 2,
              top: height / 2 - (objH * scale) / 2,
              scaleX: scale, scaleY: scale,
            });
            if (options?.fill) {
              if (obj.type === "group") {
                (obj as any).getObjects().forEach((child: any) => {
                  if (child.stroke) child.set("stroke", options.fill);
                  if (child.fill && child.fill !== "none" && child.fill !== "") {
                    child.set("fill", options.fill);
                  }
                });
              } else {
                if ((obj as any).stroke) obj.set("stroke" as any, options.fill);
                if ((obj as any).fill && (obj as any).fill !== "none") {
                  obj.set("fill" as any, options.fill);
                }
              }
            }
            fabricRef.current.add(obj);
            fabricRef.current.setActiveObject(obj);
            fabricRef.current.renderAll();
          } catch (err) {
            console.error("Error adding SVG icon:", err);
          }
        },

        setBackgroundColor: (color: string) => {
          if (!fabricRef.current) return;
          // Change the artboard fill (not canvas background)
          if (artboardRef.current) {
            (artboardRef.current as any).set("fill", color);
          }
          fabricRef.current.renderAll();
          saveToHistory();
          onCanvasModified?.();
        },

        setBackgroundImage: async (url: string) => {
          if (!fabricRef.current) return;
          const fb = await import("fabric");
          try {
            const img = await fb.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
            const dw = designWidthRef.current;
            const dh = designHeightRef.current;
            img.set({
              left: 0, top: 0,
              scaleX: dw / (img.width || 1),
              scaleY: dh / (img.height || 1),
              selectable: false,
              evented: false,
            });
            (img as any)._isBgImage = true;

            // Remove existing bg image if any
            const existing = fabricRef.current.getObjects().find((o: any) => (o as any)._isBgImage);
            if (existing) fabricRef.current.remove(existing);

            fabricRef.current.add(img);
            // Position right above the artboard
            const artboardIdx = fabricRef.current.getObjects().indexOf(artboardRef.current!);
            if (artboardIdx >= 0) {
              // Move bg image to just above artboard
              const objects = fabricRef.current.getObjects();
              const imgIdx = objects.indexOf(img);
              if (imgIdx !== artboardIdx + 1) {
                fabricRef.current.remove(img);
                fabricRef.current.insertAt(artboardIdx + 1, img);
              }
            }
            fabricRef.current.renderAll();
            saveToHistory();
            onCanvasModified?.();
          } catch (err) {
            console.error("Error setting background image:", err);
          }
        },

        deleteSelected: () => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObjects().filter(
            (o: any) => !(o as any)._isArtboard && !(o as any)._isBgImage
          );
          if (active.length > 0) {
            active.forEach((obj) => fabricRef.current!.remove(obj));
            fabricRef.current.discardActiveObject();
            fabricRef.current.renderAll();
          }
        },

        selectAll: async () => {
          if (!fabricRef.current) return;
          const fb = await import("fabric");
          const objects = fabricRef.current.getObjects().filter(
            (o: any) => !(o as any)._isArtboard && !(o as any)._isBgImage && o.selectable !== false
          );
          if (objects.length > 0) {
            const selection = new fb.ActiveSelection(objects, { canvas: fabricRef.current });
            fabricRef.current.setActiveObject(selection);
            fabricRef.current.renderAll();
          }
        },

        clearCanvas: async () => {
          if (!fabricRef.current) return;
          // Remove all objects except artboard (including bg image)
          const objs = fabricRef.current.getObjects().filter(
            (o: any) => !(o as any)._isArtboard
          );
          objs.forEach((o) => fabricRef.current!.remove(o));
          // Also clear canvas backgroundImage
          fabricRef.current.backgroundImage = undefined as any;
          // Reset artboard color
          if (artboardRef.current) {
            (artboardRef.current as any).set("fill", "#ffffff");
          }
          fabricRef.current.discardActiveObject();
          fabricRef.current.backgroundColor = "transparent";
          fabricRef.current.renderAll();
          saveToHistory();
          onCanvasModified?.();
        },

        bringForward: () => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject();
          if (active) { fabricRef.current.bringObjectForward(active); fabricRef.current.renderAll(); saveToHistory(); onCanvasModified?.(); }
        },
        sendBackward: () => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject();
          if (active) { fabricRef.current.sendObjectBackwards(active); fabricRef.current.renderAll(); saveToHistory(); onCanvasModified?.(); }
        },
        bringToFront: () => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject();
          if (active) { fabricRef.current.bringObjectToFront(active); fabricRef.current.renderAll(); saveToHistory(); onCanvasModified?.(); }
        },
        sendToBack: () => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject();
          if (active) { fabricRef.current.sendObjectToBack(active); fabricRef.current.renderAll(); saveToHistory(); onCanvasModified?.(); }
        },

        group: async () => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const active = canvas.getActiveObject();
          if (!active || active.type !== "activeSelection") return;
          try {
            const fb = await import("fabric");
            const selection = active as any;
            const objects = selection.getObjects().slice();
            if (objects.length < 2) return;

            // Capture each object's absolute position before ungrouping
            const absPositions = objects.map((obj: any) => {
              const m = obj.calcTransformMatrix();
              const decomposed = fb.util.qrDecompose(m);
              return {
                left: decomposed.translateX,
                top: decomposed.translateY,
                scaleX: decomposed.scaleX,
                scaleY: decomposed.scaleY,
                angle: decomposed.angle,
                skewX: decomposed.skewX,
                skewY: decomposed.skewY,
              };
            });

            canvas.discardActiveObject();

            // Remove objects from canvas
            for (const obj of objects) {
              canvas.remove(obj);
            }

            // Reset objects to their absolute transforms so the Group ctor calculates correctly
            objects.forEach((obj: any, i: number) => {
              obj.set(absPositions[i]);
              obj.setCoords();
            });

            // Create new group
            const group = new fb.Group(objects);
            canvas.add(group);
            canvas.setActiveObject(group);
            canvas.requestRenderAll();
            saveToHistory();
            onCanvasModified?.();
          } catch (err) {
            console.error("Error grouping:", err);
          }
        },

        ungroup: async () => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const active = canvas.getActiveObject();
          if (!active || active.type !== "group") return;
          try {
            const fb = await import("fabric");
            const group = active as any;
            const items = group.getObjects().slice();

            // Get group's transform matrix
            const groupMatrix = group.calcTransformMatrix();

            // Calculate each item's absolute position
            const absPositions = items.map((item: any) => {
              const itemRelMatrix = item.calcTransformMatrix();
              const fullMatrix = fb.util.multiplyTransformMatrices(
                groupMatrix,
                itemRelMatrix
              );
              return fb.util.qrDecompose(fullMatrix);
            });

            // Remove the group from canvas
            canvas.remove(group);

            // Add items back with correct absolute positions
            const addedItems: FabricObject[] = [];
            items.forEach((item: any, i: number) => {
              const pos = absPositions[i];
              // Clear group reference
              item.group = undefined;
              item.set({
                left: pos.translateX,
                top: pos.translateY,
                scaleX: pos.scaleX,
                scaleY: pos.scaleY,
                angle: pos.angle,
                skewX: pos.skewX,
                skewY: pos.skewY,
              });
              item.setCoords();
              canvas.add(item);
              addedItems.push(item);
            });

            // Select all ungrouped items
            if (addedItems.length > 1) {
              const sel = new fb.ActiveSelection(addedItems, { canvas });
              canvas.setActiveObject(sel);
            } else if (addedItems.length === 1) {
              canvas.setActiveObject(addedItems[0]);
            }

            canvas.requestRenderAll();
            saveToHistory();
            onCanvasModified?.();
          } catch (err) {
            console.error("Error ungrouping:", err);
          }
        },

        // ── Clipboard ──
        copySelected: async () => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject();
          if (!active) return;
          clipboardRef.current = await active.clone();
        },

        cutSelected: async () => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject();
          if (!active) return;
          clipboardRef.current = await active.clone();
          fabricRef.current.remove(active);
          fabricRef.current.discardActiveObject();
          fabricRef.current.renderAll();
        },

        paste: async () => {
          if (!fabricRef.current || !clipboardRef.current) return;
          const cloned = await clipboardRef.current.clone();
          cloned.set({
            left: (cloned.left || 0) + 20,
            top: (cloned.top || 0) + 20,
          });
          if (cloned.type === "activeSelection") {
            cloned.canvas = fabricRef.current;
            (cloned as any).forEachObject((obj: FabricObject) => {
              fabricRef.current!.add(obj);
            });
            cloned.setCoords();
          } else {
            fabricRef.current.add(cloned);
          }
          // Update clipboard position for consecutive pastes
          clipboardRef.current!.set({
            left: (clipboardRef.current!.left || 0) + 20,
            top: (clipboardRef.current!.top || 0) + 20,
          });
          fabricRef.current.setActiveObject(cloned);
          fabricRef.current.renderAll();
        },

        // ── Alignment (relative to artboard / design area) ──
        alignToCanvas: (type) => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject();
          if (!active) return;
          const dw = designWidthRef.current;
          const dh = designHeightRef.current;
          const bound = active.getBoundingRect();
          const objW = bound.width / (fabricRef.current.getZoom() || 1);
          const objH = bound.height / (fabricRef.current.getZoom() || 1);
          const currentLeft = active.left || 0;
          const currentTop = active.top || 0;
          const boundLeft = bound.left / (fabricRef.current.getZoom() || 1) - (fabricRef.current.viewportTransform?.[4] || 0) / (fabricRef.current.getZoom() || 1);
          const boundTop = bound.top / (fabricRef.current.getZoom() || 1) - (fabricRef.current.viewportTransform?.[5] || 0) / (fabricRef.current.getZoom() || 1);
          const offsetX = currentLeft - boundLeft;
          const offsetY = currentTop - boundTop;
          switch (type) {
            case "left": active.set("left", 0 + offsetX); break;
            case "center-h": active.set("left", dw / 2 - objW / 2 + offsetX); break;
            case "right": active.set("left", dw - objW + offsetX); break;
            case "top": active.set("top", 0 + offsetY); break;
            case "center-v": active.set("top", dh / 2 - objH / 2 + offsetY); break;
            case "bottom": active.set("top", dh - objH + offsetY); break;
          }
          active.setCoords();
          fabricRef.current.renderAll();
          saveToHistory();
          onCanvasModified?.();
        },

        // ── Undo / Redo ──
        undo: () => {
          if (!fabricRef.current || historyIndexRef.current <= 0) return;
          historyIndexRef.current--;
          isLoadingRef.current = true;
          const state = historyRef.current[historyIndexRef.current];
          fabricRef.current.loadFromJSON(JSON.parse(state)).then(() => {
            fabricRef.current!.renderAll();
            isLoadingRef.current = false;
            onCanvasModified?.();
          });
        },
        redo: () => {
          if (!fabricRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;
          historyIndexRef.current++;
          isLoadingRef.current = true;
          const state = historyRef.current[historyIndexRef.current];
          fabricRef.current.loadFromJSON(JSON.parse(state)).then(() => {
            fabricRef.current!.renderAll();
            isLoadingRef.current = false;
            onCanvasModified?.();
          });
        },

        // ── Zoom ──
        zoomIn: () => {
          if (!fabricRef.current) return;
          const canvasW = fabricRef.current.width || 1200;
          const canvasH = fabricRef.current.height || 800;
          let zoom = fabricRef.current.getZoom() * 1.1;
          if (zoom > 5) zoom = 5;
          const dw = designWidthRef.current;
          const dh = designHeightRef.current;
          fabricRef.current.viewportTransform = [
            zoom, 0, 0, zoom,
            (canvasW - dw * zoom) / 2,
            (canvasH - dh * zoom) / 2,
          ];
          fabricRef.current.requestRenderAll();
          onZoomChange?.(zoom);
        },
        zoomOut: () => {
          if (!fabricRef.current) return;
          const canvasW = fabricRef.current.width || 1200;
          const canvasH = fabricRef.current.height || 800;
          let zoom = fabricRef.current.getZoom() * 0.9;
          if (zoom < 0.05) zoom = 0.05;
          const dw = designWidthRef.current;
          const dh = designHeightRef.current;
          fabricRef.current.viewportTransform = [
            zoom, 0, 0, zoom,
            (canvasW - dw * zoom) / 2,
            (canvasH - dh * zoom) / 2,
          ];
          fabricRef.current.requestRenderAll();
          onZoomChange?.(zoom);
        },
        resetZoom: () => {
          if (!fabricRef.current) return;
          const canvasW = fabricRef.current.width || 1200;
          const canvasH = fabricRef.current.height || 800;
          const dw = designWidthRef.current;
          const dh = designHeightRef.current;
          fabricRef.current.viewportTransform = [1, 0, 0, 1, (canvasW - dw) / 2, (canvasH - dh) / 2];
          fabricRef.current.requestRenderAll();
          onZoomChange?.(1);
        },
        zoomToFit: () => {
          if (!fabricRef.current) return;
          const canvasW = fabricRef.current.width || 1200;
          const canvasH = fabricRef.current.height || 800;
          const dw = designWidthRef.current;
          const dh = designHeightRef.current;
          const zoom = Math.min((canvasW - 60) / dw, (canvasH - 60) / dh, 1);
          fabricRef.current.viewportTransform = [
            zoom, 0, 0, zoom,
            (canvasW - dw * zoom) / 2,
            (canvasH - dh * zoom) / 2,
          ];
          fabricRef.current.requestRenderAll();
          onZoomChange?.(zoom);
        },
        getZoom: () => fabricRef.current?.getZoom() || 1,

        duplicate: async () => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject();
          if (!active) return;
          const cloned = await active.clone();
          cloned.set({ left: (active.left || 0) + 20, top: (active.top || 0) + 20 });
          fabricRef.current.add(cloned);
          fabricRef.current.setActiveObject(cloned);
          fabricRef.current.renderAll();
        },

        toggleDrawingMode: (enabled: boolean) => {
          if (!fabricRef.current) return;
          fabricRef.current.isDrawingMode = enabled;
        },
        setDrawingBrush: (options: { color?: string; width?: number }) => {
          if (!fabricRef.current?.freeDrawingBrush) return;
          if (options.color) fabricRef.current.freeDrawingBrush.color = options.color;
          if (options.width) fabricRef.current.freeDrawingBrush.width = options.width;
        },

        canUndo: () => historyIndexRef.current > 0,
        canRedo: () => historyIndexRef.current < historyRef.current.length - 1,

        // ── Image Filters ──
        applyImageFilter: async (filterType: string, value: number) => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject();
          if (!active || active.type !== "image") return;
          const fb = await import("fabric");
          const img = active as any;
          if (!img.filters) img.filters = [];

          // Filter type mapping
          const filterMap: Record<string, { Constructor: any; prop: string; defaultVal: number }> = {
            brightness: { Constructor: fb.filters.Brightness, prop: "brightness", defaultVal: 0 },
            contrast: { Constructor: fb.filters.Contrast, prop: "contrast", defaultVal: 0 },
            saturation: { Constructor: fb.filters.Saturation, prop: "saturation", defaultVal: 0 },
            hueRotation: { Constructor: fb.filters.HueRotation, prop: "rotation", defaultVal: 0 },
            blur: { Constructor: fb.filters.Blur, prop: "blur", defaultVal: 0 },
            noise: { Constructor: fb.filters.Noise, prop: "noise", defaultVal: 0 },
            pixelate: { Constructor: fb.filters.Pixelate, prop: "blocksize", defaultVal: 1 },
            vibrance: { Constructor: fb.filters.Vibrance, prop: "vibrance", defaultVal: 0 },
            gamma: { Constructor: fb.filters.Gamma, prop: "gamma", defaultVal: 1 },
          };

          const booleanFilters: Record<string, any> = {
            grayscale: fb.filters.Grayscale,
            sepia: fb.filters.Sepia,
            invert: fb.filters.Invert,
          };

          // Handle boolean filters (grayscale, sepia, invert)
          if (booleanFilters[filterType]) {
            const idx = img.filters.findIndex(
              (f: any) => f instanceof booleanFilters[filterType]
            );
            if (value > 0 && idx === -1) {
              img.filters.push(new booleanFilters[filterType]());
            } else if (value === 0 && idx !== -1) {
              img.filters.splice(idx, 1);
            }
          }
          // Handle value-based filters
          else if (filterMap[filterType]) {
            const { Constructor, prop, defaultVal } = filterMap[filterType];
            const existingIdx = img.filters.findIndex(
              (f: any) => f instanceof Constructor
            );

            if (value === defaultVal && existingIdx !== -1) {
              // Remove filter if set to default
              img.filters.splice(existingIdx, 1);
            } else if (value !== defaultVal) {
              const opts: any = {};
              if (filterType === "gamma") {
                opts[prop] = [value, value, value];
              } else {
                opts[prop] = value;
              }
              if (existingIdx !== -1) {
                img.filters[existingIdx] = new Constructor(opts);
              } else {
                img.filters.push(new Constructor(opts));
              }
            }
          }

          img.applyFilters();
          fabricRef.current.renderAll();
        },

        removeImageFilters: () => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject();
          if (!active || active.type !== "image") return;
          const img = active as any;
          img.filters = [];
          img.applyFilters();
          fabricRef.current.renderAll();
          saveToHistory();
          onCanvasModified?.();
        },

        setFlowchartMode: (enabled: boolean) => {
          fcMode = enabled;
          if (!enabled) {
            fcHoveredShape = null;
            fcNearPort = null;
            fcCreating = false;
            fcStart = null;
            fcEnd = null;
            if (fabricRef.current) {
              fabricRef.current.forEachObject((obj: any) => {
                if (obj._fcPrev !== undefined) {
                  obj.selectable = obj._fcPrev;
                  delete obj._fcPrev;
                }
              });
              fabricRef.current.selection = true;
              const el = (fabricRef.current as any).upperCanvasEl;
              if (el) el.style.cursor = "";
              fabricRef.current.requestRenderAll();
            }
          } else {
            fabricRef.current?.requestRenderAll();
          }
        },

        // ── Connector / Arrow Styling ──
        updateConnectorStyle: async (options) => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject() as any;
          if (!active || !active._isConnector) return;
          const fb = await import("fabric");

          const color = options.color;
          const sw = options.strokeWidth;
          const ls = options.lineStyle;
          const hs = options.headStyle;

          // Compute dash array from line style
          const dashFromStyle = (style: string | undefined, w: number) => {
            if (!style || style === "solid") return undefined;
            if (style === "dashed") return [w * 4, w * 2];
            if (style === "dotted") return [w, w * 2];
            return undefined;
          };

          // Store metadata on the group
          if (ls) (active as any)._lineStyle = ls;
          if (hs) (active as any)._headStyle = hs;
          if (options.hasStartHead !== undefined) (active as any)._hasStartHead = options.hasStartHead;

          if (active.type === "group") {
            const children = (active as any).getObjects() as any[];
            for (const child of children) {
              const t = child.type;
              // Update lines / polylines
              if (t === "line" || t === "polyline" || t === "path") {
                if (color) child.set("stroke", color);
                if (sw !== undefined) child.set("strokeWidth", sw);
                const finalSW = sw !== undefined ? sw : (child.strokeWidth || 2);
                const finalLS = ls || (active as any)._lineStyle || "solid";
                const dash = dashFromStyle(finalLS, finalSW);
                child.set("strokeDashArray", dash || null);
              }
              // Update arrowhead polygons
              if (t === "polygon" || t === "triangle") {
                if (hs === "none") {
                  child.set("visible", false);
                } else if (hs === "outline") {
                  child.set("visible", true);
                  child.set("fill", "transparent");
                  child.set("stroke", color || child.stroke || "#475569");
                  child.set("strokeWidth", sw !== undefined ? sw : 2);
                } else if (hs === "open") {
                  child.set("visible", true);
                  child.set("fill", "transparent");
                  child.set("stroke", color || child.stroke || "#475569");
                  child.set("strokeWidth", sw !== undefined ? sw : 2);
                } else if (hs === "diamond" || hs === "circle") {
                  child.set("visible", true);
                  child.set("fill", color || child.fill || "#475569");
                } else {
                  // filled (default)
                  child.set("visible", true);
                  child.set("fill", color || child.fill || "#475569");
                  child.set("stroke", "");
                  child.set("strokeWidth", 0);
                }
                if (color && hs !== "outline" && hs !== "open") child.set("fill", color);
              }
            }
            active.dirty = true;
          } else {
            // Single line connector
            if (color) active.set("stroke", color);
            if (sw !== undefined) active.set("strokeWidth", sw);
            const finalSW = sw !== undefined ? sw : (active.strokeWidth || 2);
            const finalLS = ls || "solid";
            const dash = dashFromStyle(finalLS, finalSW);
            active.set("strokeDashArray", dash || null);
          }
          fabricRef.current.renderAll();
          saveToHistory();
          onCanvasModified?.();
        },

        getConnectorStyle: () => {
          if (!fabricRef.current) return null;
          const active = fabricRef.current.getActiveObject() as any;
          if (!active || !active._isConnector) return null;

          let color = "#475569";
          let strokeWidth = 2.5;
          const lineStyle = (active._lineStyle || "solid") as "solid" | "dashed" | "dotted";
          const headStyle = (active._headStyle || "filled") as "filled" | "outline" | "open" | "diamond" | "circle" | "none";
          const hasStartHead = !!(active._hasStartHead);

          if (active.type === "group") {
            const children = (active as any).getObjects() as any[];
            for (const child of children) {
              if (child.type === "line" || child.type === "polyline" || child.type === "path") {
                color = child.stroke || color;
                strokeWidth = child.strokeWidth || strokeWidth;
                break;
              }
            }
          } else {
            color = active.stroke || color;
            strokeWidth = active.strokeWidth || strokeWidth;
          }

          return { color, strokeWidth, lineStyle, headStyle, hasStartHead };
        },

        getImageFilters: () => {
          if (!fabricRef.current) return {};
          const active = fabricRef.current.getActiveObject();
          if (!active || active.type !== "image") return {};
          const img = active as any;
          const result: Record<string, number> = {
            brightness: 0, contrast: 0, saturation: 0,
            hueRotation: 0, blur: 0, noise: 0,
            pixelate: 1, vibrance: 0, gamma: 1,
            grayscale: 0, sepia: 0, invert: 0,
          };
          if (!img.filters) return result;
          for (const filter of img.filters) {
            const name = filter.constructor.name || filter.type;
            switch (name) {
              case "Brightness": result.brightness = filter.brightness || 0; break;
              case "Contrast": result.contrast = filter.contrast || 0; break;
              case "Saturation": result.saturation = filter.saturation || 0; break;
              case "HueRotation": result.hueRotation = filter.rotation || 0; break;
              case "Blur": result.blur = filter.blur || 0; break;
              case "Noise": result.noise = filter.noise || 0; break;
              case "Pixelate": result.pixelate = filter.blocksize || 1; break;
              case "Vibrance": result.vibrance = filter.vibrance || 0; break;
              case "Gamma": result.gamma = filter.gamma?.[0] || 1; break;
              case "Grayscale": result.grayscale = 1; break;
              case "Sepia": result.sepia = 1; break;
              case "Invert": result.invert = 1; break;
            }
          }
          return result;
        },
      };

      onReady?.(api);
    };

    initCanvas();

    return () => {
      isMounted = false;
      resizeObserverRef.current?.disconnect();
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      if (canvasEl && canvasEl.parentNode) {
        canvasEl.remove();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update design dimensions and artboard when props change
  useEffect(() => {
    designWidthRef.current = width;
    designHeightRef.current = height;
    if (artboardRef.current) {
      (artboardRef.current as any).set({ width, height });
      artboardRef.current.setCoords();
      fabricRef.current?.requestRenderAll();
    }
  }, [width, height]);

  return (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden flex-1"
      style={{
        minHeight: "100%",
        backgroundImage:
          "radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
