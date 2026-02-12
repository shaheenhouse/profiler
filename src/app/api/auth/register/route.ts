import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail, getUserByUsername } from "@/lib/storage";
import { RegisterUserInput } from "@/types/portfolio";

export async function POST(request: NextRequest) {
  try {
    const body: RegisterUserInput = await request.json();

    // Validate required fields
    if (!body.username || !body.email || !body.password || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: "Username, email, password, first name, and last name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate username (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(body.username)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters and contain only letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await getUserByEmail(body.email);
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await getUserByUsername(body.username);
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser(body);

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: "Registration successful", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
