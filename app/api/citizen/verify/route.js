// app/api/citizen/verify/route.js
import pool from "@/lib/db";

export async function POST(req) {
  try {
    const { phone, otp } = await req.json();

    // validate inputs
    if (!/^\d{10}$/.test(phone) || !/^\d{6}$/.test(otp)) {
      return Response.json({ error: "Invalid phone or OTP format" }, { status: 400 });
    }

    // fetch user
    const [rows] = await pool.query(
      "SELECT id, otp_code, otp_expires_at, is_verified FROM citizens WHERE phone=?",
      [phone]
    );
    if (!rows.length) return Response.json({ error: "User not found" }, { status: 404 });

    const user = rows[0];
    if (user.is_verified === 1) {
      return Response.json({ message: "Already verified" }, { status: 200 });
    }

    if (!user.otp_code || !user.otp_expires_at) {
      return Response.json({ error: "No OTP found. Please resend." }, { status: 400 });
    }

    const now = new Date();
    const exp = new Date(user.otp_expires_at);
    if (now > exp) {
      return Response.json({ error: "OTP expired. Please resend." }, { status: 410 });
    }

    if (String(user.otp_code) !== String(otp)) {
      return Response.json({ error: "Incorrect OTP" }, { status: 401 });
    }

    // mark verified and clear OTP
    await pool.query(
      "UPDATE citizens SET is_verified=1, otp_code=NULL, otp_expires_at=NULL WHERE id=?",
      [user.id]
    );

    return Response.json({ message: "Phone verified successfully" }, { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
