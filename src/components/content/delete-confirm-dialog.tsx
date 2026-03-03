"use client";

import { ConfirmDialog } from "@/components/settings/confirm-dialog";

interface DeleteConfirmDialogProps {
  contentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteConfirmDialog({
  contentTitle,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Content?"
      description={`This will permanently delete "${contentTitle}" and all associated concepts, flashcards, quiz history, and progress. This action cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={onConfirm}
      variant="danger"
      isLoading={isLoading}
    />
  );
}
