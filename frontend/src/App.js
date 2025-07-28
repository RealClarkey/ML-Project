import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      alert('Please select a CSV file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/upload_csv/', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Something went wrong.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Upload CSV File</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>

      {response && (
        <div style={{ marginTop: '2rem' }}>
          <h3>CSV Info:</h3>
          <p><strong>Columns:</strong> {response.columns.join(', ')}</p>
          <p><strong>Rows:</strong> {response.row_count}</p>
        </div>
      )}
    </div>
  );
}

export default App;
