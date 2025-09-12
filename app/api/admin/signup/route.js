
// app/api/admin/signup/route.js
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
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
  });
}

export async function POST(req) {
  console.log("[SIGNUP] request received (option-A: emp_id-unique only)");
  try {
    const body = await req.json().catch(() => null);
    console.log("[SIGNUP] raw body:", body);

    const name = body?.name ? String(body.name).trim() : "";
    const emp_id = body?.emp_id ? String(body.emp_id).trim() : "";
    const department = body?.department ? String(body.department).trim() : null;
    const district = body?.district ? String(body.district).trim() : null;
    const phone = body?.phone ? String(body.phone).replace(/\D/g, "").trim() : "";
    const password = body?.password ? String(body.password) : "";

    const missing = [];
    if (!name) missing.push("name");
    if (!emp_id) missing.push("emp_id");
    if (!phone) missing.push("phone");
    if (!password) missing.push("password");
    if (missing.length) {
      return NextResponse.json({ error: "missing_fields", details: missing }, { status: 400 });
    }

    // CHECK: only enforce emp_id uniqueness (allow duplicate phones)
    const [[byEmp]] = await pool.query("SELECT id, emp_id, phone FROM admins WHERE emp_id = ? LIMIT 1", [emp_id]);

    if (byEmp && byEmp.id) {
      console.log("[SIGNUP] conflict - emp_id exists:", byEmp);
      return NextResponse.json({ error: "duplicate_admin", conflict_field: "emp_id", existing: byEmp }, { status: 409 });
    }

    // Insert new admin (phone duplicates allowed)
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO admins (name, emp_id, department, district, phone, password)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, emp_id, department, district, phone, hashed]
    );

    console.log("[SIGNUP] inserted id=", result.insertId, { emp_id, phone });
    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  } catch (err) {
    console.error("[SIGNUP] error:", err);
    return NextResponse.json({ error: "server_error", details: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, msg: "signup route alive (emp_id-unique only)" }, { status: 200 });
}
