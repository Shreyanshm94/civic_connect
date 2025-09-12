// app/api/complaints/[id]/track/route.js
import pool from "@/lib/db";

export async function GET(req, context) {
  let conn = null;
  try {
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams?.id, 10);
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing or invalid id" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    conn = await pool.getConnection();
    try {
      const [rows] = await conn.query("SELECT * FROM complaints WHERE id = ?", [id]);
      if (!rows || rows.length === 0) {
        try { if (conn) conn.release(); } catch {}
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" }});
      }
      const complaint = rows[0];

      const [historyRows] = await conn.query("SELECT * FROM complaint_history WHERE complaint_id = ? ORDER BY created_at ASC", [id]).catch(()=>[[]]);
      try { if (conn) conn.release(); } catch {}

      return new Response(JSON.stringify({ complaint, history: historyRows || [] }), { status: 200, headers: { "Content-Type": "application/json" }});
    } finally {
      try { if (conn) conn.release(); } catch {}
    }
  } catch (err) {
    try { if (conn) conn.release(); } catch {}
    console.error("GET /api/complaints/[id]/track error", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}
