"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Triangle,
  Minus,
  Star,
  Hexagon,
  ArrowRight,
  Pencil,
  Image as ImageIcon,
  Upload,
  Palette,
  Layers,
  LayoutTemplate,
  Heading1,
  Heading2,
  AlignLeft,
  ArrowUpToLine,
  ArrowDownToLine,
  MoveUp,
  MoveDown,
  Trash2,
  Copy,
  PaintBucket,
  Sparkles,
  Search,
  Loader2,
  Group,
  Ungroup,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  GripVertical,
  Diamond,
  Database,
  FileText,
  Cloud,
  CornerDownRight,
  ArrowRightLeft,
  MoveRight,
  Workflow,
  GitBranch,
  Cable,
  Wand2,
  ImagePlus,
  Send,
  X,
  WandSparkles,
} from "lucide-react";
import type { DesignCanvasAPI } from "./design-canvas";
import { DESIGN_SIZES, type ToolType } from "@/types/design";

interface DesignToolbarProps {
  canvasRef: React.RefObject<DesignCanvasAPI | null>;
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onOpenTemplates: () => void;
  designWidth?: number;
  designHeight?: number;
  onMagicResize?: (width: number, height: number) => void;
}

const PRESET_COLORS = [
  "#000000", "#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF",
  "#FF0000", "#FF4444", "#FF6B6B", "#E91E63", "#EC4899", "#F472B6",
  "#9C27B0", "#8B5CF6", "#7C3AED", "#6366F1", "#4F46E5", "#3B82F6",
  "#2196F3", "#03A9F4", "#06B6D4", "#0891B2", "#14B8A6", "#10B981",
  "#22C55E", "#4CAF50", "#84CC16", "#EAB308", "#F59E0B", "#F97316",
  "#FF9800", "#FF5722", "#795548", "#607D8B",
];

const BG_GRADIENT_PRESETS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
];

