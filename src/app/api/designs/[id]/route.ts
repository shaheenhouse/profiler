import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDesign, updateDesign, deleteDesign, duplicateDesign } from "@/lib/design-storage";

// GET /api/designs/[id] - Get a specific design
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const design = await getDesign(params.id);
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

// PUT /api/designs/[id] - Update a design
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const design = await getDesign(params.id);
    if (!design || design.userId !== session.user.id) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const body = await request.json();
    const updated = await updateDesign(params.id, body);

    return NextResponse.json({ design: updated });
  } catch (error) {
    console.error("Error updating design:", error);
    return NextResponse.json({ error: "Failed to update design" }, { status: 500 });
  }
}

// DELETE /api/designs/[id] - Delete a design
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await deleteDesign(params.id, session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Design deleted" });
  } catch (error) {
    console.error("Error deleting design:", error);
    return NextResponse.json({ error: "Failed to delete design" }, { status: 500 });
  }
}

// PATCH /api/designs/[id] - Duplicate a design
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    if (body.action === "duplicate") {
      const duplicated = await duplicateDesign(params.id, session.user.id);
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
