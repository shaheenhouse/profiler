"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Download,
  FileImage,
  FileText,
  FileCode,
  Loader2,
  Check,
} from "lucide-react";
import type { DesignCanvasAPI } from "./design-canvas";
import { toast } from "@/components/ui/use-toast";

interface DesignExportProps {
  open: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<DesignCanvasAPI | null>;
  designName: string;
  canvasWidth: number;
  canvasHeight: number;
}

type ExportFormat = "png" | "jpeg" | "pdf" | "svg";

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileImage;
}[] = [
  { id: "png", label: "PNG", description: "High quality, transparency", icon: FileImage },
  { id: "jpeg", label: "JPG", description: "Smaller file size", icon: FileImage },
  { id: "pdf", label: "PDF", description: "Print-ready document", icon: FileText },
  { id: "svg", label: "SVG", description: "Scalable vector", icon: FileCode },
];

const SIZE_OPTIONS = [
  { label: "1x", multiplier: 1, desc: "Standard" },
  { label: "2x", multiplier: 2, desc: "High quality" },
  { label: "3x", multiplier: 3, desc: "Ultra high" },
  { label: "4x", multiplier: 4, desc: "Maximum" },
];

/**
 * Creates a clean off-screen StaticCanvas from the main canvas JSON.
 * This is completely isolated — the main canvas is NEVER modified.
 */
async function createExportCanvas(
  mainCanvas: ReturnType<DesignCanvasAPI["getCanvas"]>,
  canvasWidth: number,
  canvasHeight: number,
  bgOverride?: string | null,
) {
  const fabric = await import("fabric");

  // Serialize with custom flags so we can remove non-export objects (artboard, helpers).
  const jsonData = (mainCanvas as any).toJSON(["_isArtboard", "excludeFromExport"]);

  let detectedArtboardFill: string | null = null;
  const objects = Array.isArray(jsonData.objects) ? jsonData.objects : [];
  jsonData.objects = objects.filter((obj: any) => {
    if (!obj) return false;

    const isArtboardByFlag = obj._isArtboard === true;
    const isArtboardByShape =
      obj.type === "rect" &&
      obj.left === 0 &&
      obj.top === 0 &&
      obj.width === canvasWidth &&
      obj.height === canvasHeight &&
      obj.selectable === false &&
      obj.evented === false;

    const isArtboard = isArtboardByFlag || isArtboardByShape;
    if (isArtboard) {
      if (typeof obj.fill === "string" && obj.fill) {
        detectedArtboardFill = obj.fill;
      }
      return false;
    }

    // Respect explicit export opt-out.
    return obj.excludeFromExport !== true;
  });

  // Create an off-screen StaticCanvas with the exact design dimensions
  const tempEl = document.createElement("canvas");
  const tempCanvas = new fabric.StaticCanvas(tempEl, {
    width: canvasWidth,
    height: canvasHeight,
  });

  // Use detected artboard fill as export background (unless caller overrides it).
  if (detectedArtboardFill) {
    tempCanvas.backgroundColor = detectedArtboardFill;
  }
  if (bgOverride !== undefined && bgOverride !== null) {
    tempCanvas.backgroundColor = bgOverride;
  }

  // Load the full design into the temp canvas
  await tempCanvas.loadFromJSON(jsonData);

  // Ensure identity viewport (no zoom/pan artifacts)
  tempCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];
  tempCanvas.renderAll();

  return { fabric, tempCanvas };
}

