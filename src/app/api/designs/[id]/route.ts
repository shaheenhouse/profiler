import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDesign, updateDesign, deleteDesign, duplicateDesign } from "@/lib/design-storage";
import { uploadDesignThumbnail, isBlobConfigured } from "@/lib/blob-storage";

// GET /api/designs/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const design = await getDesign(id);
    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    if (design.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ design });
  } catch (error) {
    console.error("Error fetching design:", error);
    return NextResponse.json({ error: "Failed to fetch design" }, { status: 500 });
  }
}

// PUT /api/designs/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const design = await getDesign(id);
    if (!design || design.userId !== session.user.id) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const body = await request.json();
    const { thumbnail, ...rest } = body;

    // Upload thumbnail to Blob if it's base64
    let thumbnailValue = thumbnail;
    if (thumbnail && thumbnail.startsWith("data:") && isBlobConfigured()) {
      const blobUrl = await uploadDesignThumbnail(id, thumbnail);
      if (blobUrl) {
        thumbnailValue = blobUrl;
      }
    }

    const updated = await updateDesign(id, {
      ...rest,
      ...(thumbnailValue !== undefined ? { thumbnail: thumbnailValue } : {}),
    });

    return NextResponse.json({ design: updated });
  } catch (error) {
    console.error("Error updating design:", error);
    return NextResponse.json({ error: "Failed to update design" }, { status: 500 });
  }
}

// DELETE /api/designs/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await deleteDesign(id, session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Design deleted" });
  } catch (error) {
    console.error("Error deleting design:", error);
    return NextResponse.json({ error: "Failed to delete design" }, { status: 500 });
  }
}

// PATCH /api/designs/[id] - Duplicate
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.action === "duplicate") {
      const duplicated = await duplicateDesign(id, session.user.id);
      if (!duplicated) {
        return NextResponse.json({ error: "Design not found" }, { status: 404 });
      }
      return NextResponse.json({ design: duplicated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
