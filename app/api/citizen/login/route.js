import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES = "7d";

export async function POST(req) {
  try {
    const { phone, password } = await req.json();

    if (!/^\d{10}$/.test(phone)) {
      return Response.json({ error: "Phone must be 10 digits" }, { status: 400 });
    }
    if (!password) {
      return Response.json({ error: "Password is required" }, { status: 400 });
    }

    const [rows] = await pool.query(
      "SELECT id, name, password, is_verified FROM citizens WHERE phone=?",
      [phone]
    );
    if (!rows.length) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const user = rows[0];
    if (user.is_verified !== 1) {
      return Response.json({ error: "Please verify OTP first" }, { status: 403 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      { sub: user.id, role: "citizen", phone },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // For MVP, return token in body. Later, set secure httpOnly cookie.
    return Response.json({ message: "Login success", token, user: { id: user.id, name: user.name, phone } }, { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
