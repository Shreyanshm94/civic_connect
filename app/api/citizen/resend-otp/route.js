import pool from "@/lib/db";
import { generateOtp, minutesFromNow } from "@/lib/otp";

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!/^\d{10}$/.test(phone)) {
      return Response.json({ error: "Invalid phone" }, { status: 400 });
    }

    const [rows] = await pool.query(
      "SELECT id, is_verified, otp_expires_at FROM citizens WHERE phone=?",
      [phone]
    );

    if (!rows.length) return Response.json({ error: "User not found" }, { status: 404 });
    if (rows[0].is_verified === 1) {
      return Response.json({ message: "Already verified" }, { status: 200 });
    }

    // Simple cooldown: block if we just sent (≈ last 1 min)
    const now = new Date();
    const exp = rows[0].otp_expires_at ? new Date(rows[0].otp_expires_at) : null;
    if (exp) {
      const msLeft = exp - now;
      // If OTP lifetime is 10 min, and >9 min remain, assume last send <1 min ago
      if (msLeft > 9 * 60 * 1000) {
        return Response.json({ error: "Please wait a minute before resending." }, { status: 429 });
      }
    }

    const otp = generateOtp();
    const expires = minutesFromNow(10);
    await pool.query(
      "UPDATE citizens SET otp_code=?, otp_expires_at=? WHERE phone=?",
      [otp, expires, phone]
    );

    console.log(`[DEV SMS] RESEND OTP for ${phone}: ${otp} (valid 10 min)`);
    return Response.json({ message: "OTP resent" }, { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
