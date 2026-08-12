"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useLocale } from "@/components/LocaleProvider";
import { useSignOutConfirm } from "@/components/SignOutConfirmProvider";

export function SignOutConfirmModal() {
  const { t } = useLocale();
  const { open, closeModal } = useSignOutConfirm();
  const [signingOut, setSigningOut] = useState(false);

  async function confirmSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <div className={`modal-backdrop${open ? " open" : ""}`} onClick={closeModal}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <h2>{t.auth.signOutConfirmTitle}</h2>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost-outline" onClick={closeModal} disabled={signingOut}>
            {t.auth.signOutConfirmCancel}
          </button>
          <button type="button" className="btn btn-brass" onClick={confirmSignOut} disabled={signingOut}>
            {signingOut ? "…" : t.auth.signOutConfirmYes}
          </button>
        </div>
      </div>
    </div>
  );
}
