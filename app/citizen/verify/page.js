"use client";


import Header from "../../components/Header";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = sp.get("phone") || "";
    setPhone(p);
  }, [sp]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!/^\d{10}$/.test(phone)) return setErr("Invalid phone in URL.");
    if (!/^\d{6}$/.test(otp)) return setErr("Enter 6-digit OTP.");

    setLoading(true);
    try {
      const res = await fetch("/api/citizen/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "Verification failed");
      } else {
        setMsg("Verified! Redirecting to login…");
        setTimeout(() => router.push("/citizen/login"), 800);
      }
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setErr("");
    setMsg("");
    if (!/^\d{10}$/.test(phone)) return setErr("Invalid phone in URL.");

    setLoading(true);
    try {
      const res = await fetch("/api/citizen/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "Could not resend OTP");
      else setMsg("OTP resent!");
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-gray-100 p-4">
        <form onSubmit={submit} className="bg-white shadow-md rounded-lg p-6 w-full max-w-sm">
          <h2 className="text-xl mb-4 font-bold text-green-600 text-center">Verify Phone</h2>

          {phone ? (
            <p className="text-sm mb-3 text-gray-700 text-center">OTP sent to: <b>{phone}</b></p>
          ) : (
            <p className="text-sm mb-3 text-red-600 text-center">Phone missing in URL</p>
          )}

          {err && <div className="mb-3 text-sm text-red-600 text-center">{err}</div>}
          {msg && <div className="mb-3 text-sm text-green-600 text-center">{msg}</div>}

          <input className="border p-2 mb-3 w-full rounded text-black bg-white" placeholder="Enter 6-digit OTP" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required />

          <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700 disabled:opacity-60">{loading ? "Verifying..." : "Verify"}</button>

          <button type="button" onClick={resend} disabled={loading} className="mt-3 border px-4 py-2 rounded w-full hover:bg-gray-50 disabled:opacity-60">Resend OTP</button>
        </form>
      </div>
    </>
  );
}
