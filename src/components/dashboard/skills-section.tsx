"use client";

import { useState } from "react";
import { Skill, Role } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addSkill, deleteSkill, addRole, deleteRole } from "@/actions/portfolio";
import { toast } from "@/components/ui/use-toast";
import { Plus, X } from "lucide-react";

interface SkillsSectionProps {
  skills: Skill[];
  roles: Role[];
  onUpdateSkills: (skills: Skill[]) => void;
  onUpdateRoles: (roles: Role[]) => void;
}

const skillCategories = [
  "Programming Languages",
  "Frameworks & Libraries",
  "Databases",
  "Cloud & DevOps",
  "Tools & Software",
  "Soft Skills",
  "Other",
];

const levelVariants: Record<string, "expert" | "proficient" | "intermediate"> = {
  expert: "expert",
  proficient: "proficient",
  intermediate: "intermediate",
  beginner: "intermediate",
};

export function SkillsSection({ skills, roles, onUpdateSkills, onUpdateRoles }: SkillsSectionProps) {
  const [newSkill, setNewSkill] = useState({ name: "", level: "proficient" as Skill["level"], category: "Programming Languages" });
  const [newRole, setNewRole] = useState({ title: "", level: "expert" as Role["level"] });

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return;
    
    try {
      const updated = await addSkill(newSkill);
      onUpdateSkills(updated.skills);
      setNewSkill({ name: "", level: "proficient", category: "Programming Languages" });
      toast({ title: "Skill added!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add skill", variant: "destructive" });
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const updated = await deleteSkill(id);
      onUpdateSkills(updated.skills);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete skill", variant: "destructive" });
    }
  };

  const handleAddRole = async () => {
    if (!newRole.title.trim()) return;
    
    try {
      const updated = await addRole(newRole);
      onUpdateRoles(updated.roles);
      setNewRole({ title: "", level: "expert" });
      toast({ title: "Role added!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add role", variant: "destructive" });
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const updated = await deleteRole(id);
      onUpdateRoles(updated.roles);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete role", variant: "destructive" });
    }
  };

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="space-y-6">
      {/* Roles Section */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Roles</CardTitle>
          <CardDescription>Add your professional roles and expertise areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newRole.title}
              onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
              placeholder="Full Stack Developer, DevOps Engineer, etc."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
            />
            <Select
              value={newRole.level}
              onValueChange={(value) => setNewRole({ ...newRole, level: value as Role["level"] })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expert">Expert</SelectItem>
                <SelectItem value="proficient">Proficient</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddRole}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge
                  key={role.id}
                  variant={levelVariants[role.level]}
                  className="py-2 px-3 text-sm flex items-center gap-2"
                >
                  <span>{role.title}</span>
                  <span className="text-xs opacity-70">({role.level})</span>
                  <button onClick={() => handleDeleteRole(role.id)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Skills</CardTitle>
          <CardDescription>Add your technical skills by category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              placeholder="React, Python, Docker, etc."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
            />
            <Select
              value={newSkill.category}
              onValueChange={(value) => setNewSkill({ ...newSkill, category: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {skillCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={newSkill.level}
              onValueChange={(value) => setNewSkill({ ...newSkill, level: value as Skill["level"] })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expert">Expert</SelectItem>
                <SelectItem value="proficient">Proficient</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {Object.keys(skillsByCategory).length > 0 ? (
            <div className="space-y-4 mt-4">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {categorySkills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant={levelVariants[skill.level]}
                        className="py-1.5 px-3"
                      >
                        {skill.name}
                        <button onClick={() => handleDeleteSkill(skill.id)} className="ml-2">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No skills added yet. Start adding your technical skills.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
