import React, { useState } from 'react';
import CSVUploadForm from './components/CSVUploadForm';
import api from './api';
import './App.css';

const App = () => {
  const [columns, setColumns] = useState([]);
  const [datasetId, setDatasetId] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [topRows, setTopRows] = useState([]);

  // New states for preprocessing info and errors
  const [preprocessInfo, setPreprocessInfo] = useState(null);
  const [preprocessError, setPreprocessError] = useState(null);

  const handleUploadSuccess = ({ dataset_id, columns }) => {
    setDatasetId(dataset_id);
    setColumns(columns);
    setPreprocessInfo(null);
    setPreprocessError(null);
    setTopRows([]);
    setTargetColumn("");
  };

  const handleShowRows = async () => {
    if (!targetColumn) return;

    const response = await api.post("/top_rows", {
      dataset_id: datasetId,
      target_column: targetColumn,
    });

    setTopRows(response.data.top_rows);
  };

  // New handler to begin preprocessing
  const handleBeginPreprocessing = async () => {
    setPreprocessError(null);
    setPreprocessInfo(null);

    try {
      const response = await api.post("/begin_preprocessing", {
        dataset_id: datasetId,
      });
      setPreprocessInfo(response.data);
      // Optionally update columns based on preprocessing result
      if (response.data.columns) {
        setColumns(response.data.columns);
      }
    } catch (error) {
      setPreprocessError(error.response?.data?.detail || error.message || "Preprocessing failed");
    }
  };

  return (
    <div className="App">
      <nav className="navbar">
        <img src="/logo.svg" alt="App Logo" className="logo" />
        <p>Machine Learning DIY</p>
      </nav>
      <main className="main-content">
        <h1>Lets Get Started</h1>

        {!datasetId && (
          <>
            <h2>Upload Your Dataset:</h2>
            <CSVUploadForm onUploadSuccess={handleUploadSuccess} />
          </>
        )}

        {datasetId && (
          <>
            <h2>Begin Preprocessing</h2>
            <button onClick={handleBeginPreprocessing}>Start Preprocessing</button>

            {preprocessError && <p style={{ color: "red" }}>{preprocessError}</p>}

            {preprocessInfo && (
              <div>
                <p>{preprocessInfo.message}</p>
                <p>Number of rows: {preprocessInfo.num_rows}</p>
                <p>Columns:</p>
                <ul>
                  {preprocessInfo.columns.map((col) => (
                    <li key={col}>{col}</li>
                  ))}
                </ul>
              </div>
            )}

            <h2>Select Target Column</h2>
            <select value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)}>
              <option value="">-- Select --</option>
              {columns.map((col, i) => (
                <option key={i} value={col}>{col}</option>
              ))}
            </select>

            <button onClick={handleShowRows} disabled={!targetColumn}>Show Top 10 Rows</button>
          </>
        )}

        {topRows.length > 0 && (
          <>
            <h2>Top 10 Rows</h2>
            <table border="1">
              <thead>
                <tr>
                  {Object.keys(topRows[0]).map((col, i) => (
                    <th key={i}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topRows.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </main>

      <footer className="footer">
        <p>© 2025 Machine Learning DIY. All rights reserved. Built by Leigh Clarke.</p>
      </footer>
    </div>
  );
};

export default App;
