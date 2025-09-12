'use client';
import React, { useState } from 'react';

export default function ComplaintCard({ complaint, onUpvoted }) {
  // complaint shape: { id, reference, title, complaint, pincode, upvotes, photo_path, created_at, district, department, reporter_name }
  const [upvotes, setUpvotes] = useState(complaint.upvotes ?? 0);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false); // optimistic only; backend will reject duplicates

  async function handleUpvote() {
    if (loading || voted) return;
    setLoading(true);
    // optimistic
    setUpvotes(u => u + 1);
    setVoted(true);

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/upvote`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok) {
        // revert optimistic if server returned error
        setUpvotes(u => Math.max(0, u - 1));
        setVoted(false);
        alert(j?.error || 'Upvote failed');
      } else if (j && j.voted === false) {
        // already voted on server, keep count but mark voted
        setVoted(true);
      }
      if (onUpvoted) onUpvoted(complaint.id, j?.voted ?? true);
    } catch (err) {
      // network error - revert
      setUpvotes(u => Math.max(0, u - 1));
      setVoted(false);
      alert('Network error while upvoting');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="border rounded p-4 mb-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{complaint.title || complaint.reference}</h3>
          <p className="text-sm text-gray-600">{complaint.complaint || ''}</p>
          <p className="text-xs text-gray-500 mt-2">
            Pin: <strong>{complaint.pincode}</strong> • Dept: {complaint.department} • District: {complaint.district}
          </p>
          <p className="text-xs text-gray-500">Reported by: {complaint.reporter_name || 'Anonymous'}</p>
        </div>

        <div className="text-right">
          {complaint.photo_path ? (
            <img src={complaint.photo_path} alt="photo" className="w-24 h-24 object-cover rounded" />
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center text-xs">No photo</div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-500">Created: {new Date(complaint.created_at).toLocaleString()}</div>
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded ${voted ? 'bg-gray-300' : 'bg-blue-600 text-white'}`}
            onClick={handleUpvote}
            disabled={loading || voted}
            aria-pressed={voted}
          >
            {voted ? 'Upvoted' : 'Upvote'} ({upvotes})
          </button>
          <a
            href={`/citizen/complaint/track/${complaint.reference || complaint.id}`}
            className="px-3 py-1 border rounded text-sm"
          >
            Track
          </a>
        </div>
      </div>
    </article>
  );
}
