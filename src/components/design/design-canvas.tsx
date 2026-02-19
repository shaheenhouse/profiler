"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Canvas as FabricCanvas, Object as FabricObject } from "fabric";
import * as fabricLib from "fabric";

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
  applyImageFilter: (filterType: string, value: number) => void;
  removeImageFilters: () => void;
  getImageFilters: () => Record<string, number>;
  setFlowchartMode: (enabled: boolean) => void;
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
  const clipboardRef = useRef<FabricObject[] | null>(null);
  const artboardRef = useRef<FabricObject | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const designWidthRef = useRef(width);
  const designHeightRef = useRef(height);
  const centerTimersRef = useRef<number[]>([]);
  const cssZoomRef = useRef(1);

  // Stable ref for zoom change callback
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

  const saveToHistory = useCallback(() => {
    if (isLoadingRef.current || !fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    if (historyRef.current.length > 100) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
  }, []);

  const clearCenteringTimers = useCallback(() => {
    for (const t of centerTimersRef.current) window.clearTimeout(t);
    centerTimersRef.current = [];
  }, []);

  const centerArtboard = useCallback((canvas: FabricCanvas, dw: number, dh: number) => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    if (!wrapper || !container) return;
    const ww = wrapper.clientWidth;
    const wh = wrapper.clientHeight;
    if (ww < 10 || wh < 10) return;

    canvas.setDimensions({ width: dw, height: dh });
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];

    const padding = 60;
    const scale = Math.min(
      (ww - padding * 2) / dw,
      (wh - padding * 2) / dh,
      2
    );

    // Let Fabric's .canvas-container dictate the container size.
    // We just apply the CSS scale transform to the container for zoom-to-fit.
    container.style.width = `${dw}px`;
    container.style.height = `${dh}px`;
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = "center center";

    cssZoomRef.current = scale;
    canvas.requestRenderAll();
    onZoomChangeRef.current?.(scale);
  }, []);

  // Schedule centering attempts - layout may not be ready immediately
  const scheduleCenteringBurst = useCallback((canvas: FabricCanvas, dw: number, dh: number) => {
    clearCenteringTimers();
    // First attempt: immediate
    centerArtboard(canvas, dw, dh);
    // Retry with requestAnimationFrame for next paint
    const raf = requestAnimationFrame(() => {
      if (!fabricRef.current) return;
      centerArtboard(canvas, dw, dh);
    });
    centerTimersRef.current.push(raf as unknown as number);
    // Additional retries to catch late layout shifts
    for (const ms of [100, 300, 600]) {
      const timer = window.setTimeout(() => {
        if (!fabricRef.current) return;
        centerArtboard(canvas, dw, dh);
      }, ms);
      centerTimersRef.current.push(timer);
    }
  }, [clearCenteringTimers, centerArtboard]);

  useEffect(() => {
    let isMounted = true;
    let canvasEl: HTMLCanvasElement | null = null;

    const initCanvas = async () => {
      const fabric = fabricLib;
      if (!isMounted || !containerRef.current) return;

      canvasEl = document.createElement("canvas");
      containerRef.current.appendChild(canvasEl);

      const canvas = new fabric.Canvas(canvasEl, {
        width,
        height,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
        selection: true,
        controlsAboveOverlay: true,
        fireRightClick: true,
        stopContextMenu: true,
      });

      if (!isMounted) {
        canvas.dispose();
        if (canvasEl.parentNode) canvasEl.remove();
        return;
      }

      fabricRef.current = canvas;
      artboardRef.current = null;

      // Center artboard and keep recentering while layout settles.
      scheduleCenteringBurst(canvas, width, height);

      // Customize control appearance (Canva-style)
      try {
        fabric.FabricObject.prototype.set({
          transparentCorners: false,
          borderColor: "#7c3aed",
          cornerColor: "#7c3aed",
          cornerStrokeColor: "#ffffff",
          cornerStyle: "circle",
          cornerSize: 10,
          borderScaleFactor: 1.5,
          padding: 4,
        } as any);
      } catch {
        // Some versions may not support all properties
      }

      // Re-apply Fabric's built-in cursor handlers on all default controls
      // to guarantee correct diagonal / h / v resize cursors.
      try {
        const controls = (fabric.FabricObject.prototype as any).controls;
        if (controls) {
          const { scaleCursorStyleHandler, scaleSkewCursorStyleHandler } = fabric.controlsUtils;
          if (scaleCursorStyleHandler) {
            for (const k of ['tl', 'tr', 'bl', 'br']) {
              if (controls[k]) controls[k].cursorStyleHandler = scaleCursorStyleHandler;
            }
          }
          if (scaleSkewCursorStyleHandler) {
            for (const k of ['ml', 'mr', 'mt', 'mb']) {
              if (controls[k]) controls[k].cursorStyleHandler = scaleSkewCursorStyleHandler;
            }
          }
        }
      } catch {
        // Cursor handlers are a nice-to-have
      }

      // ResizeObserver to recenter when container changes
      // (e.g. when left toolbar panel expands/collapses)
      let resizeRAF: number | null = null;
      const ro = new ResizeObserver(() => {
        if (!fabricRef.current) return;
        if (resizeRAF) cancelAnimationFrame(resizeRAF);
        resizeRAF = requestAnimationFrame(() => {
          if (!fabricRef.current) return;
          // Re-center by recalculating the fit zoom
          centerArtboard(fabricRef.current, designWidthRef.current, designHeightRef.current);
        });
      });
      if (wrapperRef.current) ro.observe(wrapperRef.current);
      resizeObserverRef.current = ro;

      // ── Pan support (Space + drag, middle-click drag, or Alt + drag) ──
      let isPanning = false;
      let panLastX = 0;
      let panLastY = 0;
      let spaceHeld = false;

      const handleKeyDownForPan = (e: KeyboardEvent) => {
        if (e.code === "Space" && !spaceHeld) {
          spaceHeld = true;
          const el = (canvas as any).upperCanvasEl;
          if (el) el.style.cursor = "grab";
        }
      };
      const handleKeyUpForPan = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          spaceHeld = false;
          if (!isPanning) {
            const el = (canvas as any).upperCanvasEl;
            if (el) el.style.cursor = "";
          }
        }
      };
      window.addEventListener("keydown", handleKeyDownForPan);
      window.addEventListener("keyup", handleKeyUpForPan);

      canvas.on("mouse:down", (opt) => {
        const ev = opt.e as any;
        if (spaceHeld || ev.altKey || ev.button === 1) {
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
        const dx = (ev.clientX || 0) - panLastX;
        const dy = (ev.clientY || 0) - panLastY;
        panLastX = ev.clientX || 0;
        panLastY = ev.clientY || 0;

        // Pan by scrolling the wrapper (CSS transform handles positioning)
        if (wrapperRef.current) {
          wrapperRef.current.scrollLeft -= dx;
          wrapperRef.current.scrollTop -= dy;
        }
      });
      canvas.on("mouse:up", () => {
        if (isPanning) {
          isPanning = false;
          canvas.selection = true;
          const el = (canvas as any).upperCanvasEl;
          if (el) el.style.cursor = spaceHeld ? "grab" : "";
        }
      });

      // Selection events - pass the actual active object (ActiveSelection for multi-select)
      canvas.on("selection:created", () => {
        onSelectionChange?.(canvas.getActiveObject() || null);
      });
      canvas.on("selection:updated", () => {
        onSelectionChange?.(canvas.getActiveObject() || null);
      });
      canvas.on("selection:cleared", () => {
        onSelectionChange?.(null);
      });

      // History tracking
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
      canvas.on("object:moving", (e) => {
        const target = e.target as any;
        if (!target?._isConnector || !target._connectorData) return;
        const prevLeft = target._lastLeft ?? target.left ?? 0;
        const prevTop = target._lastTop ?? target.top ?? 0;
        const nextLeft = target.left ?? 0;
        const nextTop = target.top ?? 0;
        const dx = nextLeft - prevLeft;
        const dy = nextTop - prevTop;
        if (dx === 0 && dy === 0) return;
        target._connectorData = {
          ...target._connectorData,
          x1: target._connectorData.x1 + dx,
          y1: target._connectorData.y1 + dy,
          x2: target._connectorData.x2 + dx,
          y2: target._connectorData.y2 + dy,
        };
        target._lastLeft = nextLeft;
        target._lastTop = nextTop;
      });
      canvas.on("object:modified", (e) => {
        const target = e.target as any;
        if (!target?._isConnector) return;
        target._lastLeft = target.left ?? 0;
        target._lastTop = target.top ?? 0;
      });

      // Ctrl+Scroll zoom - CSS transform based
      canvas.on("mouse:wheel", (opt) => {
        if (!opt.e.ctrlKey && !opt.e.metaKey) return;
        opt.e.preventDefault();
        opt.e.stopPropagation();
        if (!containerRef.current) return;
        const delta = opt.e.deltaY;
        let zoom = cssZoomRef.current;
        zoom *= 0.999 ** delta;
        if (zoom > 5) zoom = 5;
        if (zoom < 0.1) zoom = 0.1;
        cssZoomRef.current = zoom;
        containerRef.current.style.transform = `scale(${zoom})`;
        onZoomChangeRef.current?.(zoom);
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
      let connectorDragState: {
        group: any;
      } | null = null;

      function fcDashFromStyle(style: "solid" | "dashed" | "dotted", w: number) {
        if (style === "dashed") return [w * 4, w * 2];
        if (style === "dotted") return [w, w * 2];
        return undefined;
      }

      function fcHeadPolygonPoints(x: number, y: number, angle: number, size = 14) {
        return [
          { x, y },
          { x: x - size * Math.cos(angle - Math.PI / 7), y: y - size * Math.sin(angle - Math.PI / 7) },
          { x: x - size * Math.cos(angle + Math.PI / 7), y: y - size * Math.sin(angle + Math.PI / 7) },
        ];
      }

      function fcCreateConnectorGroup(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        options?: {
          mode?: "straight" | "elbow";
          color?: string;
          strokeWidth?: number;
          lineStyle?: "solid" | "dashed" | "dotted";
          headStyle?: "filled" | "outline" | "open" | "diamond" | "circle" | "none";
          hasStartHead?: boolean;
        }
      ) {
        const fb = fabricLib;
        const mode = options?.mode || "straight";
        const color = options?.color || "#475569";
        const strokeWidth = options?.strokeWidth ?? 2.5;
        const lineStyle = options?.lineStyle || "solid";
        const headStyle = options?.headStyle || "filled";
        const hasStartHead = !!options?.hasStartHead;

        const dash = fcDashFromStyle(lineStyle, strokeWidth);
        const parts: any[] = [];

        let line: any;
        let endAngle = Math.atan2(y2 - y1, x2 - x1);
        let startAngle = endAngle + Math.PI;

        if (mode === "elbow") {
          const pts = [
            { x: x1, y: y1 },
            { x: x1, y: y2 },
            { x: x2, y: y2 },
          ];
          line = new fb.Polyline(pts, {
            stroke: color,
            strokeWidth,
            fill: "",
            strokeDashArray: dash || null,
          });
          endAngle = Math.atan2(0, x2 - x1);
          startAngle = Math.atan2(y1 - y2, 0);
        } else {
          line = new fb.Line([x1, y1, x2, y2], {
            stroke: color,
            strokeWidth,
            strokeDashArray: dash || null,
          });
        }
        parts.push(line);

        if (headStyle !== "none") {
          const endHead = new fb.Polygon(fcHeadPolygonPoints(x2, y2, endAngle, 14), {
            fill: headStyle === "outline" || headStyle === "open" ? "transparent" : color,
            stroke: headStyle === "outline" || headStyle === "open" ? color : "",
            strokeWidth: headStyle === "outline" || headStyle === "open" ? Math.max(1.5, strokeWidth * 0.7) : 0,
          });
          parts.push(endHead);
        }

        if (hasStartHead && headStyle !== "none") {
          const startHead = new fb.Polygon(fcHeadPolygonPoints(x1, y1, startAngle, 14), {
            fill: headStyle === "outline" || headStyle === "open" ? "transparent" : color,
            stroke: headStyle === "outline" || headStyle === "open" ? color : "",
            strokeWidth: headStyle === "outline" || headStyle === "open" ? Math.max(1.5, strokeWidth * 0.7) : 0,
          });
          parts.push(startHead);
        }

        const group = new fb.Group(parts);
        (group as any)._isConnector = true;
        (group as any)._lineStyle = lineStyle;
        (group as any)._headStyle = headStyle;
        (group as any)._hasStartHead = hasStartHead;
        (group as any)._connectorData = { x1, y1, x2, y2, mode };
        (group as any)._lastLeft = group.left || 0;
        (group as any)._lastTop = group.top || 0;
        return group;
      }

      function fcReplaceConnectorGroup(oldGroup: any, nextData: { x1: number; y1: number; x2: number; y2: number; mode: "straight" | "elbow" }) {
        const canvasLocal = fabricRef.current;
        if (!canvasLocal) return oldGroup;
        const children = oldGroup?.getObjects?.() || [];
        let color = "#475569";
        let strokeWidth = 2.5;
        for (const child of children) {
          if (child.type === "line" || child.type === "polyline" || child.type === "path") {
            color = child.stroke || color;
            strokeWidth = child.strokeWidth || strokeWidth;
            break;
          }
        }
        const replacement = fcCreateConnectorGroup(nextData.x1, nextData.y1, nextData.x2, nextData.y2, {
          mode: nextData.mode,
          color,
          strokeWidth,
          lineStyle: oldGroup?._lineStyle || "solid",
          headStyle: oldGroup?._headStyle || "filled",
          hasStartHead: !!oldGroup?._hasStartHead,
        });
        const wasActive = canvasLocal.getActiveObject() === oldGroup;
        canvasLocal.remove(oldGroup);
        canvasLocal.add(replacement);
        if (wasActive) canvasLocal.setActiveObject(replacement);
        canvasLocal.requestRenderAll();
        return replacement;
      }

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

      canvas.on("after:render", () => {
        if (!fcMode) return;
        const ctx = (canvas as any).contextContainer as CanvasRenderingContext2D | null;
        if (!ctx) return;
        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

        ctx.save();
        ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);

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

        if (fcCreating && fcStart && fcEnd) {
          const dx = fcEnd.x - fcStart.x;
          const dy = fcEnd.y - fcStart.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 5) {
            ctx.beginPath();
            ctx.moveTo(fcStart.x, fcStart.y);
            ctx.lineTo(fcEnd.x, fcEnd.y);
            ctx.strokeStyle = "rgba(59,130,246,0.95)";
            ctx.lineWidth = 3;
            ctx.shadowColor = "rgba(59,130,246,0.65)";
            ctx.shadowBlur = 14;
            ctx.setLineDash([8, 5]);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.setLineDash([]);

            const ang = Math.atan2(dy, dx);
            const hl = 14;
            ctx.beginPath();
            ctx.moveTo(fcEnd.x, fcEnd.y);
            ctx.lineTo(fcEnd.x - hl * Math.cos(ang - Math.PI / 6), fcEnd.y - hl * Math.sin(ang - Math.PI / 6));
            ctx.lineTo(fcEnd.x - hl * Math.cos(ang + Math.PI / 6), fcEnd.y - hl * Math.sin(ang + Math.PI / 6));
            ctx.closePath();
            ctx.fillStyle = "rgba(59,130,246,0.95)";
            ctx.shadowColor = "rgba(59,130,246,0.6)";
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          const objs = canvas.getObjects();
          for (const obj of objs) {
            if (obj === fcHoveredShape || (obj as any)._isConnector) continue;
            const ports = fcGetPorts(obj);
            for (const pt of ports) {
              if (Math.hypot(pt.x - fcEnd!.x, pt.y - fcEnd!.y) < 25) {
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
        return {
          x: ((e.offsetX ?? e.clientX ?? 0) - vpt[4]) / vpt[0],
          y: ((e.offsetY ?? e.clientY ?? 0) - vpt[5]) / vpt[3],
        };
      }

      function fcFindTarget(e: any): FabricObject | null {
        const result = canvas.findTarget(e) as any;
        if (!result) return null;
        if (result.target !== undefined) return result.target as FabricObject;
        return result as FabricObject;
      }

      const isActiveSelectionObj = (obj: any) =>
        !!obj && (obj.type === "activeselection" || obj.type === "activeSelection");

      canvas.on("mouse:move", (opt) => {
        if (!fcMode) return;
        const pointer = fcGetPointer(opt.e);
        if (fcCreating) {
          fcEnd = { x: pointer.x, y: pointer.y };
          canvas.requestRenderAll();
          return;
        }
        if (fcHoveredShape) (fcHoveredShape as any).selectable = true;
        canvas.selection = true;

        const target = fcFindTarget(opt.e);
        const tAny = target as any;
        if (target && !isActiveSelectionObj(tAny) && !tAny._isConnector && !tAny._isBgImage
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

      canvas.on("mouse:up", async () => {
        if (!fcCreating) return;
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

        const group = fcCreateConnectorGroup(fcStart.x, fcStart.y, finalEnd.x, finalEnd.y, {
          mode: "straight",
          color: "#475569",
          strokeWidth: 2.5,
          lineStyle: "solid",
          headStyle: "filled",
          hasStartHead: false,
        });
        canvas.add(group);
        canvas.setActiveObject(group);

        fcStart = null;
        fcEnd = null;
        canvas.requestRenderAll();
        saveToHistory();
        onCanvasModified?.();
      });

      // Drag arrow head to extend / bend connectors (90-degree elbow support)
      canvas.on("mouse:down", (opt) => {
        if (fcCreating) return;
        const target = fcFindTarget(opt.e) as any;
        if (!target || !target._isConnector || !target._connectorData) return;
        const pointer = fcGetPointer(opt.e);
        const data = target._connectorData;
        const headDist = Math.hypot(pointer.x - data.x2, pointer.y - data.y2);
        if (headDist > 18) return;
        connectorDragState = { group: target };
        canvas.selection = false;
        canvas.setActiveObject(target);
        const el = (canvas as any).upperCanvasEl;
        if (el) el.style.cursor = "crosshair";
      });

      canvas.on("mouse:move", (opt) => {
        if (!connectorDragState) return;
        const pointer = fcGetPointer(opt.e);
        const group = connectorDragState.group;
        const data = group?._connectorData;
        if (!data) return;

        let mode: "straight" | "elbow" = "straight";
        if (Math.abs(pointer.y - data.y1) > 18) mode = "elbow";

        let x2 = pointer.x;
        let y2 = pointer.y;
        if (mode === "elbow" && Math.abs(x2 - data.x1) < 20) {
          x2 = x2 >= data.x1 ? data.x1 + 40 : data.x1 - 40;
        }

        const replacement = fcReplaceConnectorGroup(group, {
          x1: data.x1,
          y1: data.y1,
          x2,
          y2,
          mode,
        });
        connectorDragState.group = replacement;
      });

      canvas.on("mouse:up", () => {
        if (!connectorDragState) return;
        connectorDragState = null;
        canvas.selection = true;
        const el = (canvas as any).upperCanvasEl;
        if (el) el.style.cursor = "";
        saveToHistory();
        onCanvasModified?.();
      });

      // ═══════════════════════════════════════════════
      // ── Canvas API ──
      // ═══════════════════════════════════════════════
      const api: DesignCanvasAPI = {
        getCanvas: () => fabricRef.current,

        toJSON: () => {
          if (!fabricRef.current) return "{}";
          const json = fabricRef.current.toJSON();
          json.width = designWidthRef.current;
          json.height = designHeightRef.current;
          json.background = fabricRef.current.backgroundColor || "#ffffff";
          return JSON.stringify(json);
        },

        loadJSON: async (json: string) => {
          if (!fabricRef.current) return;
          isLoadingRef.current = true;
          try {
            const parsed = JSON.parse(json);
            const bgColor = parsed.background || parsed.backgroundColor || "#ffffff";
            await fabricRef.current.loadFromJSON(parsed);

            fabricRef.current.backgroundColor = bgColor;
            fabricRef.current.setDimensions({
              width: designWidthRef.current,
              height: designHeightRef.current,
            });

            scheduleCenteringBurst(fabricRef.current, designWidthRef.current, designHeightRef.current);
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
            const fb = fabricLib;
            const dw = designWidthRef.current;
            const dh = designHeightRef.current;
            const bgColor = (fabricRef.current.backgroundColor as string) || "#ffffff";

            const jsonData = fabricRef.current.toJSON();
            jsonData.width = dw;
            jsonData.height = dh;
            jsonData.background = bgColor;

            const tempEl = document.createElement("canvas");
            const tempCanvas = new fb.StaticCanvas(tempEl, { width: dw, height: dh });
            tempCanvas.backgroundColor = bgColor;
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
          const fb = fabricLib;
          const dw = designWidthRef.current;
          const dh = designHeightRef.current;
          const textObj = new fb.IText(text, {
            left: dw / 2 - 100,
            top: dh / 2 - 20,
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
          const fb = fabricLib;
          const dw = designWidthRef.current;
          const dh = designHeightRef.current;
          const centerX = dw / 2;
          const centerY = dh / 2;
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

            // Flowchart Shapes
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

            // Connectors
            case "connector-arrow": {
              const cg1 = fcCreateConnectorGroup(centerX - 100, centerY, centerX + 100, centerY, {
                mode: "straight",
                color: "#333333",
                strokeWidth: 3,
                lineStyle: "solid",
                headStyle: "filled",
              });
              shape = cg1 as unknown as FabricObject;
              break;
            }
            case "connector-double": {
              const cg2 = fcCreateConnectorGroup(centerX - 100, centerY, centerX + 100, centerY, {
                mode: "straight",
                color: "#333333",
                strokeWidth: 3,
                lineStyle: "solid",
                headStyle: "filled",
                hasStartHead: true,
              });
              shape = cg2 as unknown as FabricObject;
              break;
            }
            case "connector-dashed": {
              const cg3 = fcCreateConnectorGroup(centerX - 100, centerY, centerX + 100, centerY, {
                mode: "straight",
                color: "#333333",
                strokeWidth: 3,
                lineStyle: "dashed",
                headStyle: "filled",
              });
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
              const cg5 = fcCreateConnectorGroup(centerX - 100, centerY - 50, centerX + 100, centerY, {
                mode: "elbow",
                color: "#333333",
                strokeWidth: 3,
                lineStyle: "solid",
                headStyle: "filled",
              });
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
          const fb = fabricLib;
          try {
            const dw = designWidthRef.current;
            const dh = designHeightRef.current;
            const img = await fb.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
            const maxW = dw * 0.6;
            const maxH = dh * 0.6;
            const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1);
            img.set({
              left: dw / 2 - ((img.width || 0) * scale) / 2,
              top: dh / 2 - ((img.height || 0) * scale) / 2,
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
          const fb = fabricLib;
          try {
            const dw = designWidthRef.current;
            const dh = designHeightRef.current;
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
              left: dw / 2 - (objW * scale) / 2,
              top: dh / 2 - (objH * scale) / 2,
              scaleX: scale, scaleY: scale,
            });
            if (options?.fill) {
              const colorDeep = (o: any, c: string) => {
                const kids = o.getObjects ? o.getObjects() : [];
                for (const child of kids) {
                  if (child.type === "group") { colorDeep(child, c); }
                  else {
                    if (child.fill != null && child.fill !== "none" && child.fill !== "") child.set("fill", c);
                    if (child.stroke) child.set("stroke", c);
                  }
                  child.dirty = true;
                }
                o.dirty = true;
              };
              if (obj.type === "group") {
                colorDeep(obj, options.fill);
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
          fabricRef.current.backgroundColor = color;
          fabricRef.current.renderAll();
          saveToHistory();
          onCanvasModified?.();
        },

        setBackgroundImage: async (url: string) => {
          if (!fabricRef.current) return;
          const fb = fabricLib;
          try {
            const img = await fb.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
            const dw = designWidthRef.current;
            const dh = designHeightRef.current;
            img.set({
              left: 0, top: 0,
              scaleX: dw / (img.width || 1),
              scaleY: dh / (img.height || 1),
              selectable: false, evented: false,
            });
            (img as any)._isBgImage = true;

            const existing = fabricRef.current.getObjects().find((o: any) => (o as any)._isBgImage);
            if (existing) fabricRef.current.remove(existing);

            fabricRef.current.add(img);
            fabricRef.current.sendObjectToBack(img);
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
            (o: any) => !(o as any)._isBgImage
          );
          if (active.length > 0) {
            active.forEach((obj) => fabricRef.current!.remove(obj));
            fabricRef.current.discardActiveObject();
            fabricRef.current.renderAll();
          }
        },

        selectAll: async () => {
          if (!fabricRef.current) return;
          const fb = fabricLib;
          const objects = fabricRef.current.getObjects().filter(
            (o: any) => !(o as any)._isBgImage && o.selectable !== false
          );
          if (objects.length > 0) {
            const selection = new fb.ActiveSelection(objects, { canvas: fabricRef.current });
            fabricRef.current.setActiveObject(selection);
            fabricRef.current.renderAll();
          }
        },

        clearCanvas: async () => {
          if (!fabricRef.current) return;
          fabricRef.current.getObjects().slice().forEach((o) => fabricRef.current!.remove(o));
          fabricRef.current.backgroundImage = undefined as any;
          fabricRef.current.discardActiveObject();
          fabricRef.current.backgroundColor = "#ffffff";
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

        group: () => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const active = canvas.getActiveObject();
          if (!active || !isActiveSelectionObj(active)) return;
          const objects = canvas.getActiveObjects().slice();
          if (objects.length < 2) return;

          canvas.discardActiveObject();
          for (const obj of objects) canvas.remove(obj);
          const group = new fabricLib.Group(objects);
          canvas.add(group);
          group.setCoords();
          canvas.setActiveObject(group);
          canvas.requestRenderAll();
          saveToHistory();
          onCanvasModified?.();
        },

        ungroup: () => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const active = canvas.getActiveObject();
          if (!active || active.type !== "group") return;

          const group = active as any;
          const children: FabricObject[] = (group._objects as FabricObject[]).slice();
          if (children.length === 0) return;

          // child.calcTransformMatrix() already includes the full parent
          // chain (group transform * own transform), so it directly gives
          // the absolute canvas transform. Decompose it to get the exact
          // visual position/scale/angle/skew each child has on screen.
          const { qrDecompose } = fabricLib.util;
          const snapshots = children.map(child => {
            const absMatrix = child.calcTransformMatrix();
            return { obj: child, decomposed: qrDecompose(absMatrix) };
          });

          canvas.discardActiveObject();
          group._objects = [];
          canvas.remove(group);

          for (const { obj, decomposed } of snapshots) {
            if ((obj as any)._set) {
              (obj as any)._set('group', undefined);
              (obj as any)._set('parent', undefined);
            } else {
              (obj as any).group = undefined;
              (obj as any).parent = undefined;
            }
            obj.set({
              scaleX: decomposed.scaleX,
              scaleY: decomposed.scaleY,
              angle: decomposed.angle,
              skewX: decomposed.skewX,
              skewY: decomposed.skewY,
              flipX: false,
              flipY: false,
            });
            obj.setPositionByOrigin(
              new fabricLib.Point(decomposed.translateX, decomposed.translateY),
              'center',
              'center',
            );
            obj.setCoords();
            canvas.add(obj);
          }

          const objs = snapshots.map(s => s.obj);
          if (objs.length > 1) {
            const sel = new fabricLib.ActiveSelection(objs, { canvas });
            canvas.setActiveObject(sel);
          } else {
            canvas.setActiveObject(objs[0]);
          }
          canvas.requestRenderAll();
          saveToHistory();
          onCanvasModified?.();
        },

        // ── Clipboard ──
        copySelected: async () => {
          if (!fabricRef.current) return;
          const canvas = fabricRef.current;
          const active = canvas.getActiveObject();
          if (!active) return;
          if (isActiveSelectionObj(active)) {
            const originals = [...(active as any).getObjects()] as FabricObject[];
            canvas.discardActiveObject();
            const clones: FabricObject[] = [];
            for (const obj of originals) {
              clones.push(await obj.clone());
            }
            const sel = new fabricLib.ActiveSelection(originals, { canvas });
            canvas.setActiveObject(sel);
            canvas.renderAll();
            clipboardRef.current = clones;
          } else {
            clipboardRef.current = [await active.clone()];
          }
        },

        cutSelected: async () => {
          if (!fabricRef.current) return;
          const canvas = fabricRef.current;
          const active = canvas.getActiveObject();
          if (!active) return;
          if (isActiveSelectionObj(active)) {
            const originals = [...(active as any).getObjects()] as FabricObject[];
            canvas.discardActiveObject();
            const clones: FabricObject[] = [];
            for (const obj of originals) {
              clones.push(await obj.clone());
            }
            for (const obj of originals) {
              canvas.remove(obj);
            }
            clipboardRef.current = clones;
          } else {
            clipboardRef.current = [await active.clone()];
            canvas.remove(active);
          }
          canvas.discardActiveObject();
          canvas.renderAll();
        },

        paste: async () => {
          if (!fabricRef.current || !clipboardRef.current || clipboardRef.current.length === 0) return;
          const canvas = fabricRef.current;
          const clones: FabricObject[] = [];
          for (const src of clipboardRef.current) {
            const c = await src.clone();
            c.set({
              left: (src.left || 0) + 20,
              top: (src.top || 0) + 20,
            });
            canvas.add(c);
            clones.push(c);
          }
          for (const src of clipboardRef.current) {
            src.set({
              left: (src.left || 0) + 20,
              top: (src.top || 0) + 20,
            });
          }
          if (clones.length === 1) {
            canvas.setActiveObject(clones[0]);
          } else {
            const sel = new fabricLib.ActiveSelection(clones, { canvas });
            canvas.setActiveObject(sel);
          }
          canvas.renderAll();
        },

        // ── Alignment ──
        alignToCanvas: (type) => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject();
          if (!active) return;
          const dw = designWidthRef.current;
          const dh = designHeightRef.current;
          const bound = active.getBoundingRect();
          const zoom = fabricRef.current.getZoom() || 1;
          const vpt = fabricRef.current.viewportTransform || [1, 0, 0, 1, 0, 0];
          const objW = bound.width / zoom;
          const objH = bound.height / zoom;
          const currentLeft = active.left || 0;
          const currentTop = active.top || 0;
          const boundLeft = (bound.left - vpt[4]) / zoom;
          const boundTop = (bound.top - vpt[5]) / zoom;
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
            isLoadingRef.current = false;
            // Recenter after restoring state (loadFromJSON resets VPT)
            if (fabricRef.current) {
              centerArtboard(fabricRef.current, designWidthRef.current, designHeightRef.current);
            }
            onCanvasModified?.();
          });
        },
        redo: () => {
          if (!fabricRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;
          historyIndexRef.current++;
          isLoadingRef.current = true;
          const state = historyRef.current[historyIndexRef.current];
          fabricRef.current.loadFromJSON(JSON.parse(state)).then(() => {
            isLoadingRef.current = false;
            // Recenter after restoring state (loadFromJSON resets VPT)
            if (fabricRef.current) {
              centerArtboard(fabricRef.current, designWidthRef.current, designHeightRef.current);
            }
            onCanvasModified?.();
          });
        },

        // ── Zoom (CSS transform) ──
        zoomIn: () => {
          if (!containerRef.current) return;
          let z = cssZoomRef.current * 1.2;
          if (z > 5) z = 5;
          cssZoomRef.current = z;
          containerRef.current.style.transform = `scale(${z})`;
          onZoomChangeRef.current?.(z);
        },
        zoomOut: () => {
          if (!containerRef.current) return;
          let z = cssZoomRef.current * 0.8;
          if (z < 0.1) z = 0.1;
          cssZoomRef.current = z;
          containerRef.current.style.transform = `scale(${z})`;
          onZoomChangeRef.current?.(z);
        },
        resetZoom: () => {
          if (!containerRef.current) return;
          cssZoomRef.current = 1;
          containerRef.current.style.transform = `scale(1)`;
          onZoomChangeRef.current?.(1);
        },
        zoomToFit: () => {
          if (!fabricRef.current) return;
          centerArtboard(fabricRef.current, designWidthRef.current, designHeightRef.current);
        },
        getZoom: () => cssZoomRef.current,

        duplicate: async () => {
          if (!fabricRef.current) return;
          const canvas = fabricRef.current;
          const active = canvas.getActiveObject();
          if (!active) return;

          if (isActiveSelectionObj(active)) {
            const originals = [...(active as any).getObjects()] as FabricObject[];
            canvas.discardActiveObject();
            const clones: FabricObject[] = [];
            for (const obj of originals) {
              const c = await obj.clone();
              c.set({
                left: (obj.left || 0) + 20,
                top: (obj.top || 0) + 20,
              });
              canvas.add(c);
              clones.push(c);
            }
            const sel = new fabricLib.ActiveSelection(clones, { canvas });
            canvas.setActiveObject(sel);
          } else {
            const cloned = await active.clone();
            cloned.set({ left: (active.left || 0) + 20, top: (active.top || 0) + 20 });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
          }
          canvas.requestRenderAll();
          saveToHistory();
          onCanvasModified?.();
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
          const fb = fabricLib;
          const img = active as any;
          if (!img.filters) img.filters = [];

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

          if (booleanFilters[filterType]) {
            const idx = img.filters.findIndex((f: any) => f instanceof booleanFilters[filterType]);
            if (value > 0 && idx === -1) img.filters.push(new booleanFilters[filterType]());
            else if (value === 0 && idx !== -1) img.filters.splice(idx, 1);
          } else if (filterMap[filterType]) {
            const { Constructor, prop, defaultVal } = filterMap[filterType];
            const existingIdx = img.filters.findIndex((f: any) => f instanceof Constructor);
            if (value === defaultVal && existingIdx !== -1) {
              img.filters.splice(existingIdx, 1);
            } else if (value !== defaultVal) {
              const opts: any = {};
              if (filterType === "gamma") opts[prop] = [value, value, value];
              else opts[prop] = value;
              if (existingIdx !== -1) img.filters[existingIdx] = new Constructor(opts);
              else img.filters.push(new Constructor(opts));
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

        // ── Connector Styling ──
        updateConnectorStyle: async (options) => {
          if (!fabricRef.current) return;
          const active = fabricRef.current.getActiveObject() as any;
          if (!active || !active._isConnector) return;

          const color = options.color;
          const sw = options.strokeWidth;
          const ls = options.lineStyle;
          const hs = options.headStyle;

          const dashFromStyle = (style: string | undefined, w: number) => {
            if (!style || style === "solid") return undefined;
            if (style === "dashed") return [w * 4, w * 2];
            if (style === "dotted") return [w, w * 2];
            return undefined;
          };

          if (ls) (active as any)._lineStyle = ls;
          if (hs) (active as any)._headStyle = hs;
          if (options.hasStartHead !== undefined) (active as any)._hasStartHead = options.hasStartHead;

          if (active.type === "group") {
            const children = (active as any).getObjects() as any[];
            for (const child of children) {
              const t = child.type;
              if (t === "line" || t === "polyline" || t === "path") {
                if (color) child.set("stroke", color);
                if (sw !== undefined) child.set("strokeWidth", sw);
                const finalSW = sw !== undefined ? sw : (child.strokeWidth || 2);
                const finalLS = ls || (active as any)._lineStyle || "solid";
                const dash = dashFromStyle(finalLS, finalSW);
                child.set("strokeDashArray", dash || null);
              }
              if (t === "polygon" || t === "triangle") {
                if (hs === "none") {
                  child.set("visible", false);
                } else if (hs === "outline" || hs === "open") {
                  child.set("visible", true);
                  child.set("fill", "transparent");
                  child.set("stroke", color || child.stroke || "#475569");
                  child.set("strokeWidth", sw !== undefined ? sw : 2);
                } else {
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
      clearCenteringTimers();
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
    if (fabricRef.current) {
      centerArtboard(fabricRef.current, width, height);
      scheduleCenteringBurst(fabricRef.current, width, height);
    }
  }, [width, height, centerArtboard, scheduleCenteringBurst]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f0f0",
        backgroundImage:
          "radial-gradient(circle, rgba(0, 0, 0, 0.06) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div
        ref={containerRef}
        style={{
          flexShrink: 0,
          boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
          borderRadius: "2px",
        }}
      />
    </div>
  );
}
