import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, generateTokens, getRefreshTokenExpiry } from "@/lib/auth";
import { validateRegister } from "@/lib/validation";
import type { User, ApiResponse, AuthTokens, UserPublic } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ user: UserPublic; tokens: AuthTokens }>>> {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRegister(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    ` as User[];

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUsers = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
      RETURNING id, email, name, created_at
    ` as UserPublic[];

    const user = newUsers[0];

    // Generate tokens
    const tokens = await generateTokens({ userId: user.id, email: user.email });

    // Store refresh token in database
    const expiresAt = getRefreshTokenExpiry();
    await sql`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${tokens.refreshToken}, ${expiresAt.toISOString()})
    `;

    return NextResponse.json(
      {
        success: true,
        data: { user, tokens },
        message: "Registration successful",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
