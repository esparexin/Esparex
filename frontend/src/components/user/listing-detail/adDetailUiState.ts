export type AdDetailUiState = {
  showReportDialog: boolean;
  showBoostDialog: boolean;
  showSoldDialog: boolean;
};

export type AdDetailUiAction =
  | { type: "setShowReportDialog"; payload: boolean }
  | { type: "setShowBoostDialog"; payload: boolean }
  | { type: "setShowSoldDialog"; payload: boolean };

export const initialAdDetailUiState: AdDetailUiState = {
  showReportDialog: false,
  showBoostDialog: false,
  showSoldDialog: false,
};

export function adDetailUiReducer(state: AdDetailUiState, action: AdDetailUiAction): AdDetailUiState {
  switch (action.type) {
    case "setShowReportDialog":
      if (state.showReportDialog === action.payload) return state;
      return { ...state, showReportDialog: action.payload };
    case "setShowBoostDialog":
      if (state.showBoostDialog === action.payload) return state;
      return { ...state, showBoostDialog: action.payload };
    case "setShowSoldDialog":
      if (state.showSoldDialog === action.payload) return state;
      return { ...state, showSoldDialog: action.payload };
    default:
      return state;
  }
}
