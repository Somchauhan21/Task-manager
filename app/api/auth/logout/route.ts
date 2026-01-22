import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authorization header required" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    const payload = await verifyAccessToken(accessToken);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid access token" },
        { status: 401 }
      );
    }

    // Get refresh token from request body (optional)
    let refreshToken: string | undefined;
    try {
      const body = await request.json();
      refreshToken = body.refreshToken;
    } catch {
      // No body provided, that's okay
    }

    // Delete specific refresh token if provided, otherwise delete all for user
    if (refreshToken) {
      await sql`
        DELETE FROM refresh_tokens 
        WHERE user_id = ${payload.userId} AND token = ${refreshToken}
      `;
    } else {
      // Delete all refresh tokens for this user (logout from all devices)
      await sql`
        DELETE FROM refresh_tokens WHERE user_id = ${payload.userId}
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
