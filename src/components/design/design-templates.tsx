"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, X, Loader2, Globe } from "lucide-react";
import type { DesignCanvasAPI } from "./design-canvas";

interface DesignTemplatesProps {
  open: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<DesignCanvasAPI | null>;
}

// Built-in templates with pre-created canvas JSON
const TEMPLATES = [
  {
    id: "blank",
    name: "Blank Canvas",
    category: "Basic",
    preview: "bg-white border-2 border-dashed border-gray-300",
    canvasJSON: JSON.stringify({ version: "6.0.0", objects: [], background: "#ffffff" }),
  },
  {
    id: "social-post-1",
    name: "Social Media Post",
    category: "Social",
    preview: "bg-gradient-to-br from-purple-500 to-pink-500",
    canvasJSON: JSON.stringify({
      version: "6.0.0",
      objects: [
        {
          type: "rect",
          left: 0, top: 0, width: 1080, height: 1080,
          fill: "#8B5CF6",
          selectable: false,
        },
        {
          type: "i-text",
          left: 100, top: 400, text: "Your Message\nHere",
          fontSize: 72, fontWeight: "bold", fill: "#ffffff",
          fontFamily: "Arial", textAlign: "center",
          width: 880,
        },
        {
          type: "i-text",
          left: 100, top: 600, text: "@yourusername",
          fontSize: 32, fill: "#ffffff",
          fontFamily: "Arial", opacity: 0.8,
        },
      ],
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    }),
  },
  {
    id: "business-card",
    name: "Business Card",
    category: "Business",
    preview: "bg-gradient-to-r from-slate-800 to-slate-900",
    canvasJSON: JSON.stringify({
      version: "6.0.0",
      objects: [
        {
          type: "i-text",
          left: 50, top: 80, text: "JOHN DOE",
          fontSize: 48, fontWeight: "bold", fill: "#ffffff",
          fontFamily: "Arial",
        },
        {
          type: "i-text",
          left: 50, top: 150, text: "Software Engineer",
          fontSize: 24, fill: "#94a3b8",
          fontFamily: "Arial",
        },
        {
          type: "line",
          x1: 50, y1: 200, x2: 400, y2: 200,
          stroke: "#6366f1", strokeWidth: 3,
        },
        {
          type: "i-text",
          left: 50, top: 230, text: "john@example.com\n+1 234 567 8900\nwww.johndoe.com",
          fontSize: 18, fill: "#cbd5e1", fontFamily: "Arial",
          lineHeight: 1.6,
        },
      ],
      background: "#1e293b",
    }),
  },
  {
    id: "presentation",
    name: "Presentation Slide",
    category: "Presentation",
    preview: "bg-gradient-to-br from-blue-600 to-cyan-500",
    canvasJSON: JSON.stringify({
      version: "6.0.0",
      objects: [
        {
          type: "i-text",
          left: 120, top: 300, text: "Presentation Title",
          fontSize: 80, fontWeight: "bold", fill: "#ffffff",
          fontFamily: "Arial",
        },
        {
          type: "i-text",
          left: 120, top: 420, text: "Subtitle goes here - Add your content",
          fontSize: 36, fill: "#ffffff", fontFamily: "Arial",
          opacity: 0.8,
        },
        {
          type: "rect",
          left: 120, top: 500, width: 200, height: 60,
          fill: "#ffffff", rx: 30, ry: 30,
        },
        {
          type: "i-text",
          left: 155, top: 515, text: "Get Started",
          fontSize: 24, fontWeight: "bold", fill: "#2563eb",
          fontFamily: "Arial",
        },
      ],
      background: "#2563eb",
    }),
  },
  {
    id: "resume",
    name: "Modern Resume",
    category: "Resume",
    preview: "bg-white",
    canvasJSON: JSON.stringify({
      version: "6.0.0",
      objects: [
        {
          type: "rect",
          left: 0, top: 0, width: 800, height: 200,
          fill: "#1e293b",
        },
        {
          type: "i-text",
          left: 60, top: 50, text: "YOUR NAME",
          fontSize: 56, fontWeight: "bold", fill: "#ffffff",
          fontFamily: "Arial",
        },
        {
          type: "i-text",
          left: 60, top: 120, text: "Professional Title | email@example.com | +1 234 567 890",
          fontSize: 20, fill: "#94a3b8", fontFamily: "Arial",
        },
        {
          type: "i-text",
          left: 60, top: 240, text: "EXPERIENCE",
          fontSize: 28, fontWeight: "bold", fill: "#1e293b",
          fontFamily: "Arial",
        },
        {
          type: "rect",
          left: 60, top: 280, width: 60, height: 4,
          fill: "#6366f1",
        },
        {
          type: "i-text",
          left: 60, top: 300, text: "Senior Software Engineer\nCompany Name | 2020 - Present\n\n• Led development of key features\n• Managed team of 5 engineers\n• Improved performance by 40%",
          fontSize: 18, fill: "#475569", fontFamily: "Arial",
          lineHeight: 1.5,
        },
      ],
      background: "#ffffff",
    }),
  },
  {
    id: "poster-event",
    name: "Event Poster",
    category: "Poster",
    preview: "bg-gradient-to-b from-amber-500 to-orange-600",
    canvasJSON: JSON.stringify({
      version: "6.0.0",
      objects: [
        {
          type: "i-text",
          left: 200, top: 200, text: "EVENT\nNAME",
          fontSize: 120, fontWeight: "bold", fill: "#ffffff",
          fontFamily: "Arial", textAlign: "center",
          lineHeight: 0.9,
        },
        {
          type: "i-text",
          left: 200, top: 500, text: "Join us for an amazing experience",
          fontSize: 36, fill: "#ffffff", fontFamily: "Arial",
          opacity: 0.9,
        },
        {
          type: "rect",
          left: 200, top: 600, width: 300, height: 80,
          fill: "#ffffff", rx: 12, ry: 12,
        },
        {
          type: "i-text",
          left: 250, top: 620, text: "REGISTER NOW",
          fontSize: 28, fontWeight: "bold", fill: "#ea580c",
          fontFamily: "Arial",
        },
        {
          type: "i-text",
          left: 200, top: 750, text: "December 25, 2026 • 7:00 PM\nVenue Name, City",
          fontSize: 24, fill: "#ffffff", fontFamily: "Arial",
          opacity: 0.8, textAlign: "center",
        },
      ],
      background: "#ea580c",
    }),
  },
  {
    id: "youtube-thumb",
    name: "YouTube Thumbnail",
    category: "YouTube",
    preview: "bg-gradient-to-br from-red-600 to-red-800",
    canvasJSON: JSON.stringify({
      version: "6.0.0",
      objects: [
        {
          type: "i-text",
          left: 60, top: 200, text: "VIDEO TITLE\nGOES HERE",
          fontSize: 80, fontWeight: "bold", fill: "#ffffff",
          fontFamily: "Arial",
          stroke: "#000000", strokeWidth: 3,
        },
        {
          type: "circle",
          left: 900, top: 400, radius: 60,
          fill: "#FF0000",
        },
        {
          type: "triangle",
          left: 920, top: 420, width: 50, height: 50,
          fill: "#ffffff", angle: 90,
        },
      ],
      background: "#1a1a2e",
    }),
  },
  {
    id: "instagram-story",
    name: "Instagram Story",
    category: "Social",
    preview: "bg-gradient-to-br from-fuchsia-600 via-pink-500 to-rose-500",
    canvasJSON: JSON.stringify({
      version: "6.0.0",
      objects: [
        {
          type: "i-text",
          left: 100, top: 600, text: "SWIPE UP",
          fontSize: 60, fontWeight: "bold", fill: "#ffffff",
          fontFamily: "Arial", textAlign: "center",
          width: 880,
        },
        {
          type: "i-text",
          left: 100, top: 700, text: "for something amazing",
          fontSize: 32, fill: "#ffffff", fontFamily: "Arial",
          opacity: 0.8, textAlign: "center",
          width: 880,
        },
        {
          type: "triangle",
          left: 490, top: 800, width: 60, height: 40,
          fill: "#ffffff", angle: 180,
        },
      ],
      background: "#c026d3",
    }),
  },
  {
    id: "quote-card",
    name: "Quote Card",
    category: "Social",
    preview: "bg-gradient-to-br from-teal-500 to-emerald-600",
    canvasJSON: JSON.stringify({
      version: "6.0.0",
      objects: [
        {
          type: "i-text",
          left: 100, top: 100, text: "\u201C",
          fontSize: 200, fill: "#ffffff", fontFamily: "Georgia",
          opacity: 0.3,
        },
        {
          type: "i-text",
          left: 100, top: 350,
          text: "The only way to do\ngreat work is to love\nwhat you do.",
          fontSize: 52, fill: "#ffffff", fontFamily: "Georgia",
          fontStyle: "italic", lineHeight: 1.4,
        },
        {
          type: "i-text",
          left: 100, top: 650, text: "— Steve Jobs",
          fontSize: 28, fill: "#ffffff", fontFamily: "Arial",
          opacity: 0.7,
        },
      ],
      background: "#0d9488",
    }),
  },
  {
    id: "logo-placeholder",
    name: "Logo Design",
    category: "Brand",
    preview: "bg-neutral-900",
    canvasJSON: JSON.stringify({
      version: "6.0.0",
      objects: [
        {
          type: "circle",
          left: 340, top: 340, radius: 200,
          fill: "", stroke: "#6366f1", strokeWidth: 8,
        },
        {
          type: "i-text",
          left: 390, top: 440, text: "LOGO",
          fontSize: 80, fontWeight: "bold", fill: "#6366f1",
          fontFamily: "Arial",
        },
        {
          type: "i-text",
          left: 350, top: 540, text: "YOUR BRAND",
          fontSize: 24, fill: "#94a3b8", fontFamily: "Arial",
          charSpacing: 600,
        },
      ],
      background: "#0f172a",
    }),
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

// Online stock photo backgrounds from Lorem Picsum (free, no API key)
interface StockBG {
  id: string;
  author: string;
  download_url: string;
}

export function DesignTemplates({ open, onClose, canvasRef }: DesignTemplatesProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [stockBGs, setStockBGs] = useState<StockBG[]>([]);
  const [loadingBGs, setLoadingBGs] = useState(false);
  const [bgPage, setBgPage] = useState(1);

  // Image search
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [imageSearchResults, setImageSearchResults] = useState<string[]>([]);
  const [searchingImages, setSearchingImages] = useState(false);

  const loadStockBGs = useCallback(async (page: number) => {
    setLoadingBGs(true);
    try {
      const res = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=12`);
      const data: StockBG[] = await res.json();
      setStockBGs((prev) => (page === 1 ? data : [...prev, ...data]));
    } catch {
      console.error("Failed to load stock backgrounds");
    } finally {
      setLoadingBGs(false);
    }
  }, []);

  useEffect(() => {
    if (open && stockBGs.length === 0) {
      loadStockBGs(1);
    }
  }, [open, stockBGs.length, loadStockBGs]);

  const filtered = TEMPLATES.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "All" || t.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const applyTemplate = (canvasJSON: string) => {
    canvasRef.current?.loadJSON(canvasJSON);
    onClose();
  };

  const searchImagesOnline = useCallback(async (query: string) => {
    if (!query.trim()) { setImageSearchResults([]); return; }
    setSearchingImages(true);
    try {
      const keyword = encodeURIComponent(query.trim());
      const results: string[] = [];
      for (let i = 1; i <= 12; i++) {
        results.push(`https://loremflickr.com/800/600/${keyword}?lock=${i}`);
      }
      setImageSearchResults(results);
    } finally {
      setSearchingImages(false);
    }
  }, []);

  const applyStockBG = (photoUrl: string, author: string) => {
    canvasRef.current?.setBackgroundImage(photoUrl);
    canvasRef.current?.addText(author, {
      left: 20, top: 20, fontSize: 14, fill: "rgba(255,255,255,0.6)", fontFamily: "Arial",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Select a pre-designed template or use a stock photo background.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap">
          {[...CATEGORIES, "Stock Photos", "Search Photos"].map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "Stock Photos" && <Globe className="w-3 h-3 mr-1" />}
              {cat === "Search Photos" && <Search className="w-3 h-3 mr-1" />}
              {cat}
            </Badge>
          ))}
        </div>

        {/* Templates Grid */}
        <ScrollArea className="h-[50vh]">
          {activeCategory !== "Stock Photos" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
              {filtered.map((template) => (
                <button
                  key={template.id}
                  className="group relative rounded-lg overflow-hidden border hover:border-primary transition-all hover:shadow-lg"
                  onClick={() => applyTemplate(template.canvasJSON)}
                >
                  <div
                    className={`aspect-square ${template.preview} flex items-center justify-center`}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-sm bg-primary px-4 py-2 rounded-full">
                        Use Template
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-background">
                    <p className="text-sm font-medium truncate">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Show stock photos in "All" view too */}
          {activeCategory === "All" && stockBGs.length > 0 && (
            <div className="p-1 mt-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> Stock Photo Backgrounds
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stockBGs.slice(0, 6).map((photo) => (
                  <button
                    key={photo.id}
                    className="group relative rounded-lg overflow-hidden border hover:border-primary transition-all hover:shadow-lg aspect-video"
                    onClick={() => {
                      applyStockBG(photo.download_url, `Photo by ${photo.author}`);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.download_url.replace(/\/\d+\/\d+$/, "/400/225")}
                      alt={`Photo by ${photo.author}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-xs bg-primary px-3 py-1.5 rounded-full">
                        Use as Background
                      </span>
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">
                      {photo.author}
                    </span>
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCategory("Stock Photos")}
              >
                View All Stock Photos
              </Button>
            </div>
          )}

          {filtered.length === 0 && activeCategory !== "Stock Photos" && activeCategory !== "All" && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>No templates found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}

          {/* Search Photos */}
          {activeCategory === "Search Photos" && (
            <div className="space-y-3 p-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter keyword and press Search..."
                  value={imageSearchQuery}
                  onChange={(e) => setImageSearchQuery(e.target.value)}
                  className="text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => searchImagesOnline(imageSearchQuery)}
                  disabled={searchingImages || !imageSearchQuery.trim()}
                >
                  {searchingImages ? <Loader2 className="w-3 h-3 animate-spin" /> : "Search"}
                </Button>
              </div>
              {imageSearchResults.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Results for &quot;{imageSearchQuery}&quot; — click to add to canvas
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {imageSearchResults.map((url, idx) => (
                      <button
                        key={idx}
                        className="group relative rounded-lg overflow-hidden border hover:border-primary transition-all hover:shadow-lg aspect-video"
                        onClick={() => {
                          canvasRef.current?.addImage(url);
                          onClose();
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url.replace("/800/600/", "/400/225/")}
                          alt={`${imageSearchQuery} ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-xs bg-primary px-3 py-1.5 rounded-full">
                            Add to Canvas
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {imageSearchResults.length === 0 && !searchingImages && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Enter a keyword above and click Search to find photos.
                </p>
              )}
            </div>
          )}

          {/* Stock Photo Backgrounds */}
          {activeCategory === "Stock Photos" && (
            <div className="space-y-3 p-1">
              <p className="text-xs text-muted-foreground">
                Free high-quality photos from Lorem Picsum. Click to set as background.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stockBGs.map((photo) => (
                  <button
                    key={photo.id}
                    className="group relative rounded-lg overflow-hidden border hover:border-primary transition-all hover:shadow-lg aspect-video"
                    onClick={() => {
                      applyStockBG(photo.download_url, `Photo by ${photo.author}`);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.download_url.replace(/\/\d+\/\d+$/, "/400/225")}
                      alt={`Photo by ${photo.author}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-xs bg-primary px-3 py-1.5 rounded-full">
                        Use as Background
                      </span>
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">
                      {photo.author}
                    </span>
                  </button>
                ))}
              </div>
              {loadingBGs && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-xs text-muted-foreground">Loading photos...</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const next = bgPage + 1;
                  setBgPage(next);
                  loadStockBGs(next);
                }}
                disabled={loadingBGs}
              >
                Load More Photos
              </Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
