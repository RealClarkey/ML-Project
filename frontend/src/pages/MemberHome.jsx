// src/pages/MemberHome.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import CSVUploadForm from '../components/CSVUploadForm';
import DatasetList from '../components/DatasetList';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api';
import '../App.css';
import { setApiToken} from "../api";


const MemberHome = () => {
  const auth = useAuth();
  const username = auth.user?.profile?.email || 'User';

  // Attach Cognito access token to backend calls
  const authHeader = auth.user?.access_token
    ? { Authorization: `Bearer ${auth.user.access_token}` }
    : {};

  // Existing state
  const [columns, setColumns] = useState([]);
  const [datasetId, setDatasetId] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [topRows, setTopRows] = useState([]);

  // New: datasets list + success message + selected dataset
  const [datasets, setDatasets] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);

  // Preprocessing info/errors
  const [preprocessInfo, setPreprocessInfo] = useState(null);
  const [preprocessError, setPreprocessError] = useState(null);

  // Fetch datasets from backend
  const fetchDatasets = async () => {
    try {
      const response = await api.get('/datasets', { headers: authHeader });
      setDatasets(response.data);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    }
  };
  useEffect(() => {
    if (auth.isAuthenticated) {
      setApiToken(auth.user?.access_token);
      fetchDatasets();
    } else {
      setApiToken(null);
    }
  }, [auth.isAuthenticated, auth.user?.access_token]);

  // After CSV upload completes
  const handleUploadSuccess = ({ dataset_id, columns }) => {
    setDatasetId(dataset_id);
    setColumns(columns);
    setPreprocessInfo(null);
    setPreprocessError(null);
    setTopRows([]);
    setTargetColumn('');
    setUploadMessage('Upload and conversion successful.');
    fetchDatasets(); // refresh the list
  };

  // Start preprocessing for the current datasetId
  const handleBeginPreprocessing = async () => {
    setPreprocessError(null);
    setPreprocessInfo(null);
    try {
      const response = await api.post(
        '/begin_preprocessing',
        { dataset_id: datasetId },
        { headers: authHeader }
      );
      setPreprocessInfo(response.data);
      if (response.data.columns) setColumns(response.data.columns);
    } catch (error) {
      setPreprocessError(
        error.response?.data?.detail || error.message || 'Preprocessing failed'
      );
    }
  };

  // Show top rows for selected target column
  const handleShowRows = async () => {
    if (!targetColumn) return;
    const response = await api.post(
      '/top_rows',
      { dataset_id: datasetId, target_column: targetColumn },
      { headers: authHeader }
    );
    setTopRows(response.data.top_rows);
  };

  // When user clicks "Analyse" on a dataset from the table
  const handleAnalyse = async (dataset) => {
    try {
      setSelectedDataset(dataset);
      setPreprocessError(null);
      setPreprocessInfo(null);

      // Use dataset.id if provided; else strip extension from name
      const id = dataset.id || dataset.name.replace(/\.(csv|pkl)$/i, '');
      const res = await api.post(
        '/begin_preprocessing',
        { dataset_id: id },
        { headers: authHeader }
      );

      setDatasetId(id);
      setColumns(res.data.columns || []);
      setPreprocessInfo(res.data);
    } catch (e) {
      setPreprocessError(
        e.response?.data?.detail || e.message || 'Preprocessing failed'
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="App">
        <main className="main-content">
          <h1>Welcome back, {username} 👋</h1>
          <h2>Let’s get started</h2>

          {/* Always allow uploads */}
          <section style={{ marginBottom: 24 }}>
            <h3>Upload Your Dataset</h3>
            <CSVUploadForm onUploadSuccess={handleUploadSuccess} />
          </section>

          {/* Dynamic list of datasets + success message */}
          <DatasetList
            datasets={datasets}
            uploadMessage={uploadMessage}
            onAnalyse={handleAnalyse}
            onDelete={(id) => console.log('Delete', id)}
            onDownload={(dataset) => console.log('Download', dataset)}
          />

          {/* Only show preprocessing after a dataset is selected/analyzed */}
          {selectedDataset && preprocessInfo && (
            <>
              <h2>Begin Preprocessing</h2>
              <button onClick={handleBeginPreprocessing}>Start Preprocessing</button>

              {preprocessError && <p style={{ color: 'red' }}>{preprocessError}</p>}

              {preprocessInfo && (
                <div>
                  <p>{preprocessInfo.message}</p>
                  <p>Missing Values:</p>
                  <ul>
                    {Object.entries(preprocessInfo.missing_values || {}).map(
                      ([col, count]) => (
                        <li key={col}>
                          {col}: {count}
                        </li>
                      )
                    )}
                  </ul>
                  <h3>Data Types:</h3>
                  <ul>
                    {Object.entries(preprocessInfo.column_types || {}).map(
                      ([col, dtype]) => (
                        <li key={col}>
                          {col}: {dtype}
                        </li>
                      )
                    )}
                  </ul>
                  <p>Number of rows: {preprocessInfo.num_rows}</p>
                  <p>Columns:</p>
                  <ul>
                    {preprocessInfo.columns?.map((col) => (
                      <li key={col}>{col}</li>
                    ))}
                  </ul>
                </div>
              )}

              {preprocessInfo?.summary && (
                <>
                  <h3>Summary Statistics:</h3>
                  <table border="1">
                    <thead>
                      <tr>
                        <th>Stat</th>
                        {Object.keys(preprocessInfo.summary).map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(
                        preprocessInfo.summary[
                          Object.keys(preprocessInfo.summary)[0]
                        ]
                      ).map((stat) => (
                        <tr key={stat}>
                          <td>{stat}</td>
                          {Object.keys(preprocessInfo.summary).map((c) => (
                            <td key={c + stat}>
                              {preprocessInfo.summary[c]?.[stat]?.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <h2>Select Target Column</h2>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
              >
                <option value="">-- Select --</option>
                {columns.map((col, i) => (
                  <option key={i} value={col}>
                    {col}
                  </option>
                ))}
              </select>

              <button onClick={handleShowRows} disabled={!targetColumn}>
                Show Top 10 Rows
              </button>
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
    </DashboardLayout>
  );
};

export default MemberHome;
