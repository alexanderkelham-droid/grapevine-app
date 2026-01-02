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
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', backgroundColor: '#121212', color: 'white', height: '100vh' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ef4444' }}>
                        Application Error
                    </h1>
                    <pre style={{
                        backgroundColor: '#1a1a1a',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        border: '1px solid #333'
                    }}>
                        {this.state.error?.toString()}
                    </pre>
                    <p style={{ marginTop: '1rem', color: '#888' }}>
                        Check the browser console (F12) for more details.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
