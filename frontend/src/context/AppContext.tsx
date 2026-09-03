import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SafetyReport, DatasetInfo, User, CorrectiveAction, MultilingualStats, EMPTY_MULTILINGUAL_STATS } from '../types';

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
  multilingualStats: MultilingualStats;
  translateEnabled: boolean;
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
  multilingualStats: { ...EMPTY_MULTILINGUAL_STATS },
  translateEnabled: true,
};

// ─── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_DATASET'; payload: { dataset: DatasetInfo; reports: SafetyReport[]; isDemo: boolean; multilingualStats?: MultilingualStats } }
  | { type: 'CLEAR_DATASET' }
  | { type: 'UPDATE_REPORT'; payload: SafetyReport }
  | { type: 'SET_SELECTED_REPORT'; payload: SafetyReport | null }
  | { type: 'ADD_ACTION'; payload: CorrectiveAction }
  | { type: 'UPDATE_ACTION'; payload: CorrectiveAction }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'SET_TRANSLATE_ENABLED'; payload: boolean }
  | { type: 'SET_MULTILINGUAL_STATS'; payload: MultilingualStats };

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
        multilingualStats: action.payload.multilingualStats ?? computeStatsFromReports(action.payload.reports),
      };
    case 'CLEAR_DATASET':
      return { ...state, dataset: null, reports: [], isDemo: false, multilingualStats: { ...EMPTY_MULTILINGUAL_STATS } };
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
    case 'SET_TRANSLATE_ENABLED':
      return { ...state, translateEnabled: action.payload };
    case 'SET_MULTILINGUAL_STATS':
      return { ...state, multilingualStats: action.payload };
    default:
      return state;
  }
}

/** Derive multilingual stats from reports array (used for demo data) */
function computeStatsFromReports(reports: SafetyReport[]): MultilingualStats {
  const stats = { ...EMPTY_MULTILINGUAL_STATS, total: reports.length, translate_enabled: true };
  for (const r of reports) {
    switch (r.detected_language) {
      case 'en':      stats.english++;  break;
      case 'kn':      stats.kannada++;  break;
      case 'hi':      stats.hindi++;    break;
      default:        stats.english++;  break; // demo data is English
    }
    if (r.is_translated)     stats.translated++;
    if (r.translation_error) stats.translation_errors++;
  }
  return stats;
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
