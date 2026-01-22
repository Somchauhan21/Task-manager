import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./auth";
import type { JWTPayload, ApiResponse } from "./types";

// Type for authenticated request handler
export type AuthenticatedHandler<T = unknown> = (
  request: NextRequest,
  user: JWTPayload,
  params?: { params: Promise<{ id: string }> }
) => Promise<NextResponse<ApiResponse<T>>>;

// Middleware to verify authentication
export function withAuth<T>(handler: AuthenticatedHandler<T>) {
  return async (
    request: NextRequest,
    context?: { params: Promise<{ id: string }> }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authorization header required" },
        { status: 401 }
      ) as NextResponse<ApiResponse<T>>;
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired access token" },
        { status: 401 }
      ) as NextResponse<ApiResponse<T>>;
    }

    return handler(request, payload, context ? { params: context.params } : undefined);
  };
}
