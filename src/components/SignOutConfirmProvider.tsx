"use client";

import { createContext, useCallback, useContext, useState } from "react";

type SignOutConfirmContextValue = {
  open: boolean;
  requestSignOut: () => void;
  closeModal: () => void;
};

const SignOutConfirmContext = createContext<SignOutConfirmContextValue | null>(null);

export function SignOutConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const requestSignOut = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <SignOutConfirmContext.Provider value={{ open, requestSignOut, closeModal }}>
      {children}
    </SignOutConfirmContext.Provider>
  );
}

export function useSignOutConfirm() {
  const ctx = useContext(SignOutConfirmContext);
  if (!ctx) throw new Error("useSignOutConfirm must be used within SignOutConfirmProvider");
  return ctx;
}
