import { create } from "zustand";

type TransactionStatus = {
  digest: string;
  status: "success" | "failure" | undefined;
};

interface HistoryStore {
  history: TransactionStatus[];
  ingestHistoryStream: (data: TransactionStatus[], options?: { stepMs?: number }) => void;
  cancelHistoryStream: () => void;
}

let historyStreamToken = 0;

export const useHistoryStore = create<HistoryStore>((set) => ({
  history: [],

  cancelHistoryStream: () => {
    historyStreamToken += 1;
  },

  ingestHistoryStream: (data, options = {}) => {
    if (data.length === 0) {
      return;
    }
    historyStreamToken += 1;
    const token = historyStreamToken;
    const stepMs = options.stepMs ?? 500;

    const addAt = (index: number) => {
      if (token !== historyStreamToken) {
        return;
      }
      const row = data[index];
      if (!row) {
        return;
      }
      set((state) => ({ history: [...state.history, row].slice(-50) }));
      if (index + 1 < data.length) {
        setTimeout(() => {
          addAt(index + 1);
        }, stepMs);
      }
    };

    addAt(0);
  },
}));

export const HistoryState = useHistoryStore.getState;
