"use client";

import { useState } from "react";
import { Education } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addEducation, updateEducation, deleteEducation } from "@/actions/portfolio";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Loader2, GraduationCap, School } from "lucide-react";

interface EducationSectionProps {
  education: Education[];
  onUpdate: (education: Education[]) => void;
}

const emptyEducation: Omit<Education, "id"> = {
  degree: "",
  institution: "",
  field: "",
  startDate: "",
  endDate: "",
  current: false,
  gpa: "",
  description: "",
};

export function EducationSection({ education, onUpdate }: EducationSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Education, "id">>(emptyEducation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingId) {
        const updated = await updateEducation({ ...formData, id: editingId });
        onUpdate(updated.education);
        toast({ title: "Education updated successfully!" });
      } else {
        const updated = await addEducation(formData);
        onUpdate(updated.education);
        toast({ title: "Education added successfully!" });
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save education", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this education entry?")) return;
    
    try {
      const updated = await deleteEducation(id);
      onUpdate(updated.education);
      toast({ title: "Education deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete education", variant: "destructive" });
    }
  };

  const handleEdit = (edu: Education) => {
    setFormData(edu);
    setEditingId(edu.id);
    setIsOpen(true);
  };

  const resetForm = () => {
    setFormData(emptyEducation);
    setEditingId(null);
  };

  // Sort education by start date (most recent first)
  const sortedEducation = [...education].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Education</CardTitle>
          <CardDescription>Add your educational background</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Education" : "Add Education"}</DialogTitle>
              <DialogDescription>
                Add details about your education
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="degree">Degree</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="Bachelor's, Master's, PhD, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field">Field of Study</Label>
                <Input
                  id="field"
                  value={formData.field}
                  onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  placeholder="Computer Science"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="Stanford University"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <Label>Currently studying here</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpa">GPA (optional)</Label>
                <Input
                  id="gpa"
                  value={formData.gpa || ""}
                  onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                  placeholder="3.8 / 4.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notable achievements, activities, etc."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Update" : "Add"} Education
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sortedEducation.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No education added yet. Click "Add Education" to get started.
          </p>
        ) : (
          <div className="space-y-6">
            {sortedEducation.map((edu) => (
              <div key={edu.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{edu.degree}</h4>
                      <p className="text-muted-foreground">{edu.field}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <School className="h-4 w-4" />
                        <span>{edu.institution}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(edu.startDate)} - {edu.current ? "Present" : formatDate(edu.endDate!)}
                        {edu.gpa && <span className="ml-2">| GPA: {edu.gpa}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(edu)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(edu.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
