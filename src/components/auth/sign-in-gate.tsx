"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Lock, LogIn } from "lucide-react";
import Link from "next/link";

interface SignInGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  featureName?: string;
}

export function SignInGate({
  open,
  onOpenChange,
  message = "Sign in to unlock this feature",
  featureName,
}: SignInGateProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Close className="absolute right-3 top-3 rounded-lg p-1 text-text-secondary hover:bg-surface-hover">
            <X className="h-4 w-4" />
          </Dialog.Close>

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>

            <div>
              <Dialog.Title className="text-lg font-semibold text-text-primary">
                {featureName ? `Unlock ${featureName}` : "Sign In Required"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-text-secondary">
                {message}
              </Dialog.Description>
            </div>

            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>

            <p className="text-xs text-text-secondary">
              Free access to all features when you sign in
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
