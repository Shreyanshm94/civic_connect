// app/citizen/defaulters/page.js
"use client";

import { useEffect, useState } from "react";

export default function Defaulters() {
  const [list, setList] = useState([]);

  useEffect(()=> {
    async function load() {
      try {
        const res = await fetch("/api/complaints/defaulters");
        const data = await res.json();
        if (res.ok) setList(data.defaulters || []);
      } catch(e){ console.error(e); }
    }
    load();
  }, []);

  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-3xl bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Defaulters (Unresolved &gt; 15 days)</h2>
        {list.length === 0 ? (
          <p className="text-sm text-gray-600">No defaulters found currently.</p>
        ) : (
          <ul className="space-y-3">
            {list.map(d => (
              <li key={d.id} className="border rounded p-3">
                <div className="font-semibold">{d.department} • {d.district}</div>
                <div className="text-sm text-gray-700">{d.address} • {d.pincode}</div>
                <div className="text-xs text-gray-500 mt-1">Officer: {d.nodal_officer || "N/A"} • Date: {new Date(d.created_at).toLocaleDateString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
