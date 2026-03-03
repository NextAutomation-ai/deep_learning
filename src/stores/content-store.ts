import { create } from "zustand";

interface ContentStore {
  uploadDialogOpen: boolean;
  setUploadDialogOpen: (open: boolean) => void;
  selectedContentId: string | null;
  setSelectedContentId: (id: string | null) => void;
}

export const useContentStore = create<ContentStore>((set) => ({
  uploadDialogOpen: false,
  setUploadDialogOpen: (open) => set({ uploadDialogOpen: open }),
  selectedContentId: null,
  setSelectedContentId: (id) => set({ selectedContentId: id }),
}));
