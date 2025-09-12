import pool from "@/lib/db";

export async function POST(req, context) {
  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const citizenId = body?.citizenId;

  if (!citizenId) {
    return Response.json({ error: "Login required to upvote" }, { status: 401 });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      "SELECT id FROM complaints WHERE id = ? OR reference = ? LIMIT 1",
      [id, id]
    );
    if (!rows.length) {
      return Response.json({ error: "Complaint not found" }, { status: 404 });
    }
    const complaintId = rows[0].id;

    try {
      await conn.query(
        "INSERT INTO complaint_upvotes (complaint_id, citizen_id) VALUES (?, ?)",
        [complaintId, citizenId]
      );
      await conn.query(
        "UPDATE complaints SET upvotes = upvotes + 1 WHERE id = ?",
        [complaintId]
      );
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return Response.json({ error: "You already upvoted this complaint" }, { status: 400 });
      }
      throw err;
    }

    const [updated] = await conn.query(
      "SELECT id, reference, upvotes FROM complaints WHERE id = ?",
      [complaintId]
    );

    return Response.json(updated[0]);
  } catch (err) {
    console.error("Upvote error:", err);
    return Response.json({ error: "Server error: " + err.message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
