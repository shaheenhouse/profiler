"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Copy,
  Trash2,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  RotateCcw,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  Sun,
  Contrast,
  Droplets,
  Palette,
  Eye,
  Sparkles,
  RotateCw,
  Eraser,
  ImageIcon,
} from "lucide-react";
import type { Object as FabricObject } from "fabric";
import type { DesignCanvasAPI } from "./design-canvas";

interface DesignPropertiesProps {
  selectedObject: FabricObject | null;
  canvasRef: React.RefObject<DesignCanvasAPI | null>;
}

const FONTS = [
  "Arial", "Helvetica", "Times New Roman", "Georgia", "Verdana",
  "Courier New", "Impact", "Comic Sans MS", "Trebuchet MS", "Palatino",
  "Garamond", "Bookman", "Tahoma", "Lucida Console", "Inter",
  "Roboto", "Open Sans", "Montserrat", "Playfair Display", "Lato",
  "Oswald", "Poppins", "Raleway", "Nunito", "Ubuntu",
];

const PRESET_COLORS = [
  "#000000", "#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF",
  "#FF0000", "#E91E63", "#9C27B0", "#6366F1", "#3B82F6", "#06B6D4",
  "#10B981", "#22C55E", "#EAB308", "#F59E0B", "#F97316", "#FF5722",
];

