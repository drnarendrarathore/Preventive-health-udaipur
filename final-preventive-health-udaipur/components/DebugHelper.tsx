import React, { useState } from 'react';
import { TEST_CASES } from '../services/testCases.ts';
import type { UserData, Action } from '../types.ts';

interface DebugHelperProps {
    dispatch: React.Dispatch<Action>;
    setStep: (step: number) => void;
    onSubmit: () => void;
}

const DebugHelper: React.FC<DebugHelperProps> = ({ dispatch, setStep, onSubmit }) => {
    const [isOpen, setIsOpen] = useState(false);

    const loadCase = (data: UserData) => {
        // Reset first to clear any lingering state
        dispatch({ type: 'RESET_STATE' });
        
        // Small timeout to allow reset to process, though React batching might handle it
        setTimeout(() => {
            dispatch({ type: 'REPLACE_STATE', payload: data });
            onSubmit(); // Trigger the results calculation
            setIsOpen(false);
        }, 50);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 9999,
                    padding: '8px 12px',
                    background: '#263238',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '10px',
                    opacity: 0.5,
                    cursor: 'pointer'
                }}
            >
                ⚙️ Debug
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            maxWidth: '300px',
            maxHeight: '400px',
            overflowY: 'auto'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <strong style={{ fontSize: '12px' }}>Load Test Scenario</strong>
                <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {TEST_CASES.map(tcase => (
                    <button
                        key={tcase.id}
                        onClick={() => loadCase(tcase.data)}
                        style={{
                            textAlign: 'left',
                            padding: '8px',
                            background: '#f5f5f5',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        <strong>{tcase.id}. {tcase.name}</strong>
                        <div style={{ color: '#666', marginTop: '2px' }}>{tcase.description}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DebugHelper;