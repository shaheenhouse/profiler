import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { uploadImageToBlob, isBlobConfigured } from "@/lib/blob-storage";

// Check if we should use Vercel Blob storage
const USE_BLOB_STORAGE = isBlobConfigured();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop();
    const filename = `${session.user.id}-${Date.now()}.${ext}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let url: string;

    if (USE_BLOB_STORAGE) {
      // Use Vercel Blob for production
      const blobUrl = await uploadImageToBlob(buffer, filename, file.type);
      
      if (!blobUrl) {
        return NextResponse.json(
          { error: "Failed to upload file to blob storage" },
          { status: 500 }
        );
      }
      
      url = blobUrl;
      console.log("[Upload] Saved to Vercel Blob:", url);
    } else {
      // Use local file system for development
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "profiles");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const filepath = path.join(uploadsDir, filename);
      await writeFile(filepath, buffer);
      
      url = `/uploads/profiles/${filename}`;
      console.log("[Upload] Saved to local file system:", url);
    }

    return NextResponse.json({ url, message: "Upload successful" });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