export function DesignProperties({ selectedObject, canvasRef }: DesignPropertiesProps) {
  const [props, setProps] = useState({
    fill: "#000000",
    stroke: "",
    strokeWidth: 0,
    opacity: 100,
    fontSize: 36,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textAlign: "left",
    underline: false,
    linethrough: false,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    rx: 0,
    ry: 0,
    hasShadow: false,
    shadowColor: "rgba(0,0,0,0.3)",
    shadowBlur: 10,
    shadowOffsetX: 5,
    shadowOffsetY: 5,
  });

  const isText = selectedObject?.type === "i-text" || selectedObject?.type === "text" || selectedObject?.type === "textbox";
  const isRect = selectedObject?.type === "rect";
  const isImage = selectedObject?.type === "image";
  const isConnector = !!(selectedObject as any)?._isConnector;

  // Connector style state
  const [connectorStyle, setConnectorStyle] = useState({
    color: "#475569",
    strokeWidth: 2.5,
    lineStyle: "solid" as "solid" | "dashed" | "dotted",
    headStyle: "filled" as "filled" | "outline" | "open" | "diamond" | "circle" | "none",
    hasStartHead: false,
  });

  // Image filter state
  const [imageFilters, setImageFilters] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hueRotation: 0,
    blur: 0,
    noise: 0,
    pixelate: 1,
    vibrance: 0,
    gamma: 1,
    grayscale: 0,
    sepia: 0,
    invert: 0,
  });

  const updateProps = useCallback(() => {
    if (!selectedObject) return;
    const shadow = (selectedObject as any).shadow;

    // For groups / multi-selection / SVG icons, read fill from the first
    // visible leaf child, recursing into nested groups.
    let effectiveFill = (selectedObject.fill as string) || "#000000";
    const findLeafFill = (obj: any): string | null => {
      const kids = obj.getObjects ? obj.getObjects() : [];
      for (const child of kids) {
        if (child.type === "group" || (child.getObjects && child.getObjects().length > 0)) {
          const f = findLeafFill(child);
          if (f) return f;
        } else if (child.fill && child.fill !== "none" && child.fill !== "") {
          return child.fill;
        }
      }
      return null;
    };
    if (selectedObject.type === "group" || selectedObject.type === "activeselection" || selectedObject.type === "activeSelection") {
      effectiveFill = findLeafFill(selectedObject) || effectiveFill;
    }

    let effectiveStroke = (selectedObject.stroke as string) || "";
    if (selectedObject.type === "group" || selectedObject.type === "activeselection" || selectedObject.type === "activeSelection") {
      const findLeafStroke = (obj: any): string | null => {
        const kids = obj.getObjects ? obj.getObjects() : [];
        for (const child of kids) {
          if (child.type === "group" || (child.getObjects && child.getObjects().length > 0)) {
            const s = findLeafStroke(child);
            if (s) return s;
          } else if (child.stroke && child.stroke !== "none") {
            return child.stroke;
          }
        }
        return null;
      };
      effectiveStroke = findLeafStroke(selectedObject) || effectiveStroke;
    }

    setProps({
      fill: effectiveFill,
      stroke: effectiveStroke,
      strokeWidth: selectedObject.strokeWidth || 0,
      opacity: Math.round((selectedObject.opacity || 1) * 100),
      fontSize: (selectedObject as any).fontSize || 36,
      fontFamily: (selectedObject as any).fontFamily || "Arial",
      fontWeight: (selectedObject as any).fontWeight || "normal",
      fontStyle: (selectedObject as any).fontStyle || "normal",
      textAlign: (selectedObject as any).textAlign || "left",
      underline: (selectedObject as any).underline || false,
      linethrough: (selectedObject as any).linethrough || false,
      left: Math.round(selectedObject.left || 0),
      top: Math.round(selectedObject.top || 0),
      width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
      height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
      angle: Math.round(selectedObject.angle || 0),
      scaleX: selectedObject.scaleX || 1,
      scaleY: selectedObject.scaleY || 1,
      locked: selectedObject.lockMovementX || false,
      rx: (selectedObject as any).rx || 0,
      ry: (selectedObject as any).ry || 0,
      hasShadow: !!shadow,
      shadowColor: shadow?.color || "rgba(0,0,0,0.3)",
      shadowBlur: shadow?.blur || 10,
      shadowOffsetX: shadow?.offsetX || 5,
      shadowOffsetY: shadow?.offsetY || 5,
    });
  }, [selectedObject]);

  useEffect(() => {
    updateProps();
    // Load connector style if connector is selected
    if ((selectedObject as any)?._isConnector) {
      const cs = canvasRef.current?.getConnectorStyle();
      if (cs) setConnectorStyle(cs);
    }
    // Load image filters if image is selected
    if (selectedObject?.type === "image") {
      const filters = canvasRef.current?.getImageFilters();
      if (filters) {
        setImageFilters({
          brightness: filters.brightness || 0,
          contrast: filters.contrast || 0,
          saturation: filters.saturation || 0,
          hueRotation: filters.hueRotation || 0,
          blur: filters.blur || 0,
          noise: filters.noise || 0,
          pixelate: filters.pixelate || 1,
          vibrance: filters.vibrance || 0,
          gamma: filters.gamma || 1,
          grayscale: filters.grayscale || 0,
          sepia: filters.sepia || 0,
          invert: filters.invert || 0,
        });
      }
    }
  }, [selectedObject, updateProps, canvasRef]);

  const applyProp = (key: string, value: unknown) => {
    if (!selectedObject) return;

    const isColorKey = key === "fill" || key === "stroke";
    const isMulti = selectedObject.type === "activeselection" || selectedObject.type === "activeSelection";
    const isGroup = selectedObject.type === "group";

    // Recursively apply fill or stroke to every leaf object inside
    // groups and nested SVG structures.
    const setColorDeep = (obj: any, k: string, v: unknown) => {
      const kids = obj.getObjects ? obj.getObjects() : [];
      if (kids.length > 0) {
        for (const child of kids) {
          setColorDeep(child, k, v);
        }
        obj.dirty = true;
      } else {
        // Leaf object – apply fill or stroke
        if (k === "fill") {
          const cur = obj.fill;
          if (cur !== "none") {
            obj.set("fill", v);
          }
        } else if (k === "stroke") {
          obj.set("stroke", v);
        }
        obj.dirty = true;
      }
    };

    // Helper to apply a property recursively to every leaf in a tree
    const setPropDeep = (obj: any, k: string, v: unknown) => {
      const kids = obj.getObjects ? obj.getObjects() : [];
      if (kids.length > 0) {
        for (const child of kids) setPropDeep(child, k, v);
        obj.dirty = true;
      } else {
        obj.set(k, v);
        obj.dirty = true;
      }
    };

    if (isColorKey && (isGroup || isMulti)) {
      const items = (selectedObject as any).getObjects ? (selectedObject as any).getObjects() : [];
      for (const item of items) {
        setColorDeep(item, key, value);
      }
      (selectedObject as any).dirty = true;
    } else if (isColorKey && selectedObject.type === "path") {
      if (key === "fill") {
        const cur = (selectedObject as any).fill;
        if (cur !== "none") selectedObject.set("fill" as any, value as any);
      } else {
        selectedObject.set("stroke" as any, value as any);
      }
    } else if (key === "strokeWidth" && (isGroup || isMulti)) {
      setPropDeep(selectedObject, key, value);
    } else {
      selectedObject.set(key as keyof FabricObject, value as any);
    }

    const canvas = canvasRef.current?.getCanvas();
    canvas?.renderAll();
    updateProps();
  };

  const applyShadow = async (updates: Record<string, unknown>) => {
    if (!selectedObject) return;
    const fb = await import("fabric");
    const current = (selectedObject as any).shadow;
    const shadowOpts = {
      color: updates.color ?? (current?.color || "rgba(0,0,0,0.3)"),
      blur: updates.blur ?? (current?.blur || 10),
      offsetX: updates.offsetX ?? (current?.offsetX || 5),
      offsetY: updates.offsetY ?? (current?.offsetY || 5),
    };
    selectedObject.set("shadow" as any, new fb.Shadow(shadowOpts as any));
    const canvas = canvasRef.current?.getCanvas();
    canvas?.renderAll();
    updateProps();
  };

  const removeShadow = () => {
    if (!selectedObject) return;
    selectedObject.set("shadow" as any, null);
    const canvas = canvasRef.current?.getCanvas();
    canvas?.renderAll();
    updateProps();
  };

  const toggleLock = () => {
    if (!selectedObject) return;
    const lock = !props.locked;
    selectedObject.set({
      lockMovementX: lock, lockMovementY: lock,
      lockScalingX: lock, lockScalingY: lock,
      lockRotation: lock, hasControls: !lock, selectable: true,
    } as any);
    const canvas = canvasRef.current?.getCanvas();
    canvas?.renderAll();
    setProps((p) => ({ ...p, locked: lock }));
  };

  if (!selectedObject) {
    return (
      <div className="w-72 bg-background border-l p-6 flex flex-col items-center justify-center text-center h-full">
        <div className="text-muted-foreground space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" /><path d="M14 14h7v7h-7z" /><path d="M3 14h7v7H3z" />
            </svg>
          </div>
          <p className="font-medium text-sm">No object selected</p>
          <p className="text-xs leading-relaxed">
            Click on an element on the canvas to edit its properties, or use the toolbar to add new elements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-background border-l overflow-hidden h-full">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {/* ── Quick Actions ── */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm capitalize">
              {selectedObject.type === "i-text" ? "Text" : selectedObject.type}
            </h3>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => canvasRef.current?.duplicate()} title="Duplicate">
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="w-7 h-7" onClick={toggleLock} title={props.locked ? "Unlock" : "Lock"}>
                {props.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </Button>
              <Button
                size="icon" variant="ghost"
                className="w-7 h-7 text-destructive hover:text-destructive"
                onClick={() => canvasRef.current?.deleteSelected()}
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* ── Alignment to Canvas ── */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Align to Canvas</h4>
            <div className="flex gap-1">
              {[
                { type: "left" as const, icon: AlignStartVertical, label: "Left" },
                { type: "center-h" as const, icon: AlignCenterVertical, label: "Center H" },
                { type: "right" as const, icon: AlignEndVertical, label: "Right" },
                { type: "top" as const, icon: AlignStartHorizontal, label: "Top" },
                { type: "center-v" as const, icon: AlignCenterHorizontal, label: "Center V" },
                { type: "bottom" as const, icon: AlignEndHorizontal, label: "Bottom" },
              ].map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  size="icon"
                  variant="outline"
                  className="w-9 h-8"
                  onClick={() => canvasRef.current?.alignToCanvas(type)}
                  title={`Align ${label}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* ── Position & Size ── */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Position & Size</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input type="number" value={props.left} onChange={(e) => applyProp("left", parseInt(e.target.value) || 0)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input type="number" value={props.top} onChange={(e) => applyProp("top", parseInt(e.target.value) || 0)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">W</Label>
                <Input type="number" value={props.width} onChange={(e) => { const w = parseInt(e.target.value) || 1; applyProp("scaleX", w / (selectedObject.width || 1)); }} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">H</Label>
                <Input type="number" value={props.height} onChange={(e) => { const h = parseInt(e.target.value) || 1; applyProp("scaleY", h / (selectedObject.height || 1)); }} className="h-8 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Rotation</Label>
                <div className="flex gap-1">
                  <Input type="number" value={props.angle} onChange={(e) => applyProp("angle", parseInt(e.target.value) || 0)} className="h-8 text-xs flex-1" />
                  <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => applyProp("angle", 0)} title="Reset rotation">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-end gap-1">
                <Button size="icon" variant="outline" className="w-8 h-8" onClick={() => applyProp("flipX", !selectedObject.flipX)} title="Flip Horizontal">
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="outline" className="w-8 h-8" onClick={() => applyProp("flipY", !selectedObject.flipY)} title="Flip Vertical">
                  <FlipVertical className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Appearance ── */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Appearance</h4>
            {selectedObject.type !== "line" && selectedObject.type !== "image" && (
              <div>
                <Label className="text-xs">Fill Color</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${props.fill === color ? "ring-2 ring-primary ring-offset-1" : "border-gray-200 dark:border-gray-700"}`}
                      style={{ backgroundColor: color }}
                      onClick={() => { setProps((p) => ({ ...p, fill: color })); applyProp("fill", color); }}
                    />
                  ))}
                </div>
                <div className="flex gap-2 mt-1.5">
                  <input type="color" value={typeof props.fill === "string" ? props.fill : "#000000"} onChange={(e) => { setProps((p) => ({ ...p, fill: e.target.value })); applyProp("fill", e.target.value); }} className="w-8 h-8 rounded cursor-pointer border-0" />
                  <Input value={props.fill} onChange={(e) => { setProps((p) => ({ ...p, fill: e.target.value })); applyProp("fill", e.target.value); }} className="h-8 text-xs uppercase flex-1" />
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs">Stroke</Label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={props.stroke || "#000000"} onChange={(e) => { setProps((p) => ({ ...p, stroke: e.target.value })); applyProp("stroke", e.target.value); }} className="w-8 h-8 rounded cursor-pointer border-0" />
                <Input type="number" min="0" max="20" value={props.strokeWidth} onChange={(e) => { const w = parseInt(e.target.value) || 0; setProps((p) => ({ ...p, strokeWidth: w })); applyProp("strokeWidth", w); }} className="h-8 text-xs w-16" placeholder="Width" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Opacity: {props.opacity}%</Label>
              <Slider value={[props.opacity]} onValueChange={([val]) => { setProps((p) => ({ ...p, opacity: val })); applyProp("opacity", val / 100); }} min={0} max={100} step={1} className="mt-1" />
            </div>
          </div>

          {/* ── Corner Radius (Rect only) ── */}
          {isRect && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Corner Radius</h4>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[props.rx]}
                    onValueChange={([val]) => {
                      setProps((p) => ({ ...p, rx: val, ry: val }));
                      applyProp("rx", val);
                      applyProp("ry", val);
                    }}
                    min={0}
                    max={Math.min((selectedObject.width || 100) / 2, (selectedObject.height || 100) / 2)}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={props.rx}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      setProps((p) => ({ ...p, rx: v, ry: v }));
                      applyProp("rx", v);
                      applyProp("ry", v);
                    }}
                    className="h-8 text-xs w-16"
                    min={0}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Shadow ── */}
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Drop Shadow</h4>
              <Switch
                checked={props.hasShadow}
                onCheckedChange={(checked) => {
                  if (checked) {
                    applyShadow({ color: "rgba(0,0,0,0.3)", blur: 10, offsetX: 5, offsetY: 5 });
                  } else {
                    removeShadow();
                  }
                }}
              />
            </div>
            {props.hasShadow && (
              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Color</Label>
                    <div className="flex gap-1 mt-0.5">
                      <input type="color" value={props.shadowColor.startsWith("rgba") ? "#000000" : props.shadowColor} onChange={(e) => { setProps((p) => ({ ...p, shadowColor: e.target.value })); applyShadow({ color: e.target.value }); }} className="w-8 h-8 rounded cursor-pointer border-0" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Blur: {props.shadowBlur}</Label>
                    <Slider value={[props.shadowBlur]} onValueChange={([v]) => { setProps((p) => ({ ...p, shadowBlur: v })); applyShadow({ blur: v }); }} min={0} max={50} step={1} className="mt-1.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Offset X</Label>
                    <Input type="number" value={props.shadowOffsetX} onChange={(e) => { const v = parseInt(e.target.value) || 0; setProps((p) => ({ ...p, shadowOffsetX: v })); applyShadow({ offsetX: v }); }} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Offset Y</Label>
                    <Input type="number" value={props.shadowOffsetY} onChange={(e) => { const v = parseInt(e.target.value) || 0; setProps((p) => ({ ...p, shadowOffsetY: v })); applyShadow({ offsetY: v }); }} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Connector / Arrow Properties ── */}
          {isConnector && (
            <>
              <Separator />
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-2.5 mb-1">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Arrow / Connector Properties</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Customize this arrow&apos;s appearance below.</p>
              </div>
              <div className="space-y-3">
                {/* Arrow Color */}
                <div>
                  <Label className="text-xs">Arrow Color</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {["#475569", "#000000", "#333333", "#FF0000", "#E91E63", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#6366F1", "#ffffff"].map((c) => (
                      <button
                        key={c}
                        className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${connectorStyle.color === c ? "ring-2 ring-primary ring-offset-1" : "border-gray-200 dark:border-gray-700"}`}
                        style={{ backgroundColor: c }}
                        onClick={() => {
                          setConnectorStyle(s => ({ ...s, color: c }));
                          canvasRef.current?.updateConnectorStyle({ color: c });
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <input
                      type="color"
                      value={connectorStyle.color}
                      onChange={(e) => {
                        setConnectorStyle(s => ({ ...s, color: e.target.value }));
                        canvasRef.current?.updateConnectorStyle({ color: e.target.value });
                      }}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={connectorStyle.color}
                      onChange={(e) => {
                        setConnectorStyle(s => ({ ...s, color: e.target.value }));
                        canvasRef.current?.updateConnectorStyle({ color: e.target.value });
                      }}
                      className="h-8 text-xs uppercase flex-1"
                    />
                  </div>
                </div>

                {/* Line Thickness */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Line Thickness</Label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{connectorStyle.strokeWidth.toFixed(1)}px</span>
                  </div>
                  <Slider
                    value={[connectorStyle.strokeWidth]}
                    onValueChange={([val]) => {
                      setConnectorStyle(s => ({ ...s, strokeWidth: val }));
                      canvasRef.current?.updateConnectorStyle({ strokeWidth: val });
                    }}
                    min={0.5} max={12} step={0.5} className="mt-1"
                  />
                </div>

                {/* Line Style */}
                <div>
                  <Label className="text-xs">Line Style</Label>
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {([
                      { id: "solid", label: "Solid", preview: "border-b-2 border-current" },
                      { id: "dashed", label: "Dashed", preview: "border-b-2 border-dashed border-current" },
                      { id: "dotted", label: "Dotted", preview: "border-b-2 border-dotted border-current" },
                    ] as const).map((style) => (
                      <Button
                        key={style.id}
                        size="sm"
                        variant={connectorStyle.lineStyle === style.id ? "default" : "outline"}
                        className="h-10 flex flex-col gap-1 text-[10px]"
                        onClick={() => {
                          setConnectorStyle(s => ({ ...s, lineStyle: style.id }));
                          canvasRef.current?.updateConnectorStyle({ lineStyle: style.id });
                        }}
                      >
                        <div className={`w-full ${style.preview}`} />
                        {style.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Arrowhead Style */}
                <div>
                  <Label className="text-xs">Arrowhead Style</Label>
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {([
                      { id: "filled", label: "Filled", svg: '<svg viewBox="0 0 24 12" class="w-5 h-3"><polygon points="0,0 24,6 0,12" fill="currentColor"/></svg>' },
                      { id: "outline", label: "Outline", svg: '<svg viewBox="0 0 24 12" class="w-5 h-3"><polygon points="0,0 24,6 0,12" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
                      { id: "open", label: "Open V", svg: '<svg viewBox="0 0 24 12" class="w-5 h-3"><polyline points="0,0 24,6 0,12" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
                      { id: "diamond", label: "Diamond", svg: '<svg viewBox="0 0 24 12" class="w-5 h-3"><polygon points="0,6 12,0 24,6 12,12" fill="currentColor"/></svg>' },
                      { id: "circle", label: "Circle", svg: '<svg viewBox="0 0 24 12" class="w-5 h-3"><circle cx="12" cy="6" r="5" fill="currentColor"/></svg>' },
                      { id: "none", label: "None", svg: '<svg viewBox="0 0 24 12" class="w-5 h-3"><line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" stroke-width="2"/></svg>' },
                    ] as const).map((style) => (
                      <Button
                        key={style.id}
                        size="sm"
                        variant={connectorStyle.headStyle === style.id ? "default" : "outline"}
                        className="h-10 flex flex-col gap-0.5 text-[10px]"
                        onClick={() => {
                          setConnectorStyle(s => ({ ...s, headStyle: style.id }));
                          canvasRef.current?.updateConnectorStyle({ headStyle: style.id });
                        }}
                      >
                        <div dangerouslySetInnerHTML={{ __html: style.svg }} />
                        {style.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Image Editing (Canva-style) ── */}
          {isImage && (
            <>
              <Separator />
              <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-2.5 mb-2">
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Edit Image
                </p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Adjust brightness, contrast, colors &amp; apply filter presets below.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Adjust</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] px-2"
                    onClick={() => {
                      canvasRef.current?.removeImageFilters();
                      setImageFilters({
                        brightness: 0, contrast: 0, saturation: 0,
                        hueRotation: 0, blur: 0, noise: 0,
                        pixelate: 1, vibrance: 0, gamma: 1,
                        grayscale: 0, sepia: 0, invert: 0,
                      });
                    }}
                  >
                    <Eraser className="w-3 h-3 mr-1" />
                    Reset All
                  </Button>
                </div>

                {/* Brightness */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1.5">
                      <Sun className="w-3 h-3" /> Brightness
                    </Label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(imageFilters.brightness * 100)}%</span>
                  </div>
                  <Slider
                    value={[imageFilters.brightness]}
                    onValueChange={([val]) => {
                      setImageFilters(f => ({ ...f, brightness: val }));
                      canvasRef.current?.applyImageFilter("brightness", val);
                    }}
                    min={-1} max={1} step={0.01} className="mt-1"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1.5">
                      <Contrast className="w-3 h-3" /> Contrast
                    </Label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(imageFilters.contrast * 100)}%</span>
                  </div>
                  <Slider
                    value={[imageFilters.contrast]}
                    onValueChange={([val]) => {
                      setImageFilters(f => ({ ...f, contrast: val }));
                      canvasRef.current?.applyImageFilter("contrast", val);
                    }}
                    min={-1} max={1} step={0.01} className="mt-1"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1.5">
                      <Droplets className="w-3 h-3" /> Saturation
                    </Label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(imageFilters.saturation * 100)}%</span>
                  </div>
                  <Slider
                    value={[imageFilters.saturation]}
                    onValueChange={([val]) => {
                      setImageFilters(f => ({ ...f, saturation: val }));
                      canvasRef.current?.applyImageFilter("saturation", val);
                    }}
                    min={-1} max={1} step={0.01} className="mt-1"
                  />
                </div>

                {/* Vibrance */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Vibrance
                    </Label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(imageFilters.vibrance * 100)}%</span>
                  </div>
                  <Slider
                    value={[imageFilters.vibrance]}
                    onValueChange={([val]) => {
                      setImageFilters(f => ({ ...f, vibrance: val }));
                      canvasRef.current?.applyImageFilter("vibrance", val);
                    }}
                    min={-1} max={1} step={0.01} className="mt-1"
                  />
                </div>

                {/* Hue Rotation */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1.5">
                      <Palette className="w-3 h-3" /> Hue Shift
                    </Label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(imageFilters.hueRotation * 180)}°</span>
                  </div>
                  <Slider
                    value={[imageFilters.hueRotation]}
                    onValueChange={([val]) => {
                      setImageFilters(f => ({ ...f, hueRotation: val }));
                      canvasRef.current?.applyImageFilter("hueRotation", val);
                    }}
                    min={-1} max={1} step={0.01} className="mt-1"
                  />
                </div>

                {/* Gamma */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1.5">
                      <RotateCw className="w-3 h-3" /> Gamma
                    </Label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{imageFilters.gamma.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[imageFilters.gamma]}
                    onValueChange={([val]) => {
                      setImageFilters(f => ({ ...f, gamma: val }));
                      canvasRef.current?.applyImageFilter("gamma", val);
                    }}
                    min={0.2} max={2.5} step={0.01} className="mt-1"
                  />
                </div>

                <Separator />

                {/* Blur */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1.5">
                      <Eye className="w-3 h-3" /> Blur
                    </Label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{(imageFilters.blur * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[imageFilters.blur]}
                    onValueChange={([val]) => {
                      setImageFilters(f => ({ ...f, blur: val }));
                      canvasRef.current?.applyImageFilter("blur", val);
                    }}
                    min={0} max={1} step={0.01} className="mt-1"
                  />
                </div>

                {/* Noise */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Noise</Label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(imageFilters.noise)}</span>
                  </div>
                  <Slider
                    value={[imageFilters.noise]}
                    onValueChange={([val]) => {
                      setImageFilters(f => ({ ...f, noise: val }));
                      canvasRef.current?.applyImageFilter("noise", val);
                    }}
                    min={0} max={600} step={1} className="mt-1"
                  />
                </div>

                {/* Pixelate */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Pixelate</Label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(imageFilters.pixelate)}px</span>
                  </div>
                  <Slider
                    value={[imageFilters.pixelate]}
                    onValueChange={([val]) => {
                      setImageFilters(f => ({ ...f, pixelate: val }));
                      canvasRef.current?.applyImageFilter("pixelate", val);
                    }}
                    min={1} max={40} step={1} className="mt-1"
                  />
                </div>

                <Separator />

                {/* Boolean Filters */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Presets</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      size="sm"
                      variant={imageFilters.grayscale ? "default" : "outline"}
                      className="text-[10px] h-8"
                      onClick={() => {
                        const val = imageFilters.grayscale ? 0 : 1;
                        setImageFilters(f => ({ ...f, grayscale: val }));
                        canvasRef.current?.applyImageFilter("grayscale", val);
                      }}
                    >
                      Grayscale
                    </Button>
                    <Button
                      size="sm"
                      variant={imageFilters.sepia ? "default" : "outline"}
                      className="text-[10px] h-8"
                      onClick={() => {
                        const val = imageFilters.sepia ? 0 : 1;
                        setImageFilters(f => ({ ...f, sepia: val }));
                        canvasRef.current?.applyImageFilter("sepia", val);
                      }}
                    >
                      Sepia
                    </Button>
                    <Button
                      size="sm"
                      variant={imageFilters.invert ? "default" : "outline"}
                      className="text-[10px] h-8"
                      onClick={() => {
                        const val = imageFilters.invert ? 0 : 1;
                        setImageFilters(f => ({ ...f, invert: val }));
                        canvasRef.current?.applyImageFilter("invert", val);
                      }}
                    >
                      Invert
                    </Button>
                  </div>
                </div>

                {/* Canva-Style Filter Presets */}
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Filter Presets</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { name: "None", filters: {} },
                      { name: "Vivid", filters: { brightness: 0.05, contrast: 0.2, saturation: 0.35, vibrance: 0.3 } },
                      { name: "Warm", filters: { brightness: 0.05, saturation: 0.15, hueRotation: 0.05, gamma: 1.15 } },
                      { name: "Cool", filters: { saturation: -0.1, hueRotation: -0.12, contrast: 0.12, brightness: 0.02 } },
                      { name: "Dramatic", filters: { brightness: -0.1, contrast: 0.45, saturation: -0.2, vibrance: 0.25 } },
                      { name: "Faded", filters: { brightness: 0.1, contrast: -0.2, saturation: -0.35, gamma: 1.1 } },
                      { name: "Cinematic", filters: { contrast: 0.3, saturation: -0.15, brightness: -0.05, hueRotation: 0.02 } },
                      { name: "Fresco", filters: { brightness: 0.08, contrast: 0.15, saturation: 0.25, hueRotation: -0.03, vibrance: 0.2 } },
                      { name: "Belvedere", filters: { brightness: 0.05, contrast: 0.25, saturation: 0.2, gamma: 1.08 } },
                      { name: "Nordic", filters: { brightness: 0.1, contrast: 0.1, saturation: -0.4, hueRotation: -0.08 } },
                      { name: "Vintage", filters: { sepia: 1, contrast: 0.1, brightness: 0.05 } },
                      { name: "B&W Sharp", filters: { grayscale: 1, contrast: 0.35, brightness: 0.05 } },
                      { name: "Film Noir", filters: { grayscale: 1, contrast: 0.5, brightness: -0.1 } },
                      { name: "Sunset", filters: { brightness: 0.08, saturation: 0.3, hueRotation: 0.08, gamma: 1.12, vibrance: 0.2 } },
                      { name: "Neon", filters: { contrast: 0.35, saturation: 0.5, vibrance: 0.4, brightness: 0.05 } },
                    ].map((preset) => (
                      <Button
                        key={preset.name}
                        size="sm"
                        variant="outline"
                        className="text-[10px] h-8 px-1"
                        onClick={() => {
                          const defaults = {
                            brightness: 0, contrast: 0, saturation: 0,
                            hueRotation: 0, blur: 0, noise: 0,
                            pixelate: 1, vibrance: 0, gamma: 1,
                            grayscale: 0, sepia: 0, invert: 0,
                          };
                          const newFilters = { ...defaults, ...preset.filters };
                          setImageFilters(newFilters);
                          canvasRef.current?.removeImageFilters();
                          Object.entries(preset.filters).forEach(([key, val]) => {
                            canvasRef.current?.applyImageFilter(key, val);
                          });
                        }}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Text Properties ── */}
          {isText && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Text</h4>

                <div>
                  <Label className="text-xs">Font Family</Label>
                  <Select value={props.fontFamily} onValueChange={(val) => { setProps((p) => ({ ...p, fontFamily: val })); applyProp("fontFamily", val); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONTS.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Font Size</Label>
                  <Input type="number" value={props.fontSize} onChange={(e) => { const size = parseInt(e.target.value) || 12; setProps((p) => ({ ...p, fontSize: size })); applyProp("fontSize", size); }} className="h-8 text-xs" min={8} max={400} />
                </div>

                {/* Style Buttons */}
                <div className="flex gap-1">
                  <Button size="icon" variant={props.fontWeight === "bold" ? "default" : "outline"} className="w-8 h-8" onClick={() => { const val = props.fontWeight === "bold" ? "normal" : "bold"; setProps((p) => ({ ...p, fontWeight: val })); applyProp("fontWeight", val); }}>
                    <Bold className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant={props.fontStyle === "italic" ? "default" : "outline"} className="w-8 h-8" onClick={() => { const val = props.fontStyle === "italic" ? "normal" : "italic"; setProps((p) => ({ ...p, fontStyle: val })); applyProp("fontStyle", val); }}>
                    <Italic className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant={props.underline ? "default" : "outline"} className="w-8 h-8" onClick={() => { setProps((p) => ({ ...p, underline: !p.underline })); applyProp("underline", !props.underline); }}>
                    <Underline className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant={props.linethrough ? "default" : "outline"} className="w-8 h-8" onClick={() => { setProps((p) => ({ ...p, linethrough: !p.linethrough })); applyProp("linethrough", !props.linethrough); }}>
                    <Strikethrough className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Text Alignment */}
                <div className="flex gap-1">
                  {[
                    { align: "left", icon: AlignLeft },
                    { align: "center", icon: AlignCenter },
                    { align: "right", icon: AlignRight },
                    { align: "justify", icon: AlignJustify },
                  ].map(({ align, icon: Icon }) => (
                    <Button key={align} size="icon" variant={props.textAlign === align ? "default" : "outline"} className="w-8 h-8" onClick={() => { setProps((p) => ({ ...p, textAlign: align })); applyProp("textAlign", align); }}>
                      <Icon className="w-3.5 h-3.5" />
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Bottom spacing */}
          <div className="h-4" />
        </div>
      </ScrollArea>
    </div>
  );
}
