
import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface QuizAnswers {
  product: string;
  target: string;
  pain: string;
  benefit: string;
  price: string;
  competitors: string;
  differential: string;
  objective: string;
}

export interface Project {
  id: string;
  name: string;
  answers: QuizAnswers;
  adCopy: string;
  videoScript: string;
  createdAt: Date;
}

interface AppState {
  currentProject: Project | null;
  projects: Project[];
  quizAnswers: Partial<QuizAnswers>;
  isDarkMode: boolean;
  currentQuizStep: number;
}

type AppAction = 
  | { type: 'SET_QUIZ_ANSWER'; field: keyof QuizAnswers; value: string }
  | { type: 'SET_QUIZ_STEP'; step: number }
  | { type: 'CREATE_PROJECT'; project: Project }
  | { type: 'SET_CURRENT_PROJECT'; project: Project }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'LOAD_STATE'; state: Partial<AppState> };

const initialState: AppState = {
  currentProject: null,
  projects: [],
  quizAnswers: {},
  isDarkMode: true, // Default to dark mode
  currentQuizStep: 0,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_QUIZ_ANSWER':
      return {
        ...state,
        quizAnswers: {
          ...state.quizAnswers,
          [action.field]: action.value,
        },
      };
    case 'SET_QUIZ_STEP':
      return {
        ...state,
        currentQuizStep: action.step,
      };
    case 'CREATE_PROJECT':
      return {
        ...state,
        currentProject: action.project,
        projects: [action.project, ...state.projects],
        quizAnswers: {},
        currentQuizStep: 0,
      };
    case 'SET_CURRENT_PROJECT':
      return {
        ...state,
        currentProject: action.project,
      };
    case 'TOGGLE_DARK_MODE':
      return {
        ...state,
        isDarkMode: !state.isDarkMode,
      };
    case 'LOAD_STATE':
      return {
        ...state,
        ...action.state,
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('copychief-state'); // Updated storage key
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        // Convert date strings back to Date objects
        if (parsedState.projects) {
          parsedState.projects = parsedState.projects.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
          }));
        }
        if (parsedState.currentProject) {
          parsedState.currentProject.createdAt = new Date(parsedState.currentProject.createdAt);
        }
        dispatch({ type: 'LOAD_STATE', state: parsedState });
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('copychief-state', JSON.stringify(state)); // Updated storage key
  }, [state]);

  // Apply dark mode class
  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
