"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Portfolio, PersonalInfo, SocialLink } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updatePersonalInfo } from "@/actions/portfolio";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, X, Github, Linkedin, Globe, Twitter, Camera, Upload, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

interface PersonalInfoFormProps {
  portfolio: Portfolio;
  onUpdate: (portfolio: Portfolio) => void;
}

const platformIcons: Record<string, React.ReactNode> = {
  github: <Github className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
};

export function PersonalInfoForm({ portfolio, onUpdate }: PersonalInfoFormProps) {
  const [formData, setFormData] = useState<PersonalInfo>(portfolio.personalInfo);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [newLink, setNewLink] = useState({ platform: "github" as SocialLink["platform"], url: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const updatedFormData = { ...formData, profileImage: data.url };
      setFormData(updatedFormData);
      try {
        const updated = await updatePersonalInfo(updatedFormData);
        onUpdate(updated);
        toast({ title: "Image uploaded and saved!" });
      } catch {
        toast({ title: "Image uploaded!", description: "Click Save Changes to persist." });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const updated = await updatePersonalInfo(formData);
      onUpdate(updated);
      toast({ title: "Personal info updated successfully!" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update personal info",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addSocialLink = () => {
    if (!newLink.url) return;
    
    const link: SocialLink = {
      id: Date.now().toString(),
      platform: newLink.platform,
      url: newLink.url,
    };
    
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, link],
    });
    setNewLink({ platform: "github", url: "" });
  };

  const removeSocialLink = (id: string) => {
    setFormData({
      ...formData,
      socialLinks: formData.socialLinks.filter(l => l.id !== id),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Basic information that will be displayed on your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center space-y-4">
            <Label className="text-center">Profile Photo</Label>
            <div className="relative group">
              {/* Profile Image Circle */}
              <motion.div
                className={`relative w-36 h-36 rounded-full overflow-hidden border-4 transition-all duration-300 ${
                  isDragging
                    ? "border-primary border-dashed scale-105"
                    : "border-primary/20 hover:border-primary/50"
                } ${isUploading ? "opacity-50" : ""}`}
                whileHover={{ scale: 1.02 }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {formData.profileImage ? (
                  <Image
                    src={formData.profileImage}
                    alt="Profile"
                    fill
                    className="object-cover"
                    sizes="144px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <User className="w-16 h-16 text-primary/40" />
                  </div>
                )}

                {/* Overlay on hover */}
                <motion.div
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-8 h-8 text-white mb-1" />
                  <span className="text-white text-sm font-medium">Change Photo</span>
                </motion.div>

                {/* Upload spinner */}
                <AnimatePresence>
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center"
                    >
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Decorative ring */}
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-sm" />
              </motion.div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Upload button and info */}
            <div className="flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {formData.profileImage ? "Change Photo" : "Upload Photo"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Drag & drop or click to upload<br />
                JPEG, PNG, GIF, WebP • Max 5MB
              </p>
              {formData.profileImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const updatedFormData = { ...formData, profileImage: "" };
                    setFormData(updatedFormData);
                    try {
                      const updated = await updatePersonalInfo(updatedFormData);
                      onUpdate(updated);
                    } catch { /* ignore */ }
                  }}
                  className="text-destructive hover:text-destructive/80 text-xs"
                >
                  Remove Photo
                </Button>
              )}
            </div>
          </div>

          <div className="border-t pt-6" />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Professional Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Senior Software Engineer"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="New York, USA"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (optional)</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp || ""}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio / About Me</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Write a brief description about yourself, your experience, and what you're passionate about..."
              rows={5}
            />
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label>Social Links</Label>
            
            {formData.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.socialLinks.map((link) => (
                  <Badge 
                    key={link.id} 
                    variant="secondary"
                    className="flex items-center gap-2 py-2 px-3"
                  >
                    {platformIcons[link.platform] || <Globe className="h-4 w-4" />}
                    <span className="max-w-[200px] truncate">{link.url}</span>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(link.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Select
                value={newLink.platform}
                onValueChange={(value) => setNewLink({ ...newLink, platform: value as SocialLink["platform"] })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="behance">Behance</SelectItem>
                  <SelectItem value="dribbble">Dribbble</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="https://..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addSocialLink}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
