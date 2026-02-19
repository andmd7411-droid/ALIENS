import { useEffect, useState } from 'react';

export function DebugConsole() {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            setLogs(prev => [...prev, `LOG: ${args.join(' ')}`].slice(-20));
            originalLog(...args);
        };

        console.error = (...args) => {
            setLogs(prev => [...prev, `ERR: ${args.join(' ')}`].slice(-20));
            originalError(...args);
        };

        console.warn = (...args) => {
            setLogs(prev => [...prev, `WARN: ${args.join(' ')}`].slice(-20));
            originalWarn(...args);
        };

        window.onerror = (message, source, lineno, colno, _error) => {
            setLogs(prev => [...prev, `UNCAUGHT: ${message} at ${source}:${lineno}:${colno}`].slice(-20));
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '200px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'lime',
            overflowY: 'scroll',
            zIndex: 9999,
            pointerEvents: 'none',
            fontSize: '10px',
            fontFamily: 'monospace'
        }}>
            {logs.map((log, i) => (
                <div key={i} style={{ borderBottom: '1px solid #333', padding: '2px' }}>
                    {log.includes('ERR') || log.includes('UNCAUGHT') ? <span style={{ color: 'red' }}>{log}</span> : log}
                </div>
            ))}
        </div>
    );
}
