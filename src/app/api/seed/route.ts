import { NextResponse } from "next/server";
import { isBlobConfigured, writeBlobJson, readBlobJson } from "@/lib/blob-storage";
import { SEED_USERS, SEED_PORTFOLIOS } from "@/lib/seed-data";
import type { User } from "@/types/portfolio";

/**
 * POST /api/seed
 * Seeds the Vercel Blob storage with initial data
 * This is called automatically on first deployment or can be called manually
 */
export async function POST() {
  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: "Vercel Blob not configured. Set BLOB_READ_WRITE_TOKEN environment variable." },
      { status: 400 }
    );
  }

  try {
    // Check if already seeded
    const existingUsers = await readBlobJson<User[]>('users');
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({
        message: "Data already exists, skipping seed",
        users: existingUsers.length,
      });
    }

    // Seed users
    console.log("[Seed] Writing users...");
    await writeBlobJson('users', SEED_USERS);

    // Seed portfolios
    console.log("[Seed] Writing portfolios...");
    for (const portfolio of SEED_PORTFOLIOS) {
      await writeBlobJson('portfolio', portfolio, portfolio.userId);
    }

    console.log("[Seed] Seeding complete!");

    return NextResponse.json({
      message: "Seeding complete",
      users: SEED_USERS.length,
      portfolios: SEED_PORTFOLIOS.length,
    });
  } catch (error) {
    console.error("[Seed] Error:", error);
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seed
 * Checks if data needs to be seeded and returns status
 */
export async function GET() {
  if (!isBlobConfigured()) {
    return NextResponse.json({
      configured: false,
      message: "Vercel Blob not configured",
    });
  }

  try {
    const existingUsers = await readBlobJson<User[]>('users');
    const needsSeed = !existingUsers || existingUsers.length === 0;

    return NextResponse.json({
      configured: true,
      needsSeed,
      usersCount: existingUsers?.length || 0,
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      needsSeed: true,
      error: String(error),
    });
  }
}
