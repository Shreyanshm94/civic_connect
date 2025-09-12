import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateOtp, minutesFromNow } from "@/lib/otp";

export async function POST(req) {
  try {
    const { name, phone, password } = await req.json();

    // Basic validations
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return Response.json({ error: "Valid name is required" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(phone)) {
      return Response.json({ error: "Phone must be 10 digits" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const expires = minutesFromNow(10); // OTP valid 10 minutes

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // If already verified with same phone, block duplicate
      const [existing] = await conn.query(
        "SELECT id, is_verified FROM citizens WHERE phone = ?",
        [phone]
      );

      if (existing.length && existing[0].is_verified === 1) {
        await conn.rollback();
        await conn.release();
        return Response.json({ error: "Phone already registered & verified" }, { status: 409 });
      }

      if (!existing.length) {
        await conn.query(
          "INSERT INTO citizens (name, phone, password, is_verified, otp_code, otp_expires_at) VALUES (?, ?, ?, 0, ?, ?)",
          [name, phone, hashedPassword, otp, expires]
        );
      } else {
        // Re-attempt: refresh password + OTP and keep as unverified
        await conn.query(
          "UPDATE citizens SET name=?, password=?, is_verified=0, otp_code=?, otp_expires_at=? WHERE phone=?",
          [name, hashedPassword, otp, expires, phone]
        );
      }

      await conn.commit();
      await conn.release();
    } catch (dbErr) {
      await pool.query("ROLLBACK"); // extra safety if above failed
      console.error(dbErr);
      try { await pool.releaseConnection?.(); } catch {}
      return Response.json({ error: "Database error" }, { status: 500 });
    }

    // DEV: send OTP (replace with actual SMS provider later)
    console.log(`[DEV SMS] OTP for ${phone} is ${otp} (valid 10 min)`);

    return Response.json(
      { message: "Signup initiated. OTP sent to your phone.", phone },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
