// app/api/complaints/top/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Adjust limit as needed
    const limit = 10;

    // Select complaints with upvotes > 1, highest upvotes first
    const [rows] = await pool.query(
      `SELECT id, reference, complaint, status, upvotes, district, created_at
       FROM complaints
       WHERE COALESCE(upvotes,0) > 1
       ORDER BY upvotes DESC, created_at DESC
       LIMIT ?`,
      [limit]
    );

    // normalize fields if needed
    const complaints = (rows || []).map(r => ({
      id: r.id,
      reference: r.reference,
      complaint: r.complaint,
      status: r.status,
      upvotes: Number(r.upvotes || 0),
      district: r.district,
      created_at: r.created_at,
    }));

    return NextResponse.json({ ok: true, complaints }, { status: 200 });
  } catch (err) {
    console.error("[API] /api/complaints/top error:", err);
    return NextResponse.json({ ok: false, error: "server_error", details: String(err) }, { status: 500 });
  }
}
