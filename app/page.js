"use client";

import Header from "./components/Header";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100 p-6">
        <h1 className="text-3xl font-bold mb-4 text-green-700">Welcome to Civic Connect</h1>

        <p className="mb-6 text-gray-700">Report civic issues and track resolutions </p>

        <div className="flex gap-4 mb-4 flex-wrap justify-center">
          <Link href="/citizen/login">
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-36">Citizen Login</button>
          </Link>
          <Link href="/admin/login">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-36">Admin Login</button>
          </Link>
        </div>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/citizen/signup">
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-36">Citizen Signup</button>
          </Link>
          <Link href="/admin/signup">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-36">Admin Signup</button>
          </Link>
        </div>
      </main>
    </>
  );
}
