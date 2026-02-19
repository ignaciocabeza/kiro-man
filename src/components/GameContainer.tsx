import React from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { GameStatus } from '../types';
import LandingScreen from './LandingScreen';
import GameCanvas from './GameCanvas';
import HUD from './HUD';
import PauseMenu from './PauseMenu';
import GameOverScreen from './GameOverScreen';
import VictoryScreen from './VictoryScreen';
import VibeEffect from './VibeEffect';
import FpsCounter from './FpsCounter';

const GameContainer: React.FC = () => {
  const { status } = useGameState();

  switch (status) {
    case GameStatus.MENU:
      return <LandingScreen />;

    case GameStatus.PLAYING:
    case GameStatus.LEVEL_TRANSITION:
      return (
        <>
          <GameCanvas />
          <HUD />
          <VibeEffect />
          <FpsCounter />
        </>
      );

    case GameStatus.PAUSED:
      return (
        <>
          <GameCanvas />
          <HUD />
          <PauseMenu />
          <FpsCounter />
        </>
      );

    case GameStatus.GAME_OVER:
      return <GameOverScreen />;

    case GameStatus.VICTORY:
      return <VictoryScreen />;

    default:
      return <LandingScreen />;
  }
};

export default GameContainer;
