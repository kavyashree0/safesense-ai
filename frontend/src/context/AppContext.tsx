import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SafetyReport, DatasetInfo, User, CorrectiveAction } from '../types';

// ─── State ────────────────────────────────────────────────────────────────────
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  dataset: DatasetInfo | null;
  reports: SafetyReport[];
  selectedReport: SafetyReport | null;
  actions: CorrectiveAction[];
  sidebarOpen: boolean;
  isDemo: boolean;
}

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  dataset: null,
  reports: [],
  selectedReport: null,
  actions: [],
  sidebarOpen: true,
  isDemo: false,
};

// ─── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_DATASET'; payload: { dataset: DatasetInfo; reports: SafetyReport[]; isDemo: boolean } }
  | { type: 'CLEAR_DATASET' }
  | { type: 'UPDATE_REPORT'; payload: SafetyReport }
  | { type: 'SET_SELECTED_REPORT'; payload: SafetyReport | null }
  | { type: 'ADD_ACTION'; payload: CorrectiveAction }
  | { type: 'UPDATE_ACTION'; payload: CorrectiveAction }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { ...initialState };
    case 'SET_DATASET':
      return {
        ...state,
        dataset: action.payload.dataset,
        reports: action.payload.reports,
        isDemo: action.payload.isDemo,
      };
    case 'CLEAR_DATASET':
      return { ...state, dataset: null, reports: [], isDemo: false };
    case 'UPDATE_REPORT':
      return {
        ...state,
        reports: state.reports.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
        selectedReport:
          state.selectedReport?.id === action.payload.id
            ? action.payload
            : state.selectedReport,
      };
    case 'SET_SELECTED_REPORT':
      return { ...state, selectedReport: action.payload };
    case 'ADD_ACTION':
      return { ...state, actions: [...state.actions, action.payload] };
    case 'UPDATE_ACTION':
      return {
        ...state,
        actions: state.actions.map(a =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface AppContextValue extends AppState {
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
