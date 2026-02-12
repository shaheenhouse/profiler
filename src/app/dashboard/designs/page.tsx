"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  Palette,
  Clock,
  FileImage,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { DESIGN_SIZES } from "@/types/design";
import type { Design } from "@/types/design";

export default function DesignsPage() {
  const router = useRouter();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("Untitled Design");
  const [selectedSize, setSelectedSize] = useState(DESIGN_SIZES[0]);
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      const res = await fetch("/api/designs");
      const data = await res.json();
      setDesigns(data.designs || []);
    } catch {
      toast({ title: "Failed to load designs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const w = selectedSize.name === "Custom" ? customWidth : selectedSize.width;
      const h = selectedSize.name === "Custom" ? customHeight : selectedSize.height;

      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, width: w, height: h }),
      });

      const data = await res.json();
      if (data.design) {
        router.push(`/dashboard/design/${data.design.id}`);
      }
    } catch {
      toast({ title: "Failed to create design", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });
      if (res.ok) {
        toast({ title: "Design duplicated!" });
        fetchDesigns();
      }
    } catch {
      toast({ title: "Failed to duplicate", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this design?")) return;
    try {
      await fetch(`/api/designs/${id}`, { method: "DELETE" });
      toast({ title: "Design deleted" });
      fetchDesigns();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const filtered = designs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Palette className="w-8 h-8 text-primary" />
            My Designs
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, edit, and export beautiful designs
          </p>
        </div>

        <Button
          onClick={() => setShowNewDialog(true)}
          size="lg"
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Design
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-6"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search designs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </motion.div>

      {/* Designs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <FileImage className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {designs.length === 0 ? "No designs yet" : "No matching designs"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {designs.length === 0
              ? "Create your first design to get started!"
              : "Try a different search term"}
          </p>
          {designs.length === 0 && (
            <Button onClick={() => setShowNewDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Design
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((design, index) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/30 cursor-pointer">
                  {/* Thumbnail */}
                  <div
                    className="aspect-square bg-muted relative overflow-hidden"
                    onClick={() => router.push(`/dashboard/design/${design.id}`)}
                  >
                    {design.thumbnail ? (
                      <img
                        src={design.thumbnail}
                        alt={design.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Palette className="w-12 h-12 text-primary/30" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <motion.div
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Badge className="bg-primary text-white gap-1 px-4 py-2">
                          <Pencil className="w-3 h-3" />
                          Edit Design
                        </Badge>
                      </motion.div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{design.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(design.updatedAt)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {design.width} x {design.height}px
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/design/${design.id}`)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(design.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(design.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* New Design Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Design</DialogTitle>
            <DialogDescription>
              Choose a name and size for your new design.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="designName">Design Name</Label>
              <Input
                id="designName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My awesome design"
              />
            </div>

            <div className="space-y-2">
              <Label>Canvas Size</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DESIGN_SIZES.map((size) => (
                  <Button
                    key={size.name}
                    variant={selectedSize.name === size.name ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col items-start"
                    onClick={() => setSelectedSize(size)}
                  >
                    <span className="font-medium text-sm">{size.name}</span>
                    <span className="text-xs opacity-70">
                      {size.width} x {size.height}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {selectedSize.name === "Custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Width (px)</Label>
                  <Input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 100)}
                    min={100}
                    max={5000}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (px)</Label>
                  <Input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 100)}
                    min={100}
                    max={5000}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
