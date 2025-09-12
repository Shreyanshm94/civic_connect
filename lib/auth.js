// lib/auth.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "change-me-to-secret";
const COOKIE_NAME = "admin_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export function cookieForToken(token) {
  return serializeCookie(COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function parseTokenFromRequest(req) {
  const cookieHeader = req.headers?.get?.("cookie") ?? req.headers?.cookie ?? "";
  if (!cookieHeader) return null;
  const parsed = parseCookie(cookieHeader || "");
  return parsed[COOKIE_NAME] ?? null;
}
