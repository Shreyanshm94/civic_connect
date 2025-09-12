// app/citizen/complaints/page.js
"use client";

import { useEffect, useState } from "react";

export default function ProblemsList() {
  const [pincode, setPincode] = useState("");
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(()=> {
    // fetch unresolved problems (replace with real API)
    async function load() {
      try {
        const res = await fetch("/api/complaint/unresolved");
        const data = await res.json();
        if (res.ok) setList(data.problems || []);
      } catch(e){ console.error(e); }
    }
    load();
  }, []);

  const upvote = async (id) => {
    try {
      const res = await fetch(`/api/complaint/${id}/upvote`, { method: "POST" });
      if (!res.ok) throw new Error("Upvote failed");
      setMsg("Upvoted!");
      // optimistic UI or reload
    } catch(e) { setMsg(e.message); }
  };

  const filtered = pincode ? list.filter(x=>x.pincode===pincode) : list;

  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-3xl bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Problems Registered (Unresolved)</h2>
        <div className="flex gap-3 mb-4">
          <input placeholder="Filter by pincode" value={pincode} onChange={(e)=>setPincode(e.target.value)} className="border p-2 rounded flex-1" />
          <button onClick={()=>setPincode("")} className="border px-3 rounded">Clear</button>
        </div>
        {msg && <div className="mb-3 text-sm text-green-600">{msg}</div>}

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-600">No unresolved problems found.</p>
        ) : (
          <ul className="space-y-3">
            {filtered.map(item => (
              <li key={item.id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{item.department} • {item.district}</div>
                    <div className="text-sm text-gray-700">{item.address} • {item.pincode}</div>
                    <div className="mt-2 text-sm">{item.complaint}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{item.upvotes || 0} votes</div>
                    <button onClick={()=>upvote(item.id)} className="mt-2 bg-blue-600 text-white px-2 py-1 rounded text-sm">Upvote</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
