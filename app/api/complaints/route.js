// app/api/complaints/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || null;
    const limit = Number(url.searchParams.get("limit") || 500);

    let sql = `SELECT id, reference, complaint, address, pincode, district, department, status, upvotes, photo_path, latitude, longitude, created_at
               FROM complaints`;
    const params = [];

    if (status) {
      sql += ` WHERE status = ?`;
      params.push(String(status));
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(sql, params);

    const complaints = (rows || []).map(r => ({
      id: r.id,
      reference: r.reference,
      complaint: r.complaint,
      address: r.address,
      pincode: r.pincode,
      district: r.district,
      department: r.department,
      status: r.status,
      upvotes: Number(r.upvotes || 0),
      photo_path: r.photo_path,
      latitude: r.latitude,
      longitude: r.longitude,
      created_at: r.created_at,
    }));

    return NextResponse.json({ ok: true, complaints }, { status: 200 });
  } catch (err) {
    console.error("[API] /api/complaints GET error:", err);
    return NextResponse.json({ ok: false, error: "server_error", details: String(err) }, { status: 500 });
  }
}

// Block other verbs explicitly
export async function POST() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
