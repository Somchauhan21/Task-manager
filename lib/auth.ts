import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { JWTPayload, AuthTokens } from "./types";

// Environment variables
const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || "access-secret-key-change-in-production"
);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "refresh-secret-key-change-in-production"
);

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password against hash
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate access token
export async function generateAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(ACCESS_TOKEN_SECRET);
}

// Generate refresh token
export async function generateRefreshToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_TOKEN_SECRET);
}

// Generate both tokens
export async function generateTokens(payload: JWTPayload): Promise<AuthTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);
  return { accessToken, refreshToken };
}

// Verify access token
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

// Verify refresh token
export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

// Get refresh token expiry date (7 days from now)
export function getRefreshTokenExpiry(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}
