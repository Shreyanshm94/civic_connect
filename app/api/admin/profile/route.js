// app/api/admin/profile/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { parseTokenFromRequest, verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAdmin(req) {
  const token = parseTokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.id) throw new Error("UNAUTH");
  return payload;
}

export async function PATCH(req) {
  try {
    const payload = await requireAdmin(req);
    const adminId = payload.id;

    const body = await req.json().catch(()=>null);
    if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

    // Only allow specific fields to be updated
    const name = body.name ? String(body.name).trim() : null;
    const department = body.department != null ? String(body.department).trim() : null;
    const district = body.district != null ? String(body.district).trim() : null;
    const phone = body.phone != null ? String(body.phone).replace(/\D/g,"").slice(0,10) : null;

    // Build SQL dynamically
    const fields = [];
    const params = [];
    if (name !== null) { fields.push("name = ?"); params.push(name); }
    if (department !== null) { fields.push("department = ?"); params.push(department); }
    if (district !== null) { fields.push("district = ?"); params.push(district); }
    if (phone !== null) { fields.push("phone = ?"); params.push(phone); }

    if (fields.length === 0) return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });

    params.push(adminId);
    const sql = `UPDATE admins SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(sql, params);

    // Return updated row
    const [rows] = await pool.query("SELECT id, name, emp_id, department, district, phone FROM admins WHERE id = ? LIMIT 1", [adminId]);
    const admin = rows && rows[0];
    return NextResponse.json({ ok: true, admin }, { status: 200 });
  } catch (err) {
    if (String(err.message) === "UNAUTH") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[API] PATCH /api/admin/profile error:", err);
    return NextResponse.json({ error: "server_error", details: String(err) }, { status: 500 });
  }
}

// optional: disallow other methods here
export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
