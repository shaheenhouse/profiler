"use client";

import { useState } from "react";
import { Certification } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addCertification, deleteCertification } from "@/actions/portfolio";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, Loader2, Award, ExternalLink } from "lucide-react";

interface CertificationsSectionProps {
  certifications: Certification[];
  onUpdate: (certifications: Certification[]) => void;
}

const emptyCertification: Omit<Certification, "id"> = {
  name: "",
  issuer: "",
  issueDate: "",
  expiryDate: "",
  credentialId: "",
  credentialUrl: "",
};

export function CertificationsSection({ certifications, onUpdate }: CertificationsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Certification, "id">>(emptyCertification);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updated = await addCertification(formData);
      onUpdate(updated.certifications);
      toast({ title: "Certification added successfully!" });
      setIsOpen(false);
      setFormData(emptyCertification);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save certification", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certification?")) return;
    
    try {
      const updated = await deleteCertification(id);
      onUpdate(updated.certifications);
      toast({ title: "Certification deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete certification", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Certifications</CardTitle>
          <CardDescription>Add your professional certifications</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Certification</DialogTitle>
              <DialogDescription>
                Add details about your certification
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Certification Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="AWS Solutions Architect"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuer">Issuing Organization</Label>
                <Input
                  id="issuer"
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  placeholder="Amazon Web Services"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="month"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
                  <Input
                    id="expiryDate"
                    type="month"
                    value={formData.expiryDate || ""}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentialId">Credential ID (optional)</Label>
                <Input
                  id="credentialId"
                  value={formData.credentialId || ""}
                  onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                  placeholder="ABC123XYZ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentialUrl">Credential URL (optional)</Label>
                <Input
                  id="credentialUrl"
                  value={formData.credentialUrl || ""}
                  onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Certification
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {certifications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No certifications added yet. Click "Add Certification" to get started.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="p-4 rounded-lg border bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{cert.name}</h4>
                      <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Issued: {formatDate(cert.issueDate)}
                        {cert.expiryDate && ` · Expires: ${formatDate(cert.expiryDate)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {cert.credentialUrl && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(cert.id)}>
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
