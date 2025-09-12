// components/UpvoteButton.jsx
'use client';
import React, { useState } from 'react';

export default function UpvoteButton({ complaintId, initialUpvotes = 0 }) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);

  async function handleUpvote() {
    if (loading || voted) return;
    setLoading(true);
    // optimistic
    setUpvotes(u => u + 1);
    setVoted(true);

    try {
      const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}/upvote`, { method: 'POST' });
      const j = await res.json().catch(()=>null);

      if (!res.ok) {
        // revert
        setUpvotes(u => Math.max(0, u - 1));
        setVoted(false);
        alert(j?.error || 'Upvote failed');
      } else {
        // if backend returned voted:false, it means already voted; keep voted=true (disable)
        if (j && j.voted === false) {
          // no change to upvotes (server likely had it already)
          setVoted(true);
        }
      }
    } catch (err) {
      setUpvotes(u => Math.max(0, u - 1));
      setVoted(false);
      alert('Network error while upvoting');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={handleUpvote}
        disabled={loading || voted}
        aria-pressed={voted}
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #ddd',
          background: voted ? '#eee' : '#0b79f7',
          color: voted ? '#333' : '#fff',
          cursor: loading || voted ? 'not-allowed' : 'pointer'
        }}
      >
        {voted ? 'Upvoted' : 'Upvote'} ({upvotes})
      </button>
    </div>
  );
}
