"use client";

import { useState } from "react";
import { Project } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addProject, updateProject, deleteProject } from "@/actions/portfolio";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Github, X, FolderGit2 } from "lucide-react";

interface ProjectsSectionProps {
  projects: Project[];
  onUpdate: (projects: Project[]) => void;
}

const emptyProject: Omit<Project, "id"> = {
  name: "",
  description: "",
  url: "",
  githubUrl: "",
  imageUrl: "",
  startDate: "",
  endDate: "",
  technologies: [],
  highlights: [],
};

export function ProjectsSection({ projects, onUpdate }: ProjectsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Project, "id">>(emptyProject);
  const [newTech, setNewTech] = useState("");
  const [newHighlight, setNewHighlight] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingId) {
        const updated = await updateProject({ ...formData, id: editingId });
        onUpdate(updated.projects);
        toast({ title: "Project updated successfully!" });
      } else {
        const updated = await addProject(formData);
        onUpdate(updated.projects);
        toast({ title: "Project added successfully!" });
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save project", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    try {
      const updated = await deleteProject(id);
      onUpdate(updated.projects);
      toast({ title: "Project deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    }
  };

  const handleEdit = (project: Project) => {
    setFormData(project);
    setEditingId(project.id);
    setIsOpen(true);
  };

  const resetForm = () => {
    setFormData(emptyProject);
    setEditingId(null);
    setNewTech("");
    setNewHighlight("");
  };

  const addTechnology = () => {
    if (!newTech.trim()) return;
    setFormData({ ...formData, technologies: [...formData.technologies, newTech.trim()] });
    setNewTech("");
  };

  const removeTechnology = (index: number) => {
    setFormData({ 
      ...formData, 
      technologies: formData.technologies.filter((_, i) => i !== index) 
    });
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setFormData({ ...formData, highlights: [...formData.highlights, newHighlight.trim()] });
    setNewHighlight("");
  };

  const removeHighlight = (index: number) => {
    setFormData({ 
      ...formData, 
      highlights: formData.highlights.filter((_, i) => i !== index) 
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Showcase your best projects</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Project" : "Add Project"}</DialogTitle>
              <DialogDescription>
                Add details about your project
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Awesome Project"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your project..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Live URL (optional)</Label>
                  <Input
                    id="url"
                    value={formData.url || ""}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://myproject.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub URL (optional)</Label>
                  <Input
                    id="githubUrl"
                    value={formData.githubUrl || ""}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/username/repo"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="month"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (optional)</Label>
                  <Input
                    id="endDate"
                    type="month"
                    value={formData.endDate || ""}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Technologies Used</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    placeholder="React, Node.js, etc."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTechnology())}
                  />
                  <Button type="button" variant="outline" onClick={addTechnology}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.technologies.map((tech, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {tech}
                        <button type="button" onClick={() => removeTechnology(i)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Key Highlights</Label>
                <div className="flex gap-2">
                  <Input
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    placeholder="Add a key feature or achievement..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())}
                  />
                  <Button type="button" variant="outline" onClick={addHighlight}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.highlights.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                    {formData.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="flex-1">{highlight}</span>
                        <button type="button" onClick={() => removeHighlight(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Update" : "Add"} Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No projects added yet. Click "Add Project" to get started.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderGit2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : "Present"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {project.url && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={project.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {project.githubUrl && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(project)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(project.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {project.description}
                </p>
                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {project.technologies.slice(0, 4).map((tech, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.technologies.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
