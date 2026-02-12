"use client";

import { useSearchParams } from "next/navigation";
import { DesignEditor } from "@/components/design/design-editor";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function NewDesignContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Untitled Design";
  const width = parseInt(searchParams.get("width") || "1080");
  const height = parseInt(searchParams.get("height") || "1080");

  return (
    <DesignEditor
      designId={null}
      initialName={name}
      initialWidth={width}
      initialHeight={height}
    />
  );
}

export default function NewDesignPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <NewDesignContent />
    </Suspense>
  );
}
