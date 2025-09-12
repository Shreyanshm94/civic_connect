// app/api/admin/login/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req) {
  console.log("[API] POST /api/admin/login hit");
  try {
    const body = await req.json();
    console.log("[API] login body:", body);

    // Accept either emp_id OR phone (or a single identifier field)
    const rawId = (body?.emp_id || body?.phone || "").toString().trim();
    const password = body?.password;

    if (!rawId || !password) {
      return NextResponse.json({ error: "identifier_and_password_required" }, { status: 400 });
    }

    // Query DB trying to match emp_id OR phone (prefer exact emp_id match first)
    // First try emp_id exact
    let [rows] = await pool.query(
      "SELECT id, emp_id, name, phone, password FROM admins WHERE emp_id = ? LIMIT 1",
      [rawId]
    );

    if (!rows || rows.length === 0) {
      // try phone lookup
      [rows] = await pool.query(
        "SELECT id, emp_id, name, phone, password FROM admins WHERE phone = ? LIMIT 1",
        [rawId]
      );
    }

    const admin = rows && rows[0];
    if (!admin) {
      console.log("[API] no admin found for identifier:", rawId);
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(String(password), admin.password);
    if (!ok) {
      console.log("[API] password mismatch for admin id:", admin.id);
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    // success — return safe payload
    const payload = { id: admin.id, emp_id: admin.emp_id, phone: admin.phone, name: admin.name };
    return NextResponse.json({ ok: true, admin: payload }, { status: 200 });
  } catch (err) {
    console.error("[API] login error:", err);
    return NextResponse.json({ error: "server_error", details: String(err) }, { status: 500 });
  }
}
