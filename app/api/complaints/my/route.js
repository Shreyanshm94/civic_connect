// app/api/complaints/my/route.js
import pool from "@/lib/db";

export async function GET() {
  let conn = null;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT id, reference, name, phone, pincode, department, status, upvotes, created_at FROM complaints ORDER BY created_at DESC LIMIT 50");
    try { if (conn) conn.release(); } catch {}
    return new Response(JSON.stringify(rows), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    try { if (conn) conn.release(); } catch {}
    console.error("GET /api/complaints/my error", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}
