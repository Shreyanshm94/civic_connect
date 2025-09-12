"use client";

import Header from "../../components/Header";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Decode JWT payload (no verification) */
function parseJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch {
    return null;
  }
}

export default function CitizenDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("cc_token") : null;
    if (!token) {
      router.push("/citizen/login");
      return;
    }

    const payload = parseJwtPayload(token);
    if (!payload) {
      localStorage.removeItem("cc_token");
      localStorage.removeItem("cc_user");
      router.push("/citizen/login");
      return;
    }

    const storedUser = localStorage.getItem("cc_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        return;
      } catch {}
    }

    setUser({ id: payload.sub, phone: payload.phone, name: payload.name || "" });
  }, [router]);

  const logout = () => {
    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_user");
    router.push("/citizen/login");
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-64px)] bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome{user.name ? `, ${user.name}` : ""} 👋</h1>
              <p className="text-sm text-gray-600">Phone: {user.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/citizen/signup")} className="px-3 py-1 border rounded">Edit Profile</button>
              <button onClick={logout} className="px-3 py-1 bg-red-600 text-white rounded">Logout</button>
            </div>
          </div>

          <hr className="my-4" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => router.push("/citizen/complaint/file")} className="p-4 bg-green-600 text-white rounded shadow">File Complaint</button>

            {/* corrected: goes to the actual location of the complaints list */}
            <button onClick={() => router.push("/citizen/dashboard/my-complaints")} className="p-4 bg-blue-600 text-white rounded shadow">Problems Registered</button>

            <button onClick={() => router.push("/citizen/complaint/track")} className="p-4 bg-yellow-600 text-white rounded shadow">Track Your Complaint</button>
            <button onClick={() => router.push("/citizen/defaulters")} className="p-4 bg-red-600 text-white rounded shadow">Defaulters</button>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <strong>Note:</strong> This is a simple protected dashboard for the MVP. We'll add complaint forms, lists, upvotes and tracking next.
          </div>
        </div>
      </div>
    </>
  );
}
