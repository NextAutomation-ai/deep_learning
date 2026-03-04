"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";

export function useGuestGate() {
  const { data: session } = useSession();
  const isGuest = !session?.user;
  const [gateOpen, setGateOpen] = useState(false);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (isGuest) {
        setGateOpen(true);
      } else {
        action();
      }
    },
    [isGuest]
  );

  return { isGuest, gateOpen, setGateOpen, requireAuth };
}
