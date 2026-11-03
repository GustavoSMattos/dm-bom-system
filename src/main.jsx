import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erro na renderização do DM BOM System:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', backgroundColor: '#020617', color: '#f87171', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>⚠️ Erro de Exibição no DM BOM System</h1>
          <p style={{ marginBottom: '8px', color: '#cbd5e1' }}>Ocorreu uma falha na montagem dos componentes:</p>
          <pre style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #7f1d1d', overflowX: 'auto', color: '#f8fafc' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}