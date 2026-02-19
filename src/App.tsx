import React from 'react'
import { ARScene } from './components/ARScene'
import { HUD } from './components/HUD'
import './App.css'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: 'black', height: '100vh', overflow: 'auto', zIndex: 99999, position: 'relative' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ff4444' }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ fontSize: '10px', color: '#888' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ARScene />
      <HUD />
    </ErrorBoundary>
  )
}

export default App
