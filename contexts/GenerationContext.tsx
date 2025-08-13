"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import { Mode, AspectRatio, Quality } from "@/libs/app-config/runtime";

// Types
export interface GenerationState {
  // Form state
  mode: Mode;
  input1File: File | null;
  input2File: File | null;
  roomType: string;
  style: string;
  prompt: string;
  aspectRatio: AspectRatio;
  quality: Quality;
  variants: number;
  
  // Generation state
  isGenerating: boolean;
  currentJobId: string | null;
  generationStatus: 'idle' | 'uploading' | 'creating' | 'processing' | 'succeeded' | 'failed';
  error: string | null;
  
  // Results
  results: GenerationResult[] | null;
}

export interface GenerationResult {
  id: string;
  url: string;
  thumbUrl?: string;
  index: number;
}

// Actions
type GenerationAction =
  | { type: 'SET_MODE'; payload: Mode }
  | { type: 'SET_INPUT1_FILE'; payload: File | null }
  | { type: 'SET_INPUT2_FILE'; payload: File | null }
  | { type: 'SET_ROOM_TYPE'; payload: string }
  | { type: 'SET_STYLE'; payload: string }
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'SET_ASPECT_RATIO'; payload: AspectRatio }
  | { type: 'SET_QUALITY'; payload: Quality }
  | { type: 'SET_VARIANTS'; payload: number }
  | { type: 'START_GENERATION'; payload: string } // jobId
  | { type: 'UPDATE_STATUS'; payload: GenerationState['generationStatus'] }
  | { type: 'SET_RESULTS'; payload: GenerationResult[] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET_GENERATION' }
  | { type: 'RESET_FORM' };

// Initial state
const initialState: GenerationState = {
  mode: 'redesign',
  input1File: null,
  input2File: null,
  roomType: '',
  style: '',
  prompt: '',
  aspectRatio: '1:1',
  quality: 'auto',
  variants: 2,
  isGenerating: false,
  currentJobId: null,
  generationStatus: 'idle',
  error: null,
  results: null,
};

// Reducer
function generationReducer(state: GenerationState, action: GenerationAction): GenerationState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
        // Clear files if switching to/from modes that don't need them
        input1File: action.payload === 'imagine' ? null : state.input1File,
        input2File: action.payload !== 'compose' ? null : state.input2File,
        // Clear error when changing mode
        error: null,
      };
      
    case 'SET_INPUT1_FILE':
      return { ...state, input1File: action.payload, error: null };
      
    case 'SET_INPUT2_FILE':
      return { ...state, input2File: action.payload, error: null };
      
    case 'SET_ROOM_TYPE':
      return { ...state, roomType: action.payload };
      
    case 'SET_STYLE':
      return { ...state, style: action.payload };
      
    case 'SET_PROMPT':
      return { ...state, prompt: action.payload, error: null };
      
    case 'SET_ASPECT_RATIO':
      return { ...state, aspectRatio: action.payload };
      
    case 'SET_QUALITY':
      return { ...state, quality: action.payload };
      
    case 'SET_VARIANTS':
      return { ...state, variants: action.payload };
      
    case 'START_GENERATION':
      return {
        ...state,
        isGenerating: true,
        currentJobId: action.payload,
        generationStatus: 'uploading',
        error: null,
        results: null,
      };
      
    case 'UPDATE_STATUS':
      return {
        ...state,
        generationStatus: action.payload,
        isGenerating: action.payload === 'processing' || action.payload === 'uploading' || action.payload === 'creating',
      };
      
    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload,
        generationStatus: 'succeeded',
        isGenerating: false,
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        generationStatus: 'failed',
        isGenerating: false,
      };
      
    case 'RESET_GENERATION':
      return {
        ...state,
        isGenerating: false,
        currentJobId: null,
        generationStatus: 'idle',
        error: null,
        results: null,
      };
      
    case 'RESET_FORM':
      return {
        ...initialState,
        // Keep current mode unless explicitly changed
        mode: state.mode,
      };
      
    default:
      return state;
  }
}

// Context
interface GenerationContextValue {
  state: GenerationState;
  dispatch: React.Dispatch<GenerationAction>;
  
