import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword, generateTokens, getRefreshTokenExpiry } from "@/lib/auth";
import { validateLogin } from "@/lib/validation";
import type { User, ApiResponse, AuthTokens, UserPublic } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ user: UserPublic; tokens: AuthTokens }>>> {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateLogin(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user by email
    const users = await sql`
      SELECT id, email, password_hash, name, created_at FROM users WHERE email = ${email}
    ` as User[];

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate tokens
    const tokens = await generateTokens({ userId: user.id, email: user.email });

    // Store refresh token in database
    const expiresAt = getRefreshTokenExpiry();
    await sql`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${tokens.refreshToken}, ${expiresAt.toISOString()})
    `;

    // Return user without password hash
    const userPublic: UserPublic = {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
    };

    return NextResponse.json({
      success: true,
      data: { user: userPublic, tokens },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
