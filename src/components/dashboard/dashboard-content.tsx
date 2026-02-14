"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Portfolio, User, Resume, ResumeData } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Copy, 
  Check,
  User as UserIcon,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  FolderGit2,
  FileText,
  Palette,
  Pencil,
  Lock,
  Star,
} from "lucide-react";
import Link from "next/link";
import { togglePortfolioVisibility } from "@/actions/portfolio";
import { toast } from "@/components/ui/use-toast";
import { PersonalInfoForm } from "@/components/dashboard/personal-info-form";
import { ExperienceSection } from "@/components/dashboard/experience-section";
import { EducationSection } from "@/components/dashboard/education-section";
import { SkillsSection } from "@/components/dashboard/skills-section";
import { ProjectsSection } from "@/components/dashboard/projects-section";
import { CertificationsSection } from "@/components/dashboard/certifications-section";
import { ResumeModal } from "@/components/resume/resume-modal";
import { ResumeEditor } from "@/components/resume/resume-editor";

interface DashboardContentProps {
  portfolio: Portfolio;
  user: User;
}

// ── Helper: extract profile data into ResumeData shape ──
function portfolioToResumeData(portfolio: Portfolio): ResumeData {
  return {
    personalInfo: JSON.parse(JSON.stringify(portfolio.personalInfo)),
    education: JSON.parse(JSON.stringify(portfolio.education)),
    experience: JSON.parse(JSON.stringify(portfolio.experience)),
    skills: JSON.parse(JSON.stringify(portfolio.skills)),
    certifications: JSON.parse(JSON.stringify(portfolio.certifications)),
    projects: JSON.parse(JSON.stringify(portfolio.projects)),
    languages: JSON.parse(JSON.stringify(portfolio.languages || [])),
  };
}

// ── Helper: build a Portfolio-like object from a Resume's data ──
function resumeToPortfolio(portfolio: Portfolio, resume: Resume): Portfolio {
  if (resume.isStandard || !resume.data) {
    return portfolio; // standard resume uses profile data directly
  }
  return {
    ...portfolio,
    personalInfo: resume.data.personalInfo,
    education: resume.data.education,
    experience: resume.data.experience,
    skills: resume.data.skills,
    certifications: resume.data.certifications,
    projects: resume.data.projects,
    languages: resume.data.languages,
  };
}

