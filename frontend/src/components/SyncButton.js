import React, { useState } from 'react';
import './SyncButton.css';

function SyncButton({ onSync }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onSync();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="sync-button"
    >
      {loading ? 'Sincronizando...' : '🔄 Sincronizar Dados'}
    </button>
  );
}

export default SyncButton;

