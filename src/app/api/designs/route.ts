import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserDesigns, createDesign } from "@/lib/design-storage";

// GET /api/designs - List user's designs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const designs = await getUserDesigns(session.user.id);
    return NextResponse.json({ designs });
  } catch (error) {
    console.error("Error fetching designs:", error);
    return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 });
  }
}

// POST /api/designs - Create a new design
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, width, height, canvasJSON, thumbnail } = body;

    if (!name || !width || !height) {
      return NextResponse.json({ error: "Name, width, and height are required" }, { status: 400 });
    }

    const design = await createDesign({
      userId: session.user.id,
      name,
      width,
      height,
      canvasJSON: canvasJSON || "{}",
      thumbnail: thumbnail || "",
    });

    return NextResponse.json({ design });
  } catch (error) {
    console.error("Error creating design:", error);
    return NextResponse.json({ error: "Failed to create design" }, { status: 500 });
  }
}