export function DashboardContent({ portfolio: initialPortfolio, user }: DashboardContentProps) {
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null);
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);

  // Ensure resumes array with backwards compat (add isStandard if missing)
  const resumes: Resume[] = (portfolio.resumes || []).map((r) => ({
    ...r,
    isStandard: r.isStandard !== undefined ? r.isStandard : true, // old resumes default to standard
  }));
  if (resumes.length === 0) {
    resumes.push({
      id: "1",
      name: "My Resume (Profile)",
      templateId: "classic",
      isActive: true,
      isStandard: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const activeResume = resumes.find((r) => r.isActive) || resumes[0];

  // ── Resume CRUD ──
  const updateResumes = (updated: Resume[]) => {
    setPortfolio({ ...portfolio, resumes: updated });
  };

  const handleAddResume = () => {
    // New custom resume: clones data from profile
    const newResume: Resume = {
      id: Date.now().toString(),
      name: `Resume ${resumes.length + 1}`,
      templateId: "classic",
      isActive: false,
      isStandard: false,
      data: portfolioToResumeData(portfolio),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateResumes([...resumes, newResume]);
    toast({ title: "New resume created", description: "Data copied from your profile. Click Edit to customize." });
  };

  const handleSetActiveResume = (id: string) => {
    updateResumes(resumes.map((r) => ({ ...r, isActive: r.id === id })));
  };

  const handleDeleteResume = (id: string) => {
    if (resumes.length <= 1) return;
    const target = resumes.find((r) => r.id === id);
    if (target?.isStandard) {
      toast({ title: "Cannot delete", description: "The standard profile resume cannot be deleted.", variant: "destructive" });
      return;
    }
    let updated = resumes.filter((r) => r.id !== id);
    if (!updated.some((r) => r.isActive)) {
      updated = updated.map((r, i) => ({ ...r, isActive: i === 0 }));
    }
    updateResumes(updated);
  };

  const handleResumeTemplateChange = (id: string, templateId: string) => {
    updateResumes(
      resumes.map((r) =>
        r.id === id ? { ...r, templateId: templateId as Resume["templateId"], updatedAt: new Date().toISOString() } : r
      )
    );
  };

  const handleResumeNameChange = (id: string, name: string) => {
    updateResumes(
      resumes.map((r) => (r.id === id ? { ...r, name, updatedAt: new Date().toISOString() } : r))
    );
  };

  const handleResumeDataSave = (id: string, data: ResumeData) => {
    updateResumes(
      resumes.map((r) => (r.id === id ? { ...r, data, updatedAt: new Date().toISOString() } : r))
    );
    toast({ title: "Resume data saved" });
  };

  const handleSyncFromProfile = (id: string) => {
    updateResumes(
      resumes.map((r) =>
        r.id === id ? { ...r, data: portfolioToResumeData(portfolio), updatedAt: new Date().toISOString() } : r
      )
    );
    toast({ title: "Resume synced", description: "Data refreshed from your profile." });
  };

  // ── Preview logic ──
  const previewResume = previewResumeId ? resumes.find((r) => r.id === previewResumeId) : activeResume;
  const previewPortfolio = previewResume ? resumeToPortfolio(portfolio, previewResume) : portfolio;

  // ── Editing resume ──
  const editingResume = editingResumeId ? resumes.find((r) => r.id === editingResumeId) : null;
  const editingResumeData = editingResume
    ? editingResume.isStandard
      ? portfolioToResumeData(portfolio)
      : editingResume.data || portfolioToResumeData(portfolio)
    : null;

  // ── Portfolio URL - use state to avoid hydration mismatch ──
  const [portfolioUrl, setPortfolioUrl] = useState(`/p/${portfolio.slug}`);
  
  useEffect(() => {
    // Set the full URL only on the client side
    setPortfolioUrl(`${window.location.origin}/p/${portfolio.slug}`);
  }, [portfolio.slug]);

  const handleCopyUrl = async () => {
    // Always use the full URL when copying
    const fullUrl = `${window.location.origin}/p/${portfolio.slug}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast({ title: "URL copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleVisibility = async () => {
    setIsToggling(true);
    try {
      const updated = await togglePortfolioVisibility();
      setPortfolio(updated);
      toast({
        title: updated.isPublic ? "Portfolio is now public" : "Portfolio is now private",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update visibility",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: UserIcon },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "skills", label: "Skills & Roles", icon: Code },
    { id: "projects", label: "Projects", icon: FolderGit2 },
    { id: "certifications", label: "Certifications", icon: Award },
    { id: "resumes", label: "Resumes", icon: FileText },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your portfolio and resume</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/designs">
                <Palette className="mr-2 h-4 w-4" />
                Design Studio
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPreviewResumeId(null);
                setShowResume(true);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              View Resume
            </Button>
            <Button
              variant={portfolio.isPublic ? "default" : "secondary"}
              onClick={handleToggleVisibility}
              disabled={isToggling}
            >
              {portfolio.isPublic ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Public
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Private
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Portfolio URL Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Your Portfolio URL</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm md:text-base font-mono bg-background px-3 py-1.5 rounded-md border flex-1 truncate">
                    {portfolioUrl}
                  </code>
                  <Button size="icon" variant="ghost" onClick={handleCopyUrl}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  {portfolio.isPublic && (
                    <Button size="icon" variant="ghost" asChild>
                      <a href={portfolioUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <Badge variant={portfolio.isPublic ? "success" : "secondary"}>
                {portfolio.isPublic ? "Live" : "Draft"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg border"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="personal" className="mt-6">
            <PersonalInfoForm portfolio={portfolio} onUpdate={setPortfolio} />
          </TabsContent>

          <TabsContent value="experience" className="mt-6">
            <ExperienceSection
              experiences={portfolio.experience}
              onUpdate={(experience) => setPortfolio({ ...portfolio, experience })}
            />
          </TabsContent>

          <TabsContent value="education" className="mt-6">
            <EducationSection
              education={portfolio.education}
              onUpdate={(education) => setPortfolio({ ...portfolio, education })}
            />
          </TabsContent>

          <TabsContent value="skills" className="mt-6">
            <SkillsSection
              skills={portfolio.skills}
              roles={portfolio.roles}
              onUpdateSkills={(skills) => setPortfolio({ ...portfolio, skills })}
              onUpdateRoles={(roles) => setPortfolio({ ...portfolio, roles })}
            />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <ProjectsSection
              projects={portfolio.projects}
              onUpdate={(projects) => setPortfolio({ ...portfolio, projects })}
            />
          </TabsContent>

          <TabsContent value="certifications" className="mt-6">
            <CertificationsSection
              certifications={portfolio.certifications}
              onUpdate={(certifications) => setPortfolio({ ...portfolio, certifications })}
            />
          </TabsContent>

          {/* ═══ RESUMES TAB ═══ */}
          <TabsContent value="resumes" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Resumes</CardTitle>
                    <CardDescription>
                      The <strong>standard resume</strong> always uses your profile data. Custom resumes have their own editable data (initially copied from profile).
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddResume} size="sm">
                    + New Resume
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border transition-all ${
                      resume.isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {/* Left side — info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          value={resume.name}
                          onChange={(e) => handleResumeNameChange(resume.id, e.target.value)}
                          className="font-semibold text-sm bg-transparent border-none outline-none focus:underline max-w-[200px]"
                        />
                        {resume.isActive && (
                          <Badge variant="default" className="text-[10px]">
                            <Star className="h-2.5 w-2.5 mr-0.5" /> Active
                          </Badge>
                        )}
                        {resume.isStandard ? (
                          <Badge variant="secondary" className="text-[10px] gap-0.5">
                            <Lock className="h-2.5 w-2.5" /> Profile Data
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] gap-0.5">
                            <Pencil className="h-2.5 w-2.5" /> Custom Data
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <select
                          value={resume.templateId}
                          onChange={(e) => handleResumeTemplateChange(resume.id, e.target.value)}
                          className="text-xs bg-muted rounded px-2 py-1 border-none outline-none cursor-pointer"
                        >
                          <option value="classic">Classic Template</option>
                          <option value="modern">Modern Template</option>
                          <option value="minimal">Minimal Template</option>
                        </select>
                        <span className="text-[10px] text-muted-foreground">
                          Updated {new Date(resume.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Right side — actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Edit Data button — only for custom (non-standard) resumes */}
                      {!resume.isStandard && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1"
                            onClick={() => setEditingResumeId(resume.id)}
                          >
                            <Pencil className="h-3 w-3" /> Edit Data
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => handleSyncFromProfile(resume.id)}
                          >
                            Sync from Profile
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          setPreviewResumeId(resume.id);
                          setShowResume(true);
                        }}
                      >
                        Preview
                      </Button>
                      {!resume.isActive && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs"
                          onClick={() => handleSetActiveResume(resume.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      {resumes.length > 1 && !resume.isStandard && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeleteResume(resume.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Helpful hint */}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Tip: The standard resume always reflects your profile data. Create a custom resume to tailor content for specific job applications.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Resume Preview Modal */}
      <ResumeModal
        open={showResume}
        onOpenChange={setShowResume}
        portfolio={previewPortfolio}
        defaultTemplate={previewResume?.templateId || "classic"}
      />

      {/* Resume Data Editor */}
      {editingResume && editingResumeData && (
        <ResumeEditor
          open={!!editingResumeId}
          onOpenChange={(open) => {
            if (!open) setEditingResumeId(null);
          }}
          data={editingResumeData}
          resumeName={editingResume.name}
          onSave={(data) => handleResumeDataSave(editingResume.id, data)}
        />
      )}
    </div>
  );
}