  // Convenience functions
  setMode: (mode: Mode) => void;
  setInput1File: (file: File | null) => void;
  setInput2File: (file: File | null) => void;
  setRoomType: (roomType: string) => void;
  setStyle: (style: string) => void;
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setQuality: (quality: Quality) => void;
  setVariants: (variants: number) => void;
  startGeneration: (jobId: string) => void;
  updateStatus: (status: GenerationState['generationStatus']) => void;
  setResults: (results: GenerationResult[]) => void;
  setError: (error: string) => void;
  resetGeneration: () => void;
  resetForm: () => void;
  
  // Computed values
  canGenerate: boolean;
  requiredFiles: string[];
  missingRequirements: string[];
}

const GenerationContext = createContext<GenerationContextValue | undefined>(undefined);

// Provider
interface GenerationProviderProps {
  children: ReactNode;
}

export function GenerationProvider({ children }: GenerationProviderProps) {
  const [state, dispatch] = useReducer(generationReducer, initialState);

  // Convenience functions
  const setMode = (mode: Mode) => dispatch({ type: 'SET_MODE', payload: mode });
  const setInput1File = (file: File | null) => dispatch({ type: 'SET_INPUT1_FILE', payload: file });
  const setInput2File = (file: File | null) => dispatch({ type: 'SET_INPUT2_FILE', payload: file });
  const setRoomType = (roomType: string) => dispatch({ type: 'SET_ROOM_TYPE', payload: roomType });
  const setStyle = (style: string) => dispatch({ type: 'SET_STYLE', payload: style });
  const setPrompt = (prompt: string) => dispatch({ type: 'SET_PROMPT', payload: prompt });
  const setAspectRatio = (ratio: AspectRatio) => dispatch({ type: 'SET_ASPECT_RATIO', payload: ratio });
  const setQuality = (quality: Quality) => dispatch({ type: 'SET_QUALITY', payload: quality });
  const setVariants = (variants: number) => dispatch({ type: 'SET_VARIANTS', payload: variants });
  const startGeneration = (jobId: string) => dispatch({ type: 'START_GENERATION', payload: jobId });
  const updateStatus = (status: GenerationState['generationStatus']) => dispatch({ type: 'UPDATE_STATUS', payload: status });
  const setResults = (results: GenerationResult[]) => dispatch({ type: 'SET_RESULTS', payload: results });
  const setError = (error: string) => dispatch({ type: 'SET_ERROR', payload: error });
  const resetGeneration = () => dispatch({ type: 'RESET_GENERATION' });
  const resetForm = () => dispatch({ type: 'RESET_FORM' });

  // Computed values
  const requiredFiles: string[] = [];
  if (state.mode === 'redesign' || state.mode === 'staging') {
    requiredFiles.push('Room image');
  }
  if (state.mode === 'compose') {
    requiredFiles.push('Base room image', 'Reference image');
  }

  const missingRequirements: string[] = [];
  
  // Check file requirements
  if ((state.mode === 'redesign' || state.mode === 'staging') && !state.input1File) {
    missingRequirements.push('Room image required');
  }
  if (state.mode === 'compose') {
    if (!state.input1File) missingRequirements.push('Base room image required');
    if (!state.input2File) missingRequirements.push('Reference image required');
  }
  
  // Check prompt requirement for imagine mode
  if (state.mode === 'imagine' && !state.prompt.trim()) {
    missingRequirements.push('Description required for Imagine mode');
  }

  const canGenerate = missingRequirements.length === 0 && !state.isGenerating;

  const value: GenerationContextValue = {
    state,
    dispatch,
    setMode,
    setInput1File,
    setInput2File,
    setRoomType,
    setStyle,
    setPrompt,
    setAspectRatio,
    setQuality,
    setVariants,
    startGeneration,
    updateStatus,
    setResults,
    setError,
    resetGeneration,
    resetForm,
    canGenerate,
    requiredFiles,
    missingRequirements,
  };

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}

// Hook
export function useGeneration() {
  const context = useContext(GenerationContext);
  if (context === undefined) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return context;
}