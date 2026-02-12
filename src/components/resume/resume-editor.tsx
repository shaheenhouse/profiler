"use client";

import { useState } from "react";
import type {
  ResumeData,
  PersonalInfo,
  Education,
  Experience,
  Skill,
  Certification,
  Project,
  Language,
  SocialLink,
} from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Plus,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  FolderGit2,
  Globe,
  Pencil,
} from "lucide-react";

interface ResumeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ResumeData;
  resumeName: string;
  onSave: (data: ResumeData) => void;
}

// ── Helpers ──
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ── Collapsible Section ──
function Section({
  title,
  icon: Icon,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="font-semibold text-sm flex-1">{title}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="text-[10px]">
            {count}
          </Badge>
        )}
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-3 bg-background">{children}</div>}
    </div>
  );
}

// ── Item Card (for list items with remove + edit toggle) ──
function ItemCard({
  title,
  subtitle,
  onRemove,
  children,
}: {
  title: string;
  subtitle?: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="border rounded-md p-3 space-y-2 bg-card">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditing(!editing)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {editing && <div className="space-y-2 pt-2 border-t">{children}</div>}
    </div>
  );
}

// ── Tiny field wrapper ──
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN EDITOR
// ═══════════════════════════════════════════════
export function ResumeEditor({ open, onOpenChange, data: initialData, resumeName, onSave }: ResumeEditorProps) {
  const [d, setD] = useState<ResumeData>(JSON.parse(JSON.stringify(initialData)));

  // Update helpers
  const setPI = (patch: Partial<PersonalInfo>) => setD((p) => ({ ...p, personalInfo: { ...p.personalInfo, ...patch } }));
  const setEdu = (education: Education[]) => setD((p) => ({ ...p, education }));
  const setExp = (experience: Experience[]) => setD((p) => ({ ...p, experience }));
  const setSkills = (skills: Skill[]) => setD((p) => ({ ...p, skills }));
  const setCerts = (certifications: Certification[]) => setD((p) => ({ ...p, certifications }));
  const setProjs = (projects: Project[]) => setD((p) => ({ ...p, projects }));
  const setLangs = (languages: Language[]) => setD((p) => ({ ...p, languages }));

  // Update item in array
  const updateItem = <T extends { id: string }>(arr: T[], id: string, patch: Partial<T>): T[] =>
    arr.map((item) => (item.id === id ? { ...item, ...patch } : item));

  const handleSave = () => {
    onSave(d);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] w-[95vw] max-h-[95vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold">Edit Resume Data</h2>
            <p className="text-xs text-muted-foreground">{resumeName} — Customize what appears in this resume</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} className="gap-2" size="sm">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(95vh-60px)]">
          <div className="p-4 space-y-3">
            {/* ═══ PERSONAL INFO ═══ */}
            <Section title="Personal Info" icon={User} defaultOpen>
              <div className="grid grid-cols-2 gap-3">
                <F label="Full Name">
                  <Input value={d.personalInfo.fullName} onChange={(e) => setPI({ fullName: e.target.value })} className="h-8 text-sm" />
                </F>
                <F label="Professional Title">
                  <Input value={d.personalInfo.title} onChange={(e) => setPI({ title: e.target.value })} className="h-8 text-sm" />
                </F>
                <F label="Email">
                  <Input value={d.personalInfo.email} onChange={(e) => setPI({ email: e.target.value })} className="h-8 text-sm" />
                </F>
                <F label="Phone">
                  <Input value={d.personalInfo.phone || ""} onChange={(e) => setPI({ phone: e.target.value })} className="h-8 text-sm" />
                </F>
                <F label="Location">
                  <Input value={d.personalInfo.location} onChange={(e) => setPI({ location: e.target.value })} className="h-8 text-sm" />
                </F>
              </div>
              <F label="Professional Summary / Bio">
                <Textarea value={d.personalInfo.bio} onChange={(e) => setPI({ bio: e.target.value })} rows={3} className="text-sm" />
              </F>
              {/* Social Links */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Social Links</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs gap-1"
                    onClick={() =>
                      setPI({
                        socialLinks: [
                          ...d.personalInfo.socialLinks,
                          { id: uid(), platform: "website", url: "", label: "" },
                        ],
                      })
                    }
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
                {d.personalInfo.socialLinks.map((link) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <Select
                      value={link.platform}
                      onValueChange={(v) =>
                        setPI({
                          socialLinks: d.personalInfo.socialLinks.map((l) =>
                            l.id === link.id ? { ...l, platform: v as SocialLink["platform"] } : l
                          ),
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["github", "linkedin", "twitter", "website", "behance", "dribbble", "youtube", "instagram", "other"].map((p) => (
                          <SelectItem key={p} value={p} className="text-xs">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={link.url}
                      onChange={(e) =>
                        setPI({
                          socialLinks: d.personalInfo.socialLinks.map((l) =>
                            l.id === link.id ? { ...l, url: e.target.value } : l
                          ),
                        })
                      }
                      placeholder="URL"
                      className="h-8 text-xs flex-1"
                    />
                    <Input
                      value={link.label || ""}
                      onChange={(e) =>
                        setPI({
                          socialLinks: d.personalInfo.socialLinks.map((l) =>
                            l.id === link.id ? { ...l, label: e.target.value } : l
                          ),
                        })
                      }
                      placeholder="Label"
                      className="h-8 text-xs w-[100px]"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-destructive"
                      onClick={() =>
                        setPI({ socialLinks: d.personalInfo.socialLinks.filter((l) => l.id !== link.id) })
                      }
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </Section>

            {/* ═══ SKILLS ═══ */}
            <Section title="Skills" icon={Code} count={d.skills.length}>
              <div className="flex flex-wrap gap-1.5">
                {d.skills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="secondary"
                    className="gap-1 pr-1 text-xs"
                  >
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-muted-foreground">({skill.category})</span>
                    <button
                      type="button"
                      onClick={() => setSkills(d.skills.filter((s) => s.id !== skill.id))}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <AddSkillForm onAdd={(skill) => setSkills([...d.skills, { ...skill, id: uid() }])} />
            </Section>

            {/* ═══ EXPERIENCE ═══ */}
            <Section title="Work Experience" icon={Briefcase} count={d.experience.length}>
              {d.experience.map((exp) => (
                <ItemCard
                  key={exp.id}
                  title={`${exp.title} — ${exp.company}`}
                  subtitle={`${exp.location} · ${exp.startDate ? new Date(exp.startDate).getFullYear() : ""} – ${exp.current ? "Present" : exp.endDate ? new Date(exp.endDate).getFullYear() : ""}`}
                  onRemove={() => setExp(d.experience.filter((e) => e.id !== exp.id))}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <F label="Job Title">
                      <Input
                        value={exp.title}
                        onChange={(e) => setExp(updateItem(d.experience, exp.id, { title: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <F label="Company">
                      <Input
                        value={exp.company}
                        onChange={(e) => setExp(updateItem(d.experience, exp.id, { company: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <F label="Location">
                      <Input
                        value={exp.location}
                        onChange={(e) => setExp(updateItem(d.experience, exp.id, { location: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <F label="Type">
                      <Select
                        value={exp.locationType}
                        onValueChange={(v) =>
                          setExp(updateItem(d.experience, exp.id, { locationType: v as Experience["locationType"] }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="onsite">Onsite</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </F>
                    <F label="Start Date">
                      <Input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => setExp(updateItem(d.experience, exp.id, { startDate: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">End Date</Label>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={exp.current}
                            onCheckedChange={(v) => setExp(updateItem(d.experience, exp.id, { current: v }))}
                            className="scale-75"
                          />
                          <span className="text-[10px] text-muted-foreground">Current</span>
                        </div>
                      </div>
                      {!exp.current && (
                        <Input
                          type="date"
                          value={exp.endDate || ""}
                          onChange={(e) => setExp(updateItem(d.experience, exp.id, { endDate: e.target.value }))}
                          className="h-8 text-xs"
                        />
                      )}
                    </div>
                  </div>
                  <F label="Technologies (comma-separated)">
                    <Input
                      value={exp.technologies.join(", ")}
                      onChange={(e) =>
                        setExp(
                          updateItem(d.experience, exp.id, {
                            technologies: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                          })
                        )
                      }
                      className="h-8 text-xs"
                    />
                  </F>
                  <F label="Responsibilities (one per line)">
                    <Textarea
                      value={exp.responsibilities.join("\n")}
                      onChange={(e) =>
                        setExp(
                          updateItem(d.experience, exp.id, {
                            responsibilities: e.target.value.split("\n").filter((r) => r.trim()),
                          })
                        )
                      }
                      rows={3}
                      className="text-xs"
                    />
                  </F>
                </ItemCard>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1 text-xs"
                onClick={() =>
                  setExp([
                    ...d.experience,
                    {
                      id: uid(),
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
                    },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add Experience
              </Button>
            </Section>

            {/* ═══ EDUCATION ═══ */}
            <Section title="Education" icon={GraduationCap} count={d.education.length}>
              {d.education.map((edu) => (
                <ItemCard
                  key={edu.id}
                  title={`${edu.degree} in ${edu.field}`}
                  subtitle={edu.institution}
                  onRemove={() => setEdu(d.education.filter((e) => e.id !== edu.id))}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <F label="Degree">
                      <Input
                        value={edu.degree}
                        onChange={(e) => setEdu(updateItem(d.education, edu.id, { degree: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <F label="Field of Study">
                      <Input
                        value={edu.field}
                        onChange={(e) => setEdu(updateItem(d.education, edu.id, { field: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <F label="Institution">
                      <Input
                        value={edu.institution}
                        onChange={(e) => setEdu(updateItem(d.education, edu.id, { institution: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <F label="GPA">
                      <Input
                        value={edu.gpa || ""}
                        onChange={(e) => setEdu(updateItem(d.education, edu.id, { gpa: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <F label="Start Date">
                      <Input
                        type="date"
                        value={edu.startDate}
                        onChange={(e) => setEdu(updateItem(d.education, edu.id, { startDate: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">End Date</Label>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={edu.current}
                            onCheckedChange={(v) => setEdu(updateItem(d.education, edu.id, { current: v }))}
                            className="scale-75"
                          />
                          <span className="text-[10px] text-muted-foreground">Current</span>
                        </div>
                      </div>
                      {!edu.current && (
                        <Input
                          type="date"
                          value={edu.endDate || ""}
                          onChange={(e) => setEdu(updateItem(d.education, edu.id, { endDate: e.target.value }))}
                          className="h-8 text-xs"
                        />
                      )}
                    </div>
                  </div>
                </ItemCard>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1 text-xs"
                onClick={() =>
                  setEdu([
                    ...d.education,
                    { id: uid(), degree: "", institution: "", field: "", startDate: "", current: false },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add Education
              </Button>
            </Section>

            {/* ═══ CERTIFICATIONS ═══ */}
            <Section title="Certifications" icon={Award} count={d.certifications.length}>
              {d.certifications.map((cert) => (
                <ItemCard
                  key={cert.id}
                  title={cert.name}
                  subtitle={`${cert.issuer} · ${cert.issueDate ? new Date(cert.issueDate).getFullYear() : ""}`}
                  onRemove={() => setCerts(d.certifications.filter((c) => c.id !== cert.id))}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <F label="Name">
                      <Input
                        value={cert.name}
                        onChange={(e) => setCerts(updateItem(d.certifications, cert.id, { name: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <F label="Issuer">
                      <Input
                        value={cert.issuer}
                        onChange={(e) => setCerts(updateItem(d.certifications, cert.id, { issuer: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <F label="Issue Date">
                      <Input
                        type="date"
                        value={cert.issueDate}
                        onChange={(e) => setCerts(updateItem(d.certifications, cert.id, { issueDate: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <F label="Credential URL">
                      <Input
                        value={cert.credentialUrl || ""}
                        onChange={(e) => setCerts(updateItem(d.certifications, cert.id, { credentialUrl: e.target.value }))}
                        className="h-8 text-xs"
                        placeholder="https://..."
                      />
                    </F>
                  </div>
                </ItemCard>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1 text-xs"
                onClick={() =>
                  setCerts([
                    ...d.certifications,
                    { id: uid(), name: "", issuer: "", issueDate: "" },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add Certification
              </Button>
            </Section>

            {/* ═══ PROJECTS ═══ */}
            <Section title="Projects" icon={FolderGit2} count={d.projects.length}>
              {d.projects.map((proj) => (
                <ItemCard
                  key={proj.id}
                  title={proj.name}
                  subtitle={proj.description?.substring(0, 80)}
                  onRemove={() => setProjs(d.projects.filter((p) => p.id !== proj.id))}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <F label="Project Name">
                      <Input
                        value={proj.name}
                        onChange={(e) => setProjs(updateItem(d.projects, proj.id, { name: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                    <F label="URL">
                      <Input
                        value={proj.url || ""}
                        onChange={(e) => setProjs(updateItem(d.projects, proj.id, { url: e.target.value }))}
                        className="h-8 text-xs"
                        placeholder="https://..."
                      />
                    </F>
                    <F label="GitHub URL">
                      <Input
                        value={proj.githubUrl || ""}
                        onChange={(e) => setProjs(updateItem(d.projects, proj.id, { githubUrl: e.target.value }))}
                        className="h-8 text-xs"
                        placeholder="https://github.com/..."
                      />
                    </F>
                    <F label="Start Date">
                      <Input
                        type="date"
                        value={proj.startDate}
                        onChange={(e) => setProjs(updateItem(d.projects, proj.id, { startDate: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </F>
                  </div>
                  <F label="Description">
                    <Textarea
                      value={proj.description}
                      onChange={(e) => setProjs(updateItem(d.projects, proj.id, { description: e.target.value }))}
                      rows={2}
                      className="text-xs"
                    />
                  </F>
                  <F label="Technologies (comma-separated)">
                    <Input
                      value={proj.technologies.join(", ")}
                      onChange={(e) =>
                        setProjs(
                          updateItem(d.projects, proj.id, {
                            technologies: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                          })
                        )
                      }
                      className="h-8 text-xs"
                    />
                  </F>
                </ItemCard>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1 text-xs"
                onClick={() =>
                  setProjs([
                    ...d.projects,
                    {
                      id: uid(),
                      name: "",
                      description: "",
                      startDate: "",
                      technologies: [],
                      highlights: [],
                    },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add Project
              </Button>
            </Section>

            {/* ═══ LANGUAGES ═══ */}
            <Section title="Languages" icon={Globe} count={d.languages.length}>
              {d.languages.map((lang) => (
                <div key={lang.id} className="flex items-center gap-2">
                  <Input
                    value={lang.name}
                    onChange={(e) => setLangs(updateItem(d.languages, lang.id, { name: e.target.value }))}
                    placeholder="Language"
                    className="h-8 text-xs flex-1"
                  />
                  <Select
                    value={lang.proficiency}
                    onValueChange={(v) =>
                      setLangs(updateItem(d.languages, lang.id, { proficiency: v as Language["proficiency"] }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="native">Native</SelectItem>
                      <SelectItem value="fluent">Fluent</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-destructive"
                    onClick={() => setLangs(d.languages.filter((l) => l.id !== lang.id))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1 text-xs"
                onClick={() =>
                  setLangs([...d.languages, { id: uid(), name: "", proficiency: "professional" }])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add Language
              </Button>
            </Section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Inline Add Skill Form ──
function AddSkillForm({ onAdd }: { onAdd: (s: Omit<Skill, "id">) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Programming Languages");
  const [level, setLevel] = useState<Skill["level"]>("proficient");

  const categories = [
    "Programming Languages",
    "Frameworks & Libraries",
    "Databases",
    "Cloud & DevOps",
    "Tools & Software",
    "Backend & APIs",
    "Frontend & Tools",
    "AI / Integrations",
    "Leadership",
    "Soft Skills",
    "Other",
  ];

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), category, level });
    setName("");
  };

  return (
    <div className="flex flex-wrap items-end gap-2 pt-2 border-t">
      <F label="Skill Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. React.js" className="h-8 text-xs w-[140px]" />
      </F>
      <F label="Category">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="text-xs">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </F>
      <F label="Level">
        <Select value={level} onValueChange={(v) => setLevel(v as Skill["level"])}>
          <SelectTrigger className="h-8 text-xs w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expert">Expert</SelectItem>
            <SelectItem value="proficient">Proficient</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
          </SelectContent>
        </Select>
      </F>
      <Button size="sm" variant="secondary" className="h-8 text-xs gap-1" onClick={handleAdd}>
        <Plus className="h-3 w-3" /> Add
      </Button>
    </div>
  );
}
