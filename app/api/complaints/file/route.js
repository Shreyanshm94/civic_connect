// app/api/complaints/file/route.js
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import pool from "@/lib/db";

function sanitizeBase64(input) {
  if (typeof input !== "string") return null;
  // If input is a data URL like "data:image/jpeg;base64,AAAA...", return the part after the comma
  const parts = input.split(",");
  const payload = parts.length > 1 ? parts.pop() : parts[0];
  // quick sanity: must be non-empty and contain only base64 chars (basic check)
  if (!payload || !/^[A-Za-z0-9+/=\s]+$/.test(payload)) return null;
  return payload;
}

export async function POST(req) {
  let conn = null;
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const {
      address,
      pincode,
      district = "",
      department = "",
      complaint: complaintText = "",
      photo_name = null,
      latitude = null,
      longitude = null,
      name = null,
      phone = null,
      citizen_id = null
    } = body;

    if (!address || !/^\d{6}$/.test(String(pincode)) || !department) {
      return new Response(JSON.stringify({ error: "Missing required fields (address, pincode, department)" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // generate reference (short)
    const reference = crypto.randomUUID().slice(0, 32);

    // prepare photo storage (if provided)
    let storedPath = null;
    let imageBase64 = body.photo_path ?? body.image_base64 ?? null;
    if (imageBase64) {
      const payload = sanitizeBase64(imageBase64);
      if (!payload) {
        return new Response(JSON.stringify({ error: "Invalid image payload" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      // ensure uploads folder exists
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });

      // pick extension from photo_name if present, otherwise default to .jpg
      const ext = (photo_name && path.extname(photo_name)) || ".jpg";
      const fileName = `${reference}${ext}`;
      const outPath = path.join(uploadsDir, fileName);

      const buffer = Buffer.from(payload, "base64");
      // optional: limit file size (e.g., 5MB). Here we check size to avoid huge writes:
      const MAX_BYTES = 5 * 1024 * 1024;
      if (buffer.length > MAX_BYTES) {
        return new Response(JSON.stringify({ error: "Image too large (max 5MB)" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      await fs.writeFile(outPath, buffer);
      storedPath = `/uploads/${fileName}`; // public URL path
    }

    conn = await pool.getConnection();
    try {
      const insertSql = `INSERT INTO complaints
        (reference, citizen_id, name, phone, address, pincode, district, department, complaint, photo_path, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const [result] = await conn.execute(insertSql, [
        reference,
        citizen_id || null,
        name || null,
        phone || null,
        address,
        pincode,
        district,
        department,
        complaintText || null,
        storedPath,
        latitude,
        longitude
      ]);

      const newId = result.insertId;

      // attempt to create initial history row if table exists; ignore if not
      await conn.execute('INSERT INTO complaint_history (complaint_id, status, note) VALUES (?, ?, ?)', [newId, 'Pending', 'Complaint registered']).catch(() => {});

      const [rows] = await conn.execute(
        'SELECT id, reference, citizen_id, name, phone, address, pincode, district, department, complaint, photo_path, latitude, longitude, status, upvotes, created_at FROM complaints WHERE id = ? LIMIT 1',
        [newId]
      );

      const created = rows[0] || null;
      return new Response(JSON.stringify({ complaint: created, id: newId, reference: created?.reference || reference }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } finally {
      // ensure connection released if it was acquired
      try { if (conn) conn.release(); } catch {}
    }
  } catch (err) {
    console.error("POST /api/complaints/file error", err);
    // if conn exists, try to release
    try { if (conn) conn.release(); } catch {}
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
