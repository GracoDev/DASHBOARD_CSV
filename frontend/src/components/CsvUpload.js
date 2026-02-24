import React, { useState, useCallback } from 'react';
import './CsvUpload.css';

function CsvUpload({ onUpload, loading }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.toLowerCase().endsWith('.csv')) {
      setFile(f);
    } else if (f) {
      setFile(null);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = (e) => {
    const f = e.target.files?.[0];
    if (f && f.name.toLowerCase().endsWith('.csv')) {
      setFile(f);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = () => {
    if (file && onUpload) {
      onUpload(file);
    }
  };

  const clearFile = () => setFile(null);

  return (
    <div className="csv-upload-card">
      <h3 className="csv-upload-title">Seu arquivo CSV</h3>
      <p className="csv-upload-hint">
        Arraste um arquivo .csv aqui ou clique para selecionar. Formato: <code>order_id;created_at;status;value;payment_method</code> (delimitador ;).
      </p>
      <div
        className={`csv-upload-zone ${dragOver ? 'csv-upload-zone--over' : ''} ${file ? 'csv-upload-zone--has-file' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="csv-upload-input"
          id="csv-file-input"
        />
        <label htmlFor="csv-file-input" className="csv-upload-label">
          {file ? (
            <span className="csv-upload-filename">
              {file.name}
              <button type="button" className="csv-upload-clear" onClick={(e) => { e.preventDefault(); clearFile(); }} aria-label="Remover arquivo">
                ✕
              </button>
            </span>
          ) : (
            'Arraste o CSV aqui ou clique para escolher'
          )}
        </label>
      </div>
      <button
        type="button"
        className="csv-upload-submit"
        onClick={handleSubmit}
        disabled={!file || loading}
      >
        {loading ? 'Enviando...' : 'Enviar e processar'}
      </button>
    </div>
  );
}

export default CsvUpload;
