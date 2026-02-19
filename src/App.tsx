import { GameStateProvider } from './contexts/GameStateContext';
import GameContainer from './components/GameContainer';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <GameStateProvider>
        <GameContainer />
      </GameStateProvider>
    </ErrorBoundary>
  );
}

export default App;
