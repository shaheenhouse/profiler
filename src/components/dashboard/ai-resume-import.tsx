"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wand2,
  Upload,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  X,
  Sparkles,
  Type,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { Portfolio, ResumeData } from "@/types/portfolio";

interface AIResumeImportProps {
  portfolio: Portfolio;
  onImport: (data: Partial<Portfolio>) => void;
}

type ImportMode = "text" | "image" | "pdf" | null;

export function AIResumeImport({ portfolio, onImport }: AIResumeImportProps) {
  const [mode, setMode] = useState<ImportMode>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [textContent, setTextContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ResumeData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    const reader = new FileReader();
    
    if (file.type.startsWith("image/")) {
      setMode("image");
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      setMode("pdf");
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("text/")) {
      setMode("text");
      reader.onload = () => {
        setTextContent(reader.result as string);
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const handleExtract = async () => {
    setIsLoading(true);
    setError("");
    setExtractedData(null);

    try {
      const body: any = { contentType: mode };

      if (mode === "text") {
        body.content = textContent;
      } else if (mode === "image" || mode === "pdf") {
        body.base64Data = filePreview;
      }

      const res = await fetch("/api/ai/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");

      setExtractedData(data.resumeData);
    } catch (err: any) {
      setError(err.message || "Failed to extract data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!extractedData) return;

    const updates: Partial<Portfolio> = {};

    if (extractedData.personalInfo) {
      updates.personalInfo = {
        ...portfolio.personalInfo,
        ...extractedData.personalInfo,
        profileImage: portfolio.personalInfo.profileImage,
        socialLinks: [
          ...portfolio.personalInfo.socialLinks,
          ...(extractedData.personalInfo.socialLinks || []).filter(
            (sl) => !portfolio.personalInfo.socialLinks.some((e) => e.platform === sl.platform)
          ),
        ],
      };
    }
    if (extractedData.education?.length) {
      updates.education = [
        ...portfolio.education,
        ...extractedData.education.filter(
          (e) => !portfolio.education.some((pe) => pe.institution === e.institution && pe.degree === e.degree)
        ),
      ];
    }
    if (extractedData.experience?.length) {
      updates.experience = [
        ...portfolio.experience,
        ...extractedData.experience.filter(
          (e) => !portfolio.experience.some((pe) => pe.company === e.company && pe.title === e.title)
        ),
      ];
    }
    if (extractedData.skills?.length) {
      updates.skills = [
        ...portfolio.skills,
        ...extractedData.skills.filter(
          (s) => !portfolio.skills.some((ps) => ps.name.toLowerCase() === s.name.toLowerCase())
        ),
      ];
    }
    if (extractedData.certifications?.length) {
      updates.certifications = [
        ...portfolio.certifications,
        ...extractedData.certifications.filter(
          (c) => !portfolio.certifications.some((pc) => pc.name === c.name)
        ),
      ];
    }
    if (extractedData.projects?.length) {
      updates.projects = [
        ...portfolio.projects,
        ...extractedData.projects.filter(
          (p) => !portfolio.projects.some((pp) => pp.name === p.name)
        ),
      ];
    }
    if (extractedData.languages?.length) {
      updates.languages = [
        ...(portfolio.languages || []),
        ...extractedData.languages.filter(
          (l) => !(portfolio.languages || []).some((pl) => pl.name.toLowerCase() === l.name.toLowerCase())
        ),
      ];
    }

    onImport(updates);
    toast({ title: "Resume data imported!", description: "Your profile has been updated with the extracted data. Review and save your changes." });
    
    // Reset
    setExtractedData(null);
    setMode(null);
    setTextContent("");
    setFileName("");
    setFilePreview(null);
  };

  const handleReset = () => {
    setMode(null);
    setTextContent("");
    setFileName("");
    setFilePreview(null);
    setExtractedData(null);
    setError("");
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="w-5 h-5 text-purple-500" />
          AI Resume Import
        </CardTitle>
        <CardDescription>
          Upload a resume (image, PDF, or text) and AI will extract all the details into your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!mode && !extractedData && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:border-purple-400"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-6 h-6 text-purple-500" />
                <span className="text-xs">Upload Image</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:border-purple-400"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "application/pdf";
                    fileInputRef.current.click();
                    fileInputRef.current.accept = "image/*,.pdf,.txt,.doc,.docx";
                  }
                }}
              >
                <FileText className="w-6 h-6 text-purple-500" />
                <span className="text-xs">Upload PDF</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:border-purple-400"
                onClick={() => setMode("text")}
              >
                <Type className="w-6 h-6 text-purple-500" />
                <span className="text-xs">Paste Text</span>
              </Button>
            </div>
          </>
        )}

        {mode === "text" && !extractedData && (
          <div className="space-y-3">
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your resume text here... Include your experience, education, skills, etc."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[200px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={handleExtract}
                disabled={isLoading || !textContent.trim()}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Extract Data
              </Button>
            </div>
          </div>
        )}

        {(mode === "image" || mode === "pdf") && !extractedData && (
          <div className="space-y-3">
            {filePreview && mode === "image" && (
              <div className="relative border rounded-lg overflow-hidden">
                <img src={filePreview} alt="Uploaded" className="w-full max-h-48 object-contain bg-white" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                  {fileName}
                </div>
              </div>
            )}
            {mode === "pdf" && (
              <div className="border rounded-lg p-4 text-center bg-muted/30">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">PDF uploaded</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={handleExtract}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Extract Data
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
            <p className="text-sm text-muted-foreground">AI is reading your resume...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
            <Button variant="ghost" size="sm" className="ml-2" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        )}

        {extractedData && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Data Extracted!</span>
              </div>
              <div className="text-xs text-green-700 dark:text-green-400 space-y-1">
                {extractedData.personalInfo?.fullName && <p>Name: {extractedData.personalInfo.fullName}</p>}
                {extractedData.personalInfo?.title && <p>Title: {extractedData.personalInfo.title}</p>}
                {extractedData.experience?.length > 0 && <p>{extractedData.experience.length} experience entries</p>}
                {extractedData.education?.length > 0 && <p>{extractedData.education.length} education entries</p>}
                {extractedData.skills?.length > 0 && <p>{extractedData.skills.length} skills found</p>}
                {extractedData.certifications?.length > 0 && <p>{extractedData.certifications.length} certifications</p>}
                {extractedData.projects?.length > 0 && <p>{extractedData.projects.length} projects</p>}
                {extractedData.languages?.length > 0 && <p>{extractedData.languages.length} languages</p>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <X className="w-4 h-4 mr-1" />
                Discard
              </Button>
              <Button size="sm" className="gap-2" onClick={handleApply}>
                <CheckCircle className="w-4 h-4" />
                Apply to Profile
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Applying will merge extracted data with your existing profile. Duplicate entries are skipped.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
