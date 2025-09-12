// app/api/admin/me/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { parseTokenFromRequest, verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const token = parseTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = payload.id;
    const [rows] = await pool.query(
      "SELECT id, name, emp_id, department, district, phone FROM admins WHERE id = ? LIMIT 1",
      [adminId]
    );
    const admin = rows && rows[0];
    if (!admin) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // return only safe fields
    return NextResponse.json({
      ok: true,
      admin: {
        id: admin.id,
        name: admin.name,
        emp_id: admin.emp_id,
        department: admin.department,
        district: admin.district,
        phone: admin.phone,
      }
    }, { status: 200 });
  } catch (err) {
    console.error("[API] /api/admin/me error:", err);
    return NextResponse.json({ error: "server_error", details: String(err) }, { status: 500 });
  }
}
