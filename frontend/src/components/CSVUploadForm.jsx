import React, { useState } from 'react';
import api from '../api';
import { MdCloudUpload, MdDelete } from 'react-icons/md';

import './uploader.css';

const CSVUploadForm = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("No file selected");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  // New drag event handlers:
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
      setFileName(droppedFiles[0].name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload_csv', formData);
      onUploadSuccess(response.data);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed, please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetFile = () => {
    setFile(null);
    setFileName("No file selected");
  };

  return (
    <div className="uploader-container">
      <form
        className="upload-form"
        onClick={() => document.querySelector('.input-field').click()}
        onSubmit={e => e.preventDefault()}
        onDrop={handleDrop}          // <-- Add this
        onDragOver={handleDragOver}  // <-- And this
      >
        <input
          type="file"
          accept=".csv"
          className="input-field"
          hidden
          onChange={handleFileChange}
        />

        {!file ? (
          <>
            <MdCloudUpload size={60} color="#1475cf" />
            <p>Click or drag file here to upload</p>
          </>
        ) : (
          <div className="file-info">
            <p>{fileName}</p>
            <MdDelete size={24} color="#cc0000" onClick={resetFile} className="delete-icon" />
          </div>
        )}
      </form>

      <button
        className="upload-button"
        disabled={!file || uploading}
        onClick={handleUpload}
      >
        {uploading ? 'Uploading...' : 'Upload CSV'}
      </button>
    </div>
  );
};

export default CSVUploadForm;
