"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";

type Row = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string | Date;
  suspended: boolean;
  orderCount: number;
  totalSpentCents: number;
};

type StatusFilter = "all" | "active" | "suspended";

export function AdminUsersList({ users }: { users: Row[] }) {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter === "active" && u.suspended) return false;
      if (statusFilter === "suspended" && !u.suspended) return false;
      if (q) {
        const haystack = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [users, search, statusFilter]);

  return (
    <>
      <h1 className="auth-title">{t.admin.users}</h1>
      <p className="auth-sub">{t.admin.usersSubtitle}</p>

      <div className="admin-filter-bar">
        <input
          type="text"
          className="admin-filter-search"
          placeholder={t.admin.usersSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="all">{t.admin.allStatuses}</option>
          <option value="active">{t.admin.usersActive}</option>
          <option value="suspended">{t.admin.usersSuspended}</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="admin-empty-note">{t.admin.noUsersFound}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.admin.usersNameCol}</th>
              <th>{t.admin.usersEmailCol}</th>
              <th>{t.admin.usersRegisteredCol}</th>
              <th>{t.admin.usersOrderCountCol}</th>
              <th>{t.admin.usersTotalSpentCol}</th>
              <th>{t.admin.ordersStatusCol}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td dir="ltr" style={{ textAlign: "start" }}>
                  {u.email}
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : locale)}</td>
                <td>{u.orderCount}</td>
                <td>{formatPriceCents(u.totalSpentCents, "EUR")}</td>
                <td>
                  <span className={`admin-stock-badge ${u.suspended ? "out-of-stock" : "in-stock"}`}>
                    {u.suspended ? t.admin.usersSuspended : t.admin.usersActive}
                  </span>
                </td>
                <td>
                  <Link href={`/admin/users/${u.id}`} className="btn btn-ghost-outline">
                    {t.admin.usersViewDetail}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
