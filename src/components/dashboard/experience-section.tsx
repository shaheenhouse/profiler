"use client";

import { useState } from "react";
import { Experience } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addExperience, updateExperience, deleteExperience } from "@/actions/portfolio";
import { toast } from "@/components/ui/use-toast";
import { formatDate, calculateDuration } from "@/lib/utils";
import { Plus, Pencil, Trash2, Loader2, MapPin, Building, X } from "lucide-react";

interface ExperienceSectionProps {
  experiences: Experience[];
  onUpdate: (experiences: Experience[]) => void;
}

const emptyExperience: Omit<Experience, "id"> = {
  title: "",
  company: "",
  location: "",
  locationType: "onsite",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
  technologies: [],
  responsibilities: [],
};

export function ExperienceSection({ experiences, onUpdate }: ExperienceSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Experience, "id">>(emptyExperience);
  const [newTech, setNewTech] = useState("");
  const [newResponsibility, setNewResponsibility] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingId) {
        const updated = await updateExperience({ ...formData, id: editingId });
        onUpdate(updated.experience);
        toast({ title: "Experience updated successfully!" });
      } else {
        const updated = await addExperience(formData);
        onUpdate(updated.experience);
        toast({ title: "Experience added successfully!" });
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save experience", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this experience?")) return;
    
    try {
      const updated = await deleteExperience(id);
      onUpdate(updated.experience);
      toast({ title: "Experience deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete experience", variant: "destructive" });
    }
  };

  const handleEdit = (exp: Experience) => {
    setFormData(exp);
    setEditingId(exp.id);
    setIsOpen(true);
  };

  const resetForm = () => {
    setFormData(emptyExperience);
    setEditingId(null);
    setNewTech("");
    setNewResponsibility("");
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

  const addResponsibility = () => {
    if (!newResponsibility.trim()) return;
    setFormData({ ...formData, responsibilities: [...formData.responsibilities, newResponsibility.trim()] });
    setNewResponsibility("");
  };

  const removeResponsibility = (index: number) => {
    setFormData({ 
      ...formData, 
      responsibilities: formData.responsibilities.filter((_, i) => i !== index) 
    });
  };

  // Sort experiences by start date (most recent first)
  const sortedExperiences = [...experiences].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Work Experience</CardTitle>
          <CardDescription>Add your professional experience</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Experience" : "Add Experience"}</DialogTitle>
              <DialogDescription>
                Add details about your work experience
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Senior Software Engineer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Google"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="San Francisco, CA"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location Type</Label>
                  <Select
                    value={formData.locationType}
                    onValueChange={(value) => setFormData({ ...formData, locationType: value as Experience["locationType"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="month"
                    value={formData.endDate || ""}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={formData.current}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.current}
                  onCheckedChange={(checked) => setFormData({ ...formData, current: checked, endDate: checked ? "" : formData.endDate })}
                />
                <Label>I currently work here</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your role and achievements..."
                  rows={3}
                />
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
                <Label>Key Responsibilities</Label>
                <div className="flex gap-2">
                  <Input
                    value={newResponsibility}
                    onChange={(e) => setNewResponsibility(e.target.value)}
                    placeholder="Add a responsibility..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addResponsibility())}
                  />
                  <Button type="button" variant="outline" onClick={addResponsibility}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.responsibilities.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                    {formData.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="flex-1">{resp}</span>
                        <button type="button" onClick={() => removeResponsibility(i)} className="text-muted-foreground hover:text-destructive">
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
                  {editingId ? "Update" : "Add"} Experience
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sortedExperiences.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No experience added yet. Click "Add Experience" to get started.
          </p>
        ) : (
          <div className="space-y-6">
            {sortedExperiences.map((exp) => (
              <div key={exp.id} className="relative pl-6 pb-6 border-l-2 border-primary/30 last:pb-0">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary" />
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-lg">{exp.title}</h4>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{exp.company}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{exp.location}</span>
                      <Badge variant="outline" className="text-xs">
                        {exp.locationType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate!)}
                      <span className="ml-2">({calculateDuration(exp.startDate, exp.current ? undefined : exp.endDate)})</span>
                    </p>
                    {exp.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {exp.technologies.map((tech, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(exp)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(exp.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