export function DesignExport({
  open,
  onClose,
  canvasRef,
  designName,
  canvasWidth,
  canvasHeight,
}: DesignExportProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(100);
  const [sizeMultiplier, setSizeMultiplier] = useState(1);
  const [transparentBg, setTransparentBg] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate preview using an off-screen canvas (main canvas untouched)
  const generatePreview = useCallback(async () => {
    try {
      const mainCanvas = canvasRef.current?.getCanvas();
      if (!mainCanvas) return;

      const { tempCanvas } = await createExportCanvas(
        mainCanvas,
        canvasWidth,
        canvasHeight,
      );

      // Produce a small preview image for the dialog
      const previewScale = Math.min(1, 400 / Math.max(canvasWidth, canvasHeight));
      const previewEl = tempCanvas.toCanvasElement(previewScale);
      const dataUrl = previewEl.toDataURL("image/png");

      setPreviewUrl(dataUrl);
      tempCanvas.dispose();
    } catch (err) {
      console.error("Preview generation failed:", err);
    }
  }, [canvasRef, canvasWidth, canvasHeight]);

  useEffect(() => {
    if (!open) {
      setExportDone(false);
      setPreviewUrl(null);
      return;
    }
    const timer = setTimeout(generatePreview, 200);
    return () => clearTimeout(timer);
  }, [open, generatePreview]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  };

  const dataURLtoBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(",");
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
    const raw = atob(parts[1]);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportDone(false);

    try {
      const mainCanvas = canvasRef.current?.getCanvas();
      if (!mainCanvas) {
        toast({ title: "Canvas not ready. Please wait and try again.", variant: "destructive" });
        setIsExporting(false);
        return;
      }

      const filename = designName || "design";

      // ─── Determine background override ───
      let bgOverride: string | null = null;
      if (format === "png" && transparentBg) {
        bgOverride = ""; // transparent
      } else if (format === "jpeg") {
        const currentBg = mainCanvas.backgroundColor;
        if (!currentBg || currentBg === "transparent" || currentBg === "") {
          bgOverride = "#ffffff"; // JPEG needs a solid background
        }
      }

      // ─── Create isolated export canvas ───
      const { tempCanvas } = await createExportCanvas(
        mainCanvas,
        canvasWidth,
        canvasHeight,
        bgOverride,
      );

      // ─── SVG EXPORT ───
      if (format === "svg") {
        const svgString = tempCanvas.toSVG();
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        downloadBlob(blob, `${filename}.svg`);
        toast({ title: "Exported as SVG!" });
      }
      // ─── PDF EXPORT ───
      else if (format === "pdf") {
        const pngDataUrl = tempCanvas.toDataURL({
          format: "png",
          quality: 1,
          multiplier: sizeMultiplier,
        } as any);

        const { jsPDF } = await import("jspdf");
        const w = canvasWidth * sizeMultiplier;
        const h = canvasHeight * sizeMultiplier;
        const pdf = new jsPDF({
          orientation: w > h ? "landscape" : "portrait",
          unit: "px",
          format: [w, h],
          hotfixes: ["px_scaling"],
        });
        pdf.addImage(pngDataUrl, "PNG", 0, 0, w, h);
        pdf.save(`${filename}.pdf`);
        toast({ title: "Exported as PDF!" });
      }
      // ─── PNG / JPEG EXPORT ───
      else {
        const dataUrl = tempCanvas.toDataURL({
          format: format,
          quality: quality / 100,
          multiplier: sizeMultiplier,
        } as any);

        const blob = dataURLtoBlob(dataUrl);
        downloadBlob(blob, `${filename}.${format === "jpeg" ? "jpg" : "png"}`);
        toast({ title: `Exported as ${format.toUpperCase()}!` });
      }

      tempCanvas.dispose();

      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (err) {
      console.error("Export failed:", err);
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportWidth = canvasWidth * sizeMultiplier;
  const exportHeight = canvasHeight * sizeMultiplier;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Design</DialogTitle>
          <DialogDescription>
            Choose a format and settings, then click download.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Preview */}
          <div className="flex justify-center">
            <div
              className="border rounded-lg overflow-hidden"
              style={{
                maxWidth: 300,
                maxHeight: 200,
                background: transparentBg && format === "png"
                  ? "repeating-conic-gradient(#e5e5e5 0% 25%, white 0% 50%) 50% / 16px 16px"
                  : "#f5f5f5",
              }}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Export preview"
                  className="w-full h-full object-contain"
                  style={{ maxWidth: 300, maxHeight: 200 }}
                />
              ) : (
                <div className="w-48 h-32 flex items-center justify-center text-muted-foreground text-sm">
                  Loading preview...
                </div>
              )}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">File type</Label>
            <div className="grid grid-cols-4 gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFormat(opt.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                    format === opt.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <opt.icon className={`w-5 h-5 ${format === opt.id ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-semibold ${format === opt.id ? "text-primary" : ""}`}>
                    {opt.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground leading-tight text-center">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Multiplier */}
          {format !== "svg" && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Size
                <span className="text-muted-foreground font-normal ml-2 text-xs">
                  {exportWidth} x {exportHeight} px
                </span>
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setSizeMultiplier(opt.multiplier)}
                    className={`p-2 rounded-lg border-2 text-center transition-all ${
                      sizeMultiplier === opt.multiplier
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className={`text-sm font-semibold block ${sizeMultiplier === opt.multiplier ? "text-primary" : ""}`}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quality Slider */}
          {(format === "png" || format === "jpeg") && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Quality</Label>
                <span className="text-sm text-muted-foreground font-mono">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={([v]) => setQuality(v)}
                min={10}
                max={100}
                step={5}
              />
            </div>
          )}

          {/* Transparent Background */}
          {format === "png" && (
            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-sm font-medium">Transparent background</Label>
                <p className="text-xs text-muted-foreground">Remove the background color</p>
              </div>
              <Switch checked={transparentBg} onCheckedChange={setTransparentBg} />
            </div>
          )}

          {/* Download Button */}
          <Button
            className="w-full h-12 text-base gap-2"
            size="lg"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exporting...
              </>
            ) : exportDone ? (
              <>
                <Check className="w-5 h-5" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download {format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
