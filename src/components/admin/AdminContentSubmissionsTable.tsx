"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { detectPlatform } from "@/lib/testimonials";

type Row = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  profileUrl: string;
  videoUrl: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
};

export function AdminContentSubmissionsTable({ submissions }: { submissions: Row[] }) {
  const { t } = useLocale();
  const [rows, setRows] = useState(submissions);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);

  async function decide(id: string, action: "approve" | "reject") {
    setActingId(id);
    const thumbnailUrl = thumbnails[id]?.trim();
    const res = await fetch(`/api/admin/content-submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...(action === "approve" && thumbnailUrl ? { thumbnailUrl } : {}) }),
    });
    setActingId(null);
    if (res.ok) {
      const data = await res.json();
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: data.status } : r)));
    }
  }

  const statusLabel: Record<Row["status"], string> = {
    PENDING: t.admin.statusPending,
    APPROVED: t.admin.statusApproved,
    REJECTED: t.admin.statusRejected,
  };

  return (
    <>
      <h1 className="auth-title">{t.admin.contentSubmissions}</h1>
      {rows.length === 0 ? (
        <p style={{ padding: "30px 0", opacity: 0.6 }}>{t.admin.noSubmissions}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.admin.submissionUser}</th>
              <th>{t.admin.submissionProfile}</th>
              <th>{t.admin.submissionVideo}</th>
              <th>{t.admin.submissionStatus}</th>
              <th>{t.admin.submissionThumbnail}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.user.firstName} {r.user.lastName}
                  <br />
                  <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>{r.user.email}</span>
                </td>
                <td>
                  <a href={r.profileUrl} target="_blank" rel="noopener noreferrer">
                    {t.admin.openLink}
                  </a>
                </td>
                <td>
                  <a href={r.videoUrl} target="_blank" rel="noopener noreferrer">
                    {t.admin.openLink}
                  </a>
                </td>
                <td>{statusLabel[r.status]}</td>
                <td>
                  {r.status === "PENDING" &&
                    (detectPlatform(r.videoUrl) === "tiktok" ? (
                      <span style={{ fontSize: "0.78rem", opacity: 0.6 }}>{t.admin.thumbnailAuto}</span>
                    ) : (
                      <input
                        placeholder={t.admin.thumbnailManualPlaceholder}
                        value={thumbnails[r.id] ?? ""}
                        onChange={(e) => setThumbnails((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        style={{ minWidth: 160 }}
                      />
                    ))}
                </td>
                <td>
                  {r.status === "PENDING" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-brass"
                        disabled={actingId === r.id}
                        onClick={() => decide(r.id, "approve")}
                      >
                        {t.admin.approve}
                      </button>
                      <button
                        className="btn btn-ghost-outline"
                        disabled={actingId === r.id}
                        onClick={() => decide(r.id, "reject")}
                      >
                        {t.admin.reject}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
