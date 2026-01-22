import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyRefreshToken, generateTokens, getRefreshTokenExpiry } from "@/lib/auth";
import type { RefreshToken, User, ApiResponse, AuthTokens } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ tokens: AuthTokens }>>> {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json(
        { success: false, error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Verify the refresh token JWT
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Check if refresh token exists in database and is not expired
    const storedTokens = await sql`
      SELECT id, user_id, expires_at FROM refresh_tokens 
      WHERE token = ${refreshToken} AND expires_at > NOW()
    ` as RefreshToken[];

    if (storedTokens.length === 0) {
      return NextResponse.json(
        { success: false, error: "Refresh token expired or revoked" },
        { status: 401 }
      );
    }

    const storedToken = storedTokens[0];

    // Verify the user still exists
    const users = await sql`
      SELECT id, email FROM users WHERE id = ${storedToken.user_id}
    ` as User[];

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const user = users[0];

    // Delete the old refresh token (token rotation)
    await sql`
      DELETE FROM refresh_tokens WHERE id = ${storedToken.id}
    `;

    // Generate new tokens
    const newTokens = await generateTokens({ userId: user.id, email: user.email });

    // Store new refresh token
    const expiresAt = getRefreshTokenExpiry();
    await sql`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${newTokens.refreshToken}, ${expiresAt.toISOString()})
    `;

    return NextResponse.json({
      success: true,
      data: { tokens: newTokens },
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
