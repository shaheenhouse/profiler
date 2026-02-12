"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DesignEditor } from "@/components/design/design-editor";
import { Loader2 } from "lucide-react";

export default function DesignEditorPage() {
  const params = useParams();
  const designId = params.id as string;
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDesign = async () => {
      try {
        const res = await fetch(`/api/designs/${designId}`);
        if (!res.ok) throw new Error("Design not found");
        const data = await res.json();
        setDesign(data.design);
      } catch (err) {
        setError("Design not found or you don't have access to it.");
      } finally {
        setLoading(false);
      }
    };

    if (designId) {
      fetchDesign();
    }
  }, [designId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading design editor...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Design Not Found</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <DesignEditor
      designId={design.id}
      initialName={design.name}
      initialWidth={design.width}
      initialHeight={design.height}
      initialCanvasJSON={design.canvasJSON}
    />
  );
}