// ──── Curated SVG Icons ────
const CURATED_ICONS = [
  // Arrows
  { name: "Arrow Right", cat: "Arrows", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' },
  { name: "Arrow Left", cat: "Arrows", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>' },
  { name: "Arrow Up", cat: "Arrows", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>' },
  { name: "Arrow Down", cat: "Arrows", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>' },
  { name: "Chevron Right", cat: "Arrows", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' },
  { name: "Chevron Down", cat: "Arrows", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' },
  { name: "Curved Arrow", cat: "Arrows", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>' },
  // Social
  { name: "Heart", cat: "Social", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>' },
  { name: "Heart Filled", cat: "Social", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>' },
  { name: "Thumbs Up", cat: "Social", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>' },
  { name: "Star", cat: "Social", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
  { name: "Star Filled", cat: "Social", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
  { name: "Share", cat: "Social", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' },
  { name: "Message", cat: "Social", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>' },
  { name: "Bell", cat: "Social", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>' },
  // UI
  { name: "Check", cat: "UI", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' },
  { name: "Check Circle", cat: "UI", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>' },
  { name: "X Mark", cat: "UI", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' },
  { name: "Plus", cat: "UI", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>' },
  { name: "Minus", cat: "UI", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>' },
  { name: "Search", cat: "UI", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' },
  { name: "Settings", cat: "UI", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>' },
  { name: "Menu", cat: "UI", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>' },
  // Business
  { name: "User", cat: "Business", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
  { name: "Users", cat: "Business", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { name: "Mail", cat: "Business", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>' },
  { name: "Phone", cat: "Business", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' },
  { name: "Map Pin", cat: "Business", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' },
  { name: "Briefcase", cat: "Business", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' },
  { name: "Globe", cat: "Business", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>' },
  { name: "Award", cat: "Business", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>' },
  // Media
  { name: "Camera", cat: "Media", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>' },
  { name: "Play", cat: "Media", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" stroke="none"><polygon points="6 3 20 12 6 21 6 3"/></svg>' },
  { name: "Music", cat: "Media", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' },
  { name: "Mic", cat: "Media", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>' },
  // Misc
  { name: "Home", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { name: "Calendar", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>' },
  { name: "Clock", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
  { name: "Sun", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>' },
  { name: "Moon", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>' },
  { name: "Cloud", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>' },
  { name: "Zap", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
  { name: "Flame", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>' },
  { name: "Rocket", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>' },
  { name: "Gift", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>' },
  { name: "Coffee", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>' },
  { name: "Shield", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>' },
  { name: "Target", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>' },
  { name: "Download", cat: "UI", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>' },
  { name: "Link", cat: "UI", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' },
  { name: "Wifi", cat: "Misc", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>' },
];

const ICON_CATEGORIES = ["All", ...Array.from(new Set(CURATED_ICONS.map((i) => i.cat)))];

// ──── Stock Photos (Picsum) ────
interface StockPhoto {
  id: string;
  author: string;
  download_url: string;
  width: number;
  height: number;
}

export function DesignToolbar({ canvasRef, activeTool, onToolChange, onOpenTemplates, designWidth = 1080, designHeight = 1080, onMagicResize }: DesignToolbarProps) {
  const [bgColor, setBgColor] = useState("#ffffff");
  const [drawColor, setDrawColor] = useState("#333333");
  const [drawWidth, setDrawWidth] = useState(3);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Elements/Icons state
  const [iconSearch, setIconSearch] = useState("");
  const [iconCategory, setIconCategory] = useState("All");
  const [onlineIcons, setOnlineIcons] = useState<string[]>([]);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const [iconColor, setIconColor] = useState("#333333");

  // Stock photos state
  const [stockPhotos, setStockPhotos] = useState<StockPhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  // AI Design state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiRefImage, setAiRefImage] = useState<string | null>(null);
  const [aiRefImageName, setAiRefImageName] = useState("");
  const aiImageInputRef = useRef<HTMLInputElement>(null);
  const [photoPage, setPhotoPage] = useState(1);

  // Image search state
  const [imageSearch, setImageSearch] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearchingImages, setIsSearchingImages] = useState(false);

  // Layers state
  const [layerObjects, setLayerObjects] = useState<any[]>([]);
  const [layoutGap, setLayoutGap] = useState(24);
  const [magicWritePrompt, setMagicWritePrompt] = useState("");
  const [magicWriteTone, setMagicWriteTone] = useState<"professional" | "bold" | "friendly">("professional");
  const [magicWriteOptions, setMagicWriteOptions] = useState<string[]>([]);
  const [harmonyBase, setHarmonyBase] = useState("#6366f1");
  const [brandName, setBrandName] = useState("My Brand");
  const [brandFonts, setBrandFonts] = useState("Inter, Poppins");
  const [brandColors, setBrandColors] = useState<string[]>(["#6366f1", "#ec4899", "#0ea5e9", "#111827"]);
  const [brandLogo, setBrandLogo] = useState<string>("");
  const brandLogoInputRef = useRef<HTMLInputElement>(null);

  const generatePalette = useMemo(() => {
    const hexToRgb = (hex: string) => {
      const clean = hex.replace("#", "");
      if (clean.length !== 6) return { r: 99, g: 102, b: 241 };
      return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
      };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
    const rgbToHsl = (r: number, g: number, b: number) => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      const d = max - min;
      if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          default: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return { h, s, l };
    };
    const hslToRgb = (h: number, s: number, l: number) => {
      if (s === 0) {
        const v = l * 255;
        return { r: v, g: v, b: v };
      }
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      return {
        r: hue2rgb(p, q, h + 1 / 3) * 255,
        g: hue2rgb(p, q, h) * 255,
        b: hue2rgb(p, q, h - 1 / 3) * 255,
      };
    };
    return (baseHex: string) => {
      const rgb = hexToRgb(baseHex);
      const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const variants = [
        { h, s, l: Math.max(0.18, l - 0.25) },
        { h, s, l: Math.min(0.85, l + 0.2) },
        { h: (h + 0.08) % 1, s: Math.min(1, s + 0.05), l },
        { h: (h + 0.5) % 1, s: Math.max(0.2, s - 0.1), l: Math.max(0.2, l - 0.08) },
      ];
      return [baseHex, ...variants.map((v) => {
        const out = hslToRgb(v.h, v.s, v.l);
        return rgbToHex(out.r, out.g, out.b);
      })];
    };
  }, []);

  // Refresh layers list
  const refreshLayers = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const objects = canvas.getObjects().map((obj: any, index: number) => ({
      index,
      type: obj.type,
      name: obj.type === "i-text" || obj.type === "text" || obj.type === "textbox"
        ? (obj.text?.substring(0, 20) || "Text")
        : obj.type === "group" ? "Group" : (obj.type || "Object"),
      visible: obj.visible !== false,
      locked: obj.lockMovementX || false,
      obj,
    }));
    setLayerObjects(objects.reverse()); // Top layer first
  }, [canvasRef]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("design:brand-kit:v1");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.name) setBrandName(parsed.name);
      if (Array.isArray(parsed?.colors) && parsed.colors.length) setBrandColors(parsed.colors.slice(0, 6));
      if (parsed?.fonts) setBrandFonts(parsed.fonts);
      if (parsed?.logo) setBrandLogo(parsed.logo);
    } catch {
      // ignore invalid local storage
    }
  }, []);

  const saveBrandKit = useCallback(() => {
    const payload = {
      name: brandName.trim() || "My Brand",
      colors: brandColors,
      fonts: brandFonts,
      logo: brandLogo,
    };
    localStorage.setItem("design:brand-kit:v1", JSON.stringify(payload));
  }, [brandName, brandColors, brandFonts, brandLogo]);

  const applyBrandColor = useCallback((color: string) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const active = canvas.getActiveObject() as any;
    if (active) {
      const setDeep = (obj: any, c: string) => {
        const kids = obj.getObjects ? obj.getObjects() : [];
        if (kids.length > 0) {
          for (const child of kids) setDeep(child, c);
          obj.dirty = true;
        } else {
          if (obj.fill != null && obj.fill !== "none") obj.set("fill", c);
          obj.set("stroke", c);
          obj.dirty = true;
        }
      };
      const t = active.type;
      if (t === "group" || t === "activeselection" || t === "activeSelection") {
        setDeep(active, color);
      } else {
        if (active.fill !== undefined) active.set("fill", color);
        active.set("stroke", color);
      }
      canvas.renderAll();
      return;
    }
    canvasRef.current?.setBackgroundColor(color);
  }, [canvasRef]);

  const applyBrandFont = useCallback((font: string) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const active = canvas.getActiveObject() as any;
    if (active && (active.type === "i-text" || active.type === "text" || active.type === "textbox")) {
      active.set("fontFamily", font);
      canvas.renderAll();
      return;
    }
    canvas.getObjects().forEach((obj: any) => {
      if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
        obj.set("fontFamily", font);
      }
    });
    canvas.renderAll();
  }, [canvasRef]);

  const handleBrandLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setBrandLogo(data.url);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => setBrandLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }, []);

  // Load stock photos
  const loadStockPhotos = useCallback(async (page: number) => {
    setIsLoadingPhotos(true);
    try {
      const res = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=20`);
      const data = await res.json();
      setStockPhotos((prev) => (page === 1 ? data : [...prev, ...data]));
    } catch {
      console.error("Failed to load stock photos");
    } finally {
      setIsLoadingPhotos(false);
    }
  }, []);

  // Search images using LoremFlickr + keyword
  const searchImages = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearchingImages(true);
    try {
      const keyword = encodeURIComponent(query.trim());
      // Generate multiple unique image URLs using loremflickr (free, no API key)
      const results: string[] = [];
      for (let i = 1; i <= 12; i++) {
        results.push(`https://loremflickr.com/800/600/${keyword}?lock=${i}`);
      }
      setSearchResults(results);
    } catch {
      console.error("Failed to search images");
    } finally {
      setIsSearchingImages(false);
    }
  }, []);

  // Debounced image search
  useEffect(() => {
    if (!imageSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => searchImages(imageSearch), 600);
    return () => clearTimeout(timer);
  }, [imageSearch, searchImages]);

  // Search Iconify API
  const searchOnlineIcons = useCallback(async (query: string) => {
    if (!query.trim()) {
      setOnlineIcons([]);
      return;
    }
    setIsSearchingIcons(true);
    try {
      const res = await fetch(
        `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=48`
      );
      const data = await res.json();
      setOnlineIcons(data.icons || []);
    } catch {
      console.error("Failed to search icons");
    } finally {
      setIsSearchingIcons(false);
    }
  }, []);

  // Add online icon to canvas
  const addOnlineIcon = async (iconId: string) => {
    try {
      const res = await fetch(
        `https://api.iconify.design/${iconId}.svg?height=100&color=${encodeURIComponent(iconColor)}`
      );
      const svgText = await res.text();
      canvasRef.current?.addSVGIcon(svgText, { size: 120, fill: iconColor });
    } catch {
      console.error("Failed to load icon:", iconId);
    }
  };

  // Debounced icon search
  useEffect(() => {
    if (!iconSearch.trim()) {
      setOnlineIcons([]);
      return;
    }
    const timer = setTimeout(() => searchOnlineIcons(iconSearch), 500);
    return () => clearTimeout(timer);
  }, [iconSearch, searchOnlineIcons]);

  // Load stock photos when image panel opens
  useEffect(() => {
    if (activeTool === "image" && stockPhotos.length === 0) {
      loadStockPhotos(1);
    }
    if (activeTool === "layers") {
      refreshLayers();
    }
  }, [activeTool, stockPhotos.length, loadStockPhotos, refreshLayers]);

  const handleAddShape = (type: string) => {
    canvasRef.current?.addShape(type);
  };

  const handleAddText = (type: "heading" | "subheading" | "body") => {
    const options: Record<string, unknown> = {};
    switch (type) {
      case "heading":
        options.fontSize = 64;
        options.fontWeight = "bold";
        options.text = "Add a heading";
        break;
      case "subheading":
        options.fontSize = 44;
        options.fontWeight = "600";
        options.text = "Add a subheading";
        break;
      case "body":
        options.fontSize = 24;
        options.text = "Add body text";
        break;
    }
    canvasRef.current?.addText(options.text as string, options);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        canvasRef.current?.addImage(data.url);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        canvasRef.current?.addImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleBgColor = (color: string) => {
    setBgColor(color);
    canvasRef.current?.setBackgroundColor(color);
  };

  const handleToggleDraw = () => {
    const isDrawing = activeTool === "draw";
    if (isDrawing) {
      onToolChange("select");
      canvasRef.current?.toggleDrawingMode(false);
    } else {
      onToolChange("draw");
      canvasRef.current?.toggleDrawingMode(true);
      canvasRef.current?.setDrawingBrush({ color: drawColor, width: drawWidth });
    }
  };

  const autoLayout = useCallback((mode: "row" | "column" | "grid") => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const active = canvas.getActiveObject() as any;
    const isActiveSelection = active?.type === "activeselection" || active?.type === "activeSelection";
    const items = isActiveSelection
      ? active.getObjects()
      : canvas.getObjects().filter((obj: any) => !obj._isBgImage);
    if (!items || items.length < 2) return;

    const gap = layoutGap;
    const sorted = [...items].sort((a: any, b: any) => (a.top || 0) - (b.top || 0));
    const startX = Math.min(...sorted.map((o: any) => o.left || 0));
    const startY = Math.min(...sorted.map((o: any) => o.top || 0));

    if (mode === "row") {
      let x = startX;
      sorted.forEach((obj: any) => {
        const w = (obj.width || 0) * (obj.scaleX || 1);
        obj.set({ left: x, top: startY });
        x += w + gap;
        obj.setCoords?.();
      });
    } else if (mode === "column") {
      let y = startY;
      sorted.forEach((obj: any) => {
        const h = (obj.height || 0) * (obj.scaleY || 1);
        obj.set({ left: startX, top: y });
        y += h + gap;
        obj.setCoords?.();
      });
    } else {
      const cols = Math.ceil(Math.sqrt(sorted.length));
      let maxW = 120;
      let maxH = 120;
      sorted.forEach((obj: any) => {
        maxW = Math.max(maxW, (obj.width || 0) * (obj.scaleX || 1));
        maxH = Math.max(maxH, (obj.height || 0) * (obj.scaleY || 1));
      });
      sorted.forEach((obj: any, idx: number) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        obj.set({
          left: startX + col * (maxW + gap),
          top: startY + row * (maxH + gap),
        });
        obj.setCoords?.();
      });
    }
    canvas.renderAll();
    refreshLayers();
  }, [canvasRef, layoutGap, refreshLayers]);

  const runLayoutAssistant = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const objects = canvas.getObjects().filter((obj: any) => !obj._isBgImage);
    if (objects.length < 2) {
      setAiError("Add at least two objects for layout suggestions.");
      return;
    }
    const offCanvas = objects.filter((obj: any) => {
      const left = obj.left || 0;
      const top = obj.top || 0;
      const w = (obj.width || 0) * (obj.scaleX || 1);
      const h = (obj.height || 0) * (obj.scaleY || 1);
      return left < 0 || top < 0 || left + w > designWidth || top + h > designHeight;
    }).length;
    const advice: string[] = [];
    if (offCanvas > 0) advice.push(`${offCanvas} objects are outside the canvas bounds.`);
    if (objects.length > 12) advice.push("Design is dense. Try grouping related elements.");
    if (objects.length >= 3) advice.push("Use auto layout row/column/grid for cleaner spacing.");
    if (advice.length === 0) advice.push("Layout looks balanced. Try generating a color variation.");
    setAiError(advice.join(" "));
  }, [canvasRef, designWidth, designHeight]);

  const generateMagicWrite = useCallback(() => {
    if (!magicWritePrompt.trim()) return;
    const base = magicWritePrompt.trim();
    const options =
      magicWriteTone === "bold"
        ? [
            `${base.toUpperCase()} - MAKE IT UNMISSABLE`,
            `${base}: The next big thing starts here`,
            `Stop scrolling. ${base}.`,
          ]
        : magicWriteTone === "friendly"
          ? [
              `${base} made simple and fun`,
              `Let's make ${base} together`,
              `${base} for everyone`,
            ]
          : [
              `${base} for modern teams`,
              `${base}: professional results, faster`,
              `Achieve better outcomes with ${base}`,
            ];
    setMagicWriteOptions(options);
  }, [magicWritePrompt, magicWriteTone]);

  const applyVariation = useCallback(async () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const active = canvas.getActiveObject() as any;
    if (!active) return;
    const clone = await active.clone();
    const palette = generatePalette(harmonyBase);
    const accent = palette[Math.floor(Math.random() * palette.length)];
    clone.set({
      left: (active.left || 0) + 40,
      top: (active.top || 0) + 40,
    });
    const colorDeep = (obj: any, c: string) => {
      const kids = obj.getObjects ? obj.getObjects() : [];
      for (const child of kids) {
        if (child.type === "group") { colorDeep(child, c); }
        else {
          if (child.fill != null && child.fill !== "none" && child.fill !== "") child.set("fill", c);
          if (child.stroke) child.set("stroke", c);
        }
        child.dirty = true;
      }
      obj.dirty = true;
    };
    if ((clone as any).type === "group" && (clone as any).getObjects) {
      colorDeep(clone, accent);
    } else {
      if ((clone as any).fill) (clone as any).set("fill", accent);
      if ((clone as any).stroke) (clone as any).set("stroke", accent);
    }
    canvas.add(clone);
    canvas.setActiveObject(clone);
    canvas.renderAll();
  }, [canvasRef, generatePalette, harmonyBase]);

  // AI Design generation handler
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          width: designWidth,
          height: designHeight,
          referenceImage: aiRefImage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate design");
      if (data.designJSON) {
        canvasRef.current?.loadJSON(data.designJSON);
        setAiPrompt("");
        setAiRefImage(null);
        setAiRefImageName("");
      }
    } catch (err: any) {
      setAiError(err.message || "Generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAiRefImage(reader.result as string);
      setAiRefImageName(file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Toolbar buttons
  const tools = [
    { id: "select" as ToolType, icon: MousePointer2, label: "Select" },
    { id: "ai" as ToolType, icon: Wand2, label: "AI Design" },
    { id: "templates" as ToolType, icon: LayoutTemplate, label: "Templates" },
    { id: "text" as ToolType, icon: Type, label: "Text" },
    { id: "shapes" as ToolType, icon: Square, label: "Shapes" },
    { id: "flowchart" as ToolType, icon: Workflow, label: "Flowchart" },
    { id: "elements" as ToolType, icon: Sparkles, label: "Elements & Icons" },
    { id: "draw" as ToolType, icon: Pencil, label: "Draw" },
    { id: "image" as ToolType, icon: ImageIcon, label: "Images" },
    { id: "background" as ToolType, icon: Palette, label: "Background" },
    { id: "layers" as ToolType, icon: Layers, label: "Layers" },
  ];

  const renderPanel = () => {
    switch (activeTool) {
      case "text":
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Add Text</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleAddText("heading")}>
                <Heading1 className="w-5 h-5 mr-3 shrink-0" />
                <div><p className="font-bold text-lg">Add a heading</p></div>
              </Button>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleAddText("subheading")}>
                <Heading2 className="w-5 h-5 mr-3 shrink-0" />
                <div><p className="font-semibold">Add a subheading</p></div>
              </Button>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleAddText("body")}>
                <AlignLeft className="w-5 h-5 mr-3 shrink-0" />
                <div><p className="text-sm">Add body text</p></div>
              </Button>
            </div>
            <Separator />
            <h4 className="font-semibold text-sm">Font Combinations</h4>
            <div className="space-y-2">
              {[
                { title: "Modern", heading: "Inter", body: "Inter" },
                { title: "Classic", heading: "Georgia", body: "Arial" },
                { title: "Bold", heading: "Impact", body: "Helvetica" },
                { title: "Elegant", heading: "Playfair Display", body: "Lato" },
              ].map((combo) => (
                <Button
                  key={combo.title}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => {
                    canvasRef.current?.addText("Heading Text", {
                      fontSize: 48, fontWeight: "bold", fontFamily: combo.heading,
                    });
                  }}
                >
                  <div>
                    <p className="font-bold text-sm" style={{ fontFamily: combo.heading }}>{combo.title}</p>
                    <p className="text-xs text-muted-foreground">{combo.heading} + {combo.body}</p>
                  </div>
                </Button>
              ))}
            </div>
            <Separator />
            <h4 className="font-semibold text-sm">Magic Write</h4>
            <div className="space-y-2">
              <Input
                value={magicWritePrompt}
                onChange={(e) => setMagicWritePrompt(e.target.value)}
                placeholder="Topic or message..."
                className="text-xs"
              />
              <div className="flex gap-1">
                {(["professional", "bold", "friendly"] as const).map((tone) => (
                  <Button
                    key={tone}
                    size="sm"
                    variant={magicWriteTone === tone ? "default" : "outline"}
                    className="text-[10px] h-7 flex-1 capitalize"
                    onClick={() => setMagicWriteTone(tone)}
                  >
                    {tone}
                  </Button>
                ))}
              </div>
              <Button size="sm" className="w-full gap-1" onClick={generateMagicWrite} disabled={!magicWritePrompt.trim()}>
                <WandSparkles className="w-3.5 h-3.5" />
                Generate Copy
              </Button>
              {magicWriteOptions.map((line) => (
                <button
                  key={line}
                  className="w-full text-left text-xs px-2 py-1.5 rounded border hover:bg-accent"
                  onClick={() => canvasRef.current?.addText(line, { fontSize: 28, width: 620 })}
                >
                  {line}
                </button>
              ))}
            </div>
          </div>
        );

      case "shapes":
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Shapes</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "rectangle", icon: Square, label: "Rectangle" },
                { type: "circle", icon: Circle, label: "Circle" },
                { type: "triangle", icon: Triangle, label: "Triangle" },
                { type: "line", icon: Minus, label: "Line" },
                { type: "star", icon: Star, label: "Star" },
                { type: "polygon", icon: Hexagon, label: "Hexagon" },
                { type: "arrow", icon: ArrowRight, label: "Arrow" },
              ].map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-20 flex flex-col gap-1 items-center justify-center"
                  onClick={() => handleAddShape(type)}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        );

      case "flowchart":
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Flowchart & Diagrams</h3>

            {/* Connection Points Info */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <Cable className="w-3.5 h-3.5" /> Smart Connectors Active
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">
                Hover any shape to see <strong>blue connection dots</strong> at its edges.
                Click &amp; drag from a dot to another shape to create an arrow connector.
                Green dots show valid snap targets.
              </p>
            </div>

            <Separator />

            <h4 className="font-semibold text-xs text-muted-foreground uppercase">Shapes</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: "process", icon: Square, label: "Process", desc: "Standard step" },
                { type: "decision", icon: Diamond, label: "Decision", desc: "Condition" },
                { type: "terminator", icon: Minus, label: "Start/End", desc: "Terminal" },
                { type: "data-io", icon: MoveRight, label: "Data I/O", desc: "Input/output" },
                { type: "database", icon: Database, label: "Database", desc: "Storage" },
                { type: "document", icon: FileText, label: "Document", desc: "Output" },
                { type: "cloud-shape", icon: Cloud, label: "Cloud", desc: "External" },
                { type: "subroutine", icon: GitBranch, label: "Subroutine", desc: "Sub-process" },
                { type: "predefined-process", icon: Square, label: "Pre-defined", desc: "Predefined" },
              ].map(({ type, icon: Icon, label, desc }) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto py-2.5 flex flex-col gap-0.5 items-center justify-center"
                  onClick={() => handleAddShape(type)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                  <span className="text-[10px] text-muted-foreground">{desc}</span>
                </Button>
              ))}
            </div>

            <Separator />

            <h4 className="font-semibold text-xs text-muted-foreground uppercase">Connectors & Arrows</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: "connector-arrow", icon: ArrowRight, label: "Arrow", desc: "Straight" },
                { type: "connector-double", icon: ArrowRightLeft, label: "Double", desc: "Bidirectional" },
                { type: "connector-dashed", icon: Minus, label: "Dashed", desc: "Dashed line" },
                { type: "connector-curved", icon: CornerDownRight, label: "Curved", desc: "Bezier curve" },
                { type: "connector-elbow", icon: CornerDownRight, label: "Elbow", desc: "Right-angle" },
                { type: "line", icon: Minus, label: "Line", desc: "Simple" },
              ].map(({ type, icon: Icon, label, desc }) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto py-2.5 flex flex-col gap-0.5 items-center justify-center"
                  onClick={() => handleAddShape(type)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                  <span className="text-[10px] text-muted-foreground">{desc}</span>
                </Button>
              ))}
            </div>

            <Separator />

            <h4 className="font-semibold text-xs text-muted-foreground uppercase">Quick Start</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => {
                  handleAddShape("terminator");
                  setTimeout(() => handleAddShape("process"), 150);
                  setTimeout(() => handleAddShape("decision"), 300);
                }}
              >
                <Workflow className="w-4 h-4 mr-2 shrink-0" />
                <div>
                  <p className="text-xs font-medium">Basic Flow Kit</p>
                  <p className="text-[10px] text-muted-foreground">Start + Process + Decision shapes</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => {
                  handleAddShape("cloud-shape");
                  setTimeout(() => handleAddShape("process"), 150);
                  setTimeout(() => handleAddShape("database"), 300);
                }}
              >
                <Cloud className="w-4 h-4 mr-2 shrink-0" />
                <div>
                  <p className="text-xs font-medium">Architecture Kit</p>
                  <p className="text-[10px] text-muted-foreground">Cloud + Service + Database shapes</p>
                </div>
              </Button>
            </div>

            <Separator />
            <div className="text-[10px] text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-xs">How to connect:</p>
              <p>1. Add shapes to canvas</p>
              <p>2. Hover a shape — see blue dots at edges</p>
              <p>3. Click &amp; drag from a dot to another shape</p>
              <p>4. Arrow snaps to the nearest edge</p>
              <p>5. Select arrow → change color/style in Properties</p>
              <p className="pt-1">Or use the connector buttons above to add standalone arrows.</p>
            </div>
          </div>
        );

      case "elements":
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Elements & Icons</h3>

            {/* Icon Color */}
            <div>
              <Label className="text-xs">Icon Color</Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="color"
                  value={iconColor}
                  onChange={(e) => setIconColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <div className="flex flex-wrap gap-1">
                  {["#333333", "#000000", "#ffffff", "#FF0000", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"].map((c) => (
                    <button
                      key={c}
                      className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${iconColor === c ? "ring-2 ring-primary" : "border-gray-300 dark:border-gray-600"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setIconColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Curated Icons */}
            <div>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {ICON_CATEGORIES.map((cat) => (
                  <Badge
                    key={cat}
                    variant={iconCategory === cat ? "default" : "outline"}
                    className="cursor-pointer text-[10px] px-1.5 py-0.5"
                    onClick={() => setIconCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {CURATED_ICONS
                  .filter((icon) => iconCategory === "All" || icon.cat === iconCategory)
                  .map((icon) => (
                    <Tooltip key={icon.name}>
                      <TooltipTrigger asChild>
                        <button
                          className="w-full aspect-square rounded border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 flex items-center justify-center p-2 transition-all"
                          onClick={() => {
                            const coloredSvg = icon.svg.replace(/stroke="black"/g, `stroke="${iconColor}"`).replace(/fill="black"/g, `fill="${iconColor}"`);
                            canvasRef.current?.addSVGIcon(coloredSvg, { size: 120, fill: iconColor });
                          }}
                        >
                          <div
                            className="w-6 h-6"
                            dangerouslySetInnerHTML={{
                              __html: icon.svg.replace(/stroke="black"/g, 'stroke="currentColor"').replace(/fill="black"/g, 'fill="currentColor"'),
                            }}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">{icon.name}</TooltipContent>
                    </Tooltip>
                  ))}
              </div>
            </div>

            <Separator />

            {/* Online Icon Search */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Search 100,000+ Icons</h4>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search icons (e.g. arrow, social)..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              {isSearchingIcons && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-xs text-muted-foreground">Searching...</span>
                </div>
              )}
              {onlineIcons.length > 0 && (
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  {onlineIcons.map((iconId) => {
                    const [prefix, name] = iconId.split(":");
                    return (
                      <Tooltip key={iconId}>
                        <TooltipTrigger asChild>
                          <button
                            className="w-full aspect-square rounded border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 flex items-center justify-center p-1.5 transition-all"
                            onClick={() => addOnlineIcon(iconId)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://api.iconify.design/${prefix}/${name}.svg?height=24`}
                              alt={name}
                              className="w-5 h-5 dark:invert"
                              loading="lazy"
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">{name}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
              {iconSearch && !isSearchingIcons && onlineIcons.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No icons found. Try a different search term.
                </p>
              )}
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Powered by Iconify — Material, Font Awesome, Lucide & more
              </p>
            </div>
          </div>
        );

      case "draw":
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Drawing</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Brush Color</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {PRESET_COLORS.slice(0, 12).map((color) => (
                    <button
                      key={color}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${drawColor === color ? "border-primary ring-2 ring-primary/30" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setDrawColor(color);
                        canvasRef.current?.setDrawingBrush({ color });
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Brush Size: {drawWidth}px</Label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={drawWidth}
                  onChange={(e) => {
                    const w = parseInt(e.target.value);
                    setDrawWidth(w);
                    canvasRef.current?.setDrawingBrush({ width: w });
                  }}
                  className="w-full mt-1"
                />
              </div>
            </div>
          </div>
        );

      case "image":
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Images</h3>
            <Button
              variant="outline"
              className="w-full h-24 border-dashed flex flex-col gap-2"
              onClick={() => imageInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upload Image</span>
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <Separator />

            <h4 className="font-semibold text-sm">Add from URL</h4>
            <div className="flex gap-2">
              <Input placeholder="Paste image URL..." id="imageUrl" className="text-xs" />
              <Button
                size="sm"
                onClick={() => {
                  const input = document.getElementById("imageUrl") as HTMLInputElement;
                  if (input.value) {
                    canvasRef.current?.addImage(input.value);
                    input.value = "";
                  }
                }}
              >
                Add
              </Button>
            </div>

            <Separator />

            {/* Image Search */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Search Images</h4>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search photos (e.g. mountains, food)..."
                  value={imageSearch}
                  onChange={(e) => setImageSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              {isSearchingImages && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-xs text-muted-foreground">Searching...</span>
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-[10px] text-muted-foreground">Results for &quot;{imageSearch}&quot;</p>
                  <div className="grid grid-cols-2 gap-2">
                    {searchResults.map((url, idx) => (
                      <button
                        key={idx}
                        className="relative group rounded-lg overflow-hidden border hover:border-primary transition-all aspect-video"
                        onClick={() => canvasRef.current?.addImage(url)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url.replace("/800/600/", "/200/150/")}
                          alt={`Search result ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium">
                            Add to canvas
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {imageSearch && !isSearchingImages && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Type a keyword to search for images.
                </p>
              )}
            </div>

            <Separator />

            {/* Stock Photos */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Stock Photos</h4>
              <p className="text-[10px] text-muted-foreground mb-2">Free stock photos from Lorem Picsum</p>
              <div className="grid grid-cols-2 gap-2">
                {stockPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    className="relative group rounded-lg overflow-hidden border hover:border-primary transition-all aspect-square"
                    onClick={() => {
                      const url = `https://picsum.photos/id/${photo.id}/800/600`;
                      canvasRef.current?.addImage(url);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://picsum.photos/id/${photo.id}/200/200`}
                      alt={`Photo by ${photo.author}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium">
                        Add to canvas
                      </span>
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate">
                      {photo.author}
                    </span>
                  </button>
                ))}
              </div>
              {isLoadingPhotos && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-xs text-muted-foreground">Loading photos...</span>
                </div>
              )}
              {stockPhotos.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    const nextPage = photoPage + 1;
                    setPhotoPage(nextPage);
                    loadStockPhotos(nextPage);
                  }}
                  disabled={isLoadingPhotos}
                >
                  Load More Photos
                </Button>
              )}
            </div>
          </div>
        );

      case "background":
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Background</h3>
            <div>
              <Label className="text-xs">Solid Colors</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${bgColor === color ? "border-primary ring-2 ring-primary/30" : "border-gray-200 dark:border-gray-700"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleBgColor(color)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Custom Color</Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => handleBgColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={bgColor}
                  onChange={(e) => handleBgColor(e.target.value)}
                  className="flex-1 text-xs uppercase"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-xs">Background Image</Label>
              <Button
                variant="outline"
                className="w-full mt-2 h-12 border-dashed"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      canvasRef.current?.setBackgroundImage(ev.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }}
              >
                <PaintBucket className="w-4 h-4 mr-2" />
                Upload Background
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">AI Color Harmony</h4>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={harmonyBase}
                  onChange={(e) => setHarmonyBase(e.target.value)}
                  className="w-9 h-9 rounded cursor-pointer"
                />
                <Input value={harmonyBase} onChange={(e) => setHarmonyBase(e.target.value)} className="text-xs uppercase" />
              </div>
              <div className="grid grid-cols-5 gap-1">
                {generatePalette(harmonyBase).map((color) => (
                  <button
                    key={color}
                    className="h-8 rounded border border-white/20"
                    style={{ backgroundColor: color }}
                    onClick={() => applyBrandColor(color)}
                    title="Apply to selected object"
                  />
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Brand Kit</h4>
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Brand name" className="text-xs" />
              <Input value={brandFonts} onChange={(e) => setBrandFonts(e.target.value)} placeholder="Fonts (comma separated)" className="text-xs" />
              <div className="grid grid-cols-4 gap-1">
                {brandColors.map((c) => (
                  <button
                    key={c}
                    className="h-8 rounded border border-white/20"
                    style={{ backgroundColor: c }}
                    onClick={() => applyBrandColor(c)}
                    title="Apply brand color"
                  />
                ))}
              </div>
              <div className="flex gap-1">
                {brandFonts.split(",").map((f) => (
                  <Button
                    key={f.trim()}
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7 flex-1 truncate"
                    onClick={() => applyBrandFont(f.trim())}
                  >
                    {f.trim()}
                  </Button>
                ))}
              </div>
              <input
                ref={brandLogoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBrandLogoUpload}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => brandLogoInputRef.current?.click()}>
                  Upload Logo
                </Button>
                <Button size="sm" className="flex-1 text-xs" onClick={saveBrandKit}>
                  Save Kit
                </Button>
              </div>
              {brandLogo && (
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => canvasRef.current?.addImage(brandLogo)}>
                  Add Brand Logo
                </Button>
              )}
            </div>
          </div>
        );

      case "layers":
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Layers</h3>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={refreshLayers}>
                Refresh
              </Button>
            </div>

            {/* Group / Ungroup */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  canvasRef.current?.group();
                  setTimeout(refreshLayers, 100);
                }}
              >
                <Group className="w-3.5 h-3.5 mr-1.5" />
                Group
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  canvasRef.current?.ungroup();
                  setTimeout(refreshLayers, 100);
                }}
              >
                <Ungroup className="w-3.5 h-3.5 mr-1.5" />
                Ungroup
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Select multiple objects to group. Select a group to ungroup.
              <br />
              Shortcuts: <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Ctrl+G</kbd> / <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Ctrl+Shift+G</kbd>
            </p>

            <Separator />

            <h4 className="font-semibold text-xs text-muted-foreground uppercase">Auto Layout</h4>
            <Label className="text-xs">Gap: {layoutGap}px</Label>
            <input
              type="range"
              min="4"
              max="80"
              value={layoutGap}
              onChange={(e) => setLayoutGap(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="grid grid-cols-3 gap-1.5">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => autoLayout("row")}>Row</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => autoLayout("column")}>Column</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => autoLayout("grid")}>Grid</Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={runLayoutAssistant}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              AI Layout Assistant
            </Button>

            <Separator />

            {/* Layer Ordering */}
            <h4 className="font-semibold text-xs text-muted-foreground uppercase">Arrange</h4>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  canvasRef.current?.bringToFront();
                  setTimeout(refreshLayers, 100);
                }}
              >
                <ArrowUpToLine className="w-3.5 h-3.5 mr-1" />
                To Front
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  canvasRef.current?.sendToBack();
                  setTimeout(refreshLayers, 100);
                }}
              >
                <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />
                To Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  canvasRef.current?.bringForward();
                  setTimeout(refreshLayers, 100);
                }}
              >
                <MoveUp className="w-3.5 h-3.5 mr-1" />
                Forward
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  canvasRef.current?.sendBackward();
                  setTimeout(refreshLayers, 100);
                }}
              >
                <MoveDown className="w-3.5 h-3.5 mr-1" />
                Backward
              </Button>
            </div>

            <Separator />

            {/* Visual Layer List */}
            <h4 className="font-semibold text-xs text-muted-foreground uppercase">Objects ({layerObjects.length})</h4>
            {layerObjects.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No objects on canvas
              </p>
            ) : (
              <div className="space-y-1">
                {layerObjects.map((layer) => (
                  <div
                    key={layer.index}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-transparent hover:border-border hover:bg-muted/50 cursor-pointer group transition-all"
                    onClick={() => {
                      const canvas = canvasRef.current?.getCanvas();
                      if (canvas) {
                        canvas.setActiveObject(layer.obj);
                        canvas.renderAll();
                      }
                    }}
                  >
                    <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                    <div className="w-6 h-6 rounded border bg-muted flex items-center justify-center shrink-0">
                      {layer.type === "i-text" || layer.type === "text" || layer.type === "textbox" ? (
                        <Type className="w-3 h-3" />
                      ) : layer.type === "rect" ? (
                        <Square className="w-3 h-3" />
                      ) : layer.type === "circle" ? (
                        <Circle className="w-3 h-3" />
                      ) : layer.type === "triangle" ? (
                        <Triangle className="w-3 h-3" />
                      ) : layer.type === "group" ? (
                        <Group className="w-3 h-3" />
                      ) : layer.type === "image" ? (
                        <ImageIcon className="w-3 h-3" />
                      ) : (
                        <Square className="w-3 h-3" />
                      )}
                    </div>
                    <span className="text-xs truncate flex-1">{layer.name}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          layer.obj.set("visible", !layer.visible);
                          canvasRef.current?.getCanvas()?.renderAll();
                          refreshLayers();
                        }}
                      >
                        {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          const lock = !layer.locked;
                          layer.obj.set({
                            lockMovementX: lock, lockMovementY: lock,
                            lockScalingX: lock, lockScalingY: lock,
                            lockRotation: lock, hasControls: !lock, selectable: true,
                          });
                          canvasRef.current?.getCanvas()?.renderAll();
                          refreshLayers();
                        }}
                      >
                        {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-xs"
                size="sm"
                onClick={() => canvasRef.current?.duplicate()}
              >
                <Copy className="w-3.5 h-3.5 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs text-destructive hover:text-destructive"
                size="sm"
                onClick={() => {
                  canvasRef.current?.deleteSelected();
                  setTimeout(refreshLayers, 100);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-sm">AI Design Generator</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe your design and AI will create it with editable Fabric.js objects. Everything will be movable and editable!
            </p>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Describe your design</Label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. YouTube thumbnail with bold title 'AI IS HERE', dark gradient background, tech-style decorative elements..."
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      handleAiGenerate();
                    }
                  }}
                />
              </div>

              {/* Reference Image Upload */}
              <div>
                <Label className="text-xs">Reference Image (optional)</Label>
                <p className="text-[10px] text-muted-foreground mb-1.5">Upload an image and AI will recreate it as editable canvas elements</p>
                <input
                  ref={aiImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAiImageUpload}
                />
                {aiRefImage ? (
                  <div className="relative border rounded-lg overflow-hidden">
                    <img src={aiRefImage} alt="Reference" className="w-full h-32 object-cover" />
                    <div className="absolute top-1 right-1 flex gap-1">
                      <button
                        onClick={() => { setAiRefImage(null); setAiRefImageName(""); }}
                        className="bg-black/70 text-white rounded-full p-1 hover:bg-black/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">
                      {aiRefImageName}
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-16 border-dashed flex flex-col gap-1"
                    onClick={() => aiImageInputRef.current?.click()}
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span className="text-xs">Upload reference</span>
                  </Button>
                )}
              </div>

              <div className="rounded-lg bg-muted/50 p-2 text-[10px] text-muted-foreground">
                <strong>Canvas size:</strong> {designWidth} x {designHeight}px
              </div>

              {aiError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">
                  {aiError}
                </div>
              )}

              <Button
                className="w-full gap-2"
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generate Design
                  </>
                )}
              </Button>

              {aiLoading && (
                <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                  AI is creating your design with editable elements...
                </p>
              )}
              <Button
                variant="outline"
                className="w-full gap-2 text-xs"
                onClick={applyVariation}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Variation
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-xs"
                onClick={runLayoutAssistant}
              >
                <WandSparkles className="w-3.5 h-3.5" />
                Analyze Layout
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-semibold text-xs">Quick Prompts</h4>
              {[
                "Modern social media post with bold typography and gradient background",
                "Professional business card design with clean layout",
                "YouTube thumbnail with exciting title and vibrant colors",
                "Instagram story with quote and decorative elements",
                "Event flyer with date, time, and venue details",
                "Product showcase with elegant presentation",
              ].map((prompt) => (
                <button
                  key={prompt}
                  className="w-full text-left text-xs px-3 py-2 rounded-md hover:bg-accent transition-colors border border-transparent hover:border-border"
                  onClick={() => setAiPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        );

      case "templates":
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Templates</h3>
            <Button className="w-full" onClick={onOpenTemplates}>
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Browse Templates
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Choose from pre-designed templates to get started quickly.
            </p>
            <Separator />
            <h4 className="font-semibold text-sm">Magic Resize</h4>
            <p className="text-xs text-muted-foreground">Resize and adapt your current design.</p>
            <div className="grid grid-cols-1 gap-1.5">
              {DESIGN_SIZES.filter((size) => size.name !== "Custom").slice(0, 8).map((size) => (
                <Button
                  key={size.name}
                  variant="outline"
                  className="justify-between text-xs"
                  onClick={() => onMagicResize?.(size.width, size.height)}
                >
                  <span>{size.name}</span>
                  <span className="text-[10px] text-muted-foreground">{size.width}x{size.height}</span>
                </Button>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Design Tools</h3>
            <p className="text-xs text-muted-foreground">
              Select a tool from the sidebar to get started. Click and drag objects on the canvas to move them.
            </p>
            <Separator />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Delete</kbd> Remove selected</p>
              <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+Z</kbd> Undo</p>
              <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+Y</kbd> Redo</p>
              <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+D</kbd> Duplicate</p>
              <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+A</kbd> Select All</p>
              <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+G</kbd> Group</p>
              <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+Shift+G</kbd> Ungroup</p>
              <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+Scroll</kbd> Zoom in/out</p>
              <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Alt+Drag</kbd> Pan canvas</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full">
      {/* Icon rail */}
      <div className="w-16 bg-background border-r flex flex-col items-center py-2 gap-1">
        <TooltipProvider delayDuration={0}>
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.id ? "default" : "ghost"}
                  size="icon"
                  className={`w-12 h-12 ${activeTool === tool.id ? "" : "hover:bg-muted"}`}
                  onClick={() => {
                    if (tool.id === "select") {
                      onToolChange("select");
                      canvasRef.current?.toggleDrawingMode(false);
                    } else if (tool.id === "draw") {
                      handleToggleDraw();
                    } else if (tool.id === "templates") {
                      onToolChange("templates");
                    } else {
                      onToolChange(tool.id);
                      canvasRef.current?.toggleDrawingMode(false);
                    }
                  }}
                >
                  <tool.icon className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{tool.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {/* Panel */}
      {activeTool !== "select" && (
        <div className="w-72 bg-background border-r overflow-hidden">
          <ScrollArea className="h-full">
            <TooltipProvider delayDuration={0}>
              {renderPanel()}
            </TooltipProvider>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
