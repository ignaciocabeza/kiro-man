import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import type { GameState, AbilityType } from '../types';
import { GameStatus } from '../types';
import { GAME_CONFIG } from '../config/gameConfig';

// --- Dispatch interface (all actions) ---
export interface GameDispatch {
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  nextLevel: () => void;
  setGameOver: () => void;
  updateScore: (points: number) => void;
  updateTimer: (seconds: number) => void;
  collectAbility: (type: AbilityType) => void;
  activateAbility: (type: AbilityType) => void;
  deactivateAbility: () => void;
  addPillSaved: () => void;
  addPillEatenByEnemy: () => void;
}

// --- Combined type (backward compat) ---
interface GameStateContextType extends GameState, GameDispatch {}

const initialState: GameState = {
  status: GameStatus.MENU,
  currentLevel: 1,
  score: 0,
  timer: GAME_CONFIG.LEVELS[1].timeLimit,
  abilities: {
    vibe: false,
    tokenBurner: false,
    debug: false,
  },
  activeAbility: null,
  abilityEndTime: null,
  pillsSaved: 0,
  pillsEatenByEnemy: 0,
};

// --- Three contexts for granular subscriptions ---
const GameStateContext = createContext<GameStateContextType | null>(null);
const GameDispatchContext = createContext<GameDispatch | null>(null);
const GameStateRefContext = createContext<React.MutableRefObject<GameState> | null>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(initialState);
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  const abilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startGame = useCallback(() => {
    setState({
      ...initialState,
      status: GameStatus.PLAYING,
      timer: GAME_CONFIG.LEVELS[1].timeLimit,
    });
  }, []);

  const pauseGame = useCallback(() => {
    setState((prev) => ({ ...prev, status: GameStatus.PAUSED }));
  }, []);

  const resumeGame = useCallback(() => {
    setState((prev) => ({ ...prev, status: GameStatus.PLAYING }));
  }, []);

  const restartGame = useCallback(() => {
    if (abilityTimeoutRef.current) {
      clearTimeout(abilityTimeoutRef.current);
    }
    setState(initialState);
  }, []);

  const setGameOver = useCallback(() => {
    if (abilityTimeoutRef.current) {
      clearTimeout(abilityTimeoutRef.current);
    }
    setState((prev) => ({ ...prev, status: GameStatus.GAME_OVER }));
  }, []);

  const nextLevel = useCallback(() => {
    setState((prev) => {
      const next = prev.currentLevel + 1;
      if (next > 5) {
        return { ...prev, status: GameStatus.VICTORY };
      }
      return {
        ...prev,
        status: GameStatus.LEVEL_TRANSITION,
        currentLevel: next,
        timer: GAME_CONFIG.LEVELS[next].timeLimit,
        abilities: { vibe: false, tokenBurner: false, debug: false },
        activeAbility: null,
      };
    });
  }, []);

  const updateScore = useCallback((points: number) => {
    setState((prev) => ({ ...prev, score: prev.score + points }));
  }, []);

  const updateTimer = useCallback((seconds: number) => {
    setState((prev) => ({ ...prev, timer: seconds }));
  }, []);

  const collectAbility = useCallback((type: AbilityType) => {
    setState((prev) => ({
      ...prev,
      abilities: { ...prev.abilities, [type]: true },
    }));
  }, []);

  const deactivateAbility = useCallback(() => {
    setState((prev) => ({ ...prev, activeAbility: null, abilityEndTime: null }));
  }, []);

  const addPillSaved = useCallback(() => {
    setState((prev) => ({ ...prev, pillsSaved: prev.pillsSaved + 1 }));
  }, []);

  const addPillEatenByEnemy = useCallback(() => {
    setState((prev) => ({ ...prev, pillsEatenByEnemy: prev.pillsEatenByEnemy + 1 }));
  }, []);

  const activateAbility = useCallback(
    (type: AbilityType) => {
      let duration: number;
      if (type === 'vibe') duration = GAME_CONFIG.ABILITIES.VIBE.DURATION;
      else if (type === 'tokenBurner') duration = GAME_CONFIG.ABILITIES.TOKEN_BURNER.DURATION;
      else duration = GAME_CONFIG.ABILITIES.DEBUG.DURATION;

      setState((prev) => {
        if (!prev.abilities[type]) return prev;
        return {
          ...prev,
          activeAbility: type,
          abilityEndTime: Date.now() + duration * 1000,
          abilities: { ...prev.abilities, [type]: false },
        };
      });

      if (abilityTimeoutRef.current) {
        clearTimeout(abilityTimeoutRef.current);
      }

      abilityTimeoutRef.current = setTimeout(() => {
        deactivateAbility();
      }, duration * 1000);
    },
    [deactivateAbility]
  );

  // Stable dispatch object — never changes since all callbacks use updater form
  const dispatch = useMemo<GameDispatch>(() => ({
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    nextLevel,
    setGameOver,
    updateScore,
    updateTimer,
    collectAbility,
    activateAbility,
    deactivateAbility,
    addPillSaved,
    addPillEatenByEnemy,
  }), [startGame, pauseGame, resumeGame, restartGame, nextLevel, setGameOver, updateScore, updateTimer, collectAbility, activateAbility, deactivateAbility, addPillSaved, addPillEatenByEnemy]);

  const value: GameStateContextType = { ...state, ...dispatch };

  return (
    <GameStateRefContext.Provider value={stateRef}>
      <GameDispatchContext.Provider value={dispatch}>
        <GameStateContext.Provider value={value}>
          {children}
        </GameStateContext.Provider>
      </GameDispatchContext.Provider>
    </GameStateRefContext.Provider>
  );
}

/** Backward-compatible hook — re-renders on any state change */
export function useGameState(): GameStateContextType {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}

/** Stable dispatch — never causes re-renders */
export function useGameDispatch(): GameDispatch {
  const context = useContext(GameDispatchContext);
  if (!context) {
    throw new Error('useGameDispatch must be used within a GameStateProvider');
  }
  return context;
}

/** Ref to current state — never causes re-renders. Read .current in useFrame. */
export function useGameStateRef(): React.MutableRefObject<GameState> {
  const context = useContext(GameStateRefContext);
  if (!context) {
    throw new Error('useGameStateRef must be used within a GameStateProvider');
  }
  return context;
}
