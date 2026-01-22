import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";
import type { User, ApiResponse, UserPublic } from "@/lib/types";

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ user: UserPublic }>>> {
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
        { success: false, error: "Invalid or expired access token" },
        { status: 401 }
      );
    }

    // Get user from database
    const users = await sql`
      SELECT id, email, name, created_at FROM users WHERE id = ${payload.userId}
    ` as UserPublic[];

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user: users[0] },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
