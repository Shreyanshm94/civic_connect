// app/api/complaints/[id]/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    const id = Number(params?.id || 0);
    if (!id) return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });

    const [rows] = await pool.query(
      `SELECT id, reference, citizen_id, name, phone, address, pincode, district, department,
              complaint, photo_path, latitude, longitude, status, upvotes, created_at
       FROM complaints
       WHERE id = ? LIMIT 1`,
      [id]
    );

    const row = rows && rows[0];
    if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    const complaint = {
      id: row.id,
      reference: row.reference,
      citizen_id: row.citizen_id,
      name: row.name,
      phone: row.phone,
      address: row.address,
      pincode: row.pincode,
      district: row.district,
      department: row.department,
      complaint: row.complaint,
      photo_path: row.photo_path,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
      upvotes: Number(row.upvotes || 0),
      created_at: row.created_at
    };

    return NextResponse.json({ ok: true, complaint }, { status: 200 });
  } catch (err) {
    console.error("[API] GET /api/complaints/[id] error:", err);
    return NextResponse.json({ ok: false, error: "server_error", details: String(err) }, { status: 500 });
  }
}
