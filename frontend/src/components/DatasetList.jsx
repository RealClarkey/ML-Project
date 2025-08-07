// src/components/DatasetList.jsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Alert
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

const DatasetList = ({ datasets = [], onAnalyse, onDelete, onDownload, uploadMessage }) => {
  if (!datasets.length) return null;

  return (
    <>
      {uploadMessage && (
        <Alert severity="success" sx={{ my: 2 }}>
          {uploadMessage}
        </Alert>
      )}

      <Typography variant="h5" sx={{ mb: 2 }}>
        Your Datasets:
      </Typography>

      <TableContainer component={Paper} sx={{ my: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Uploaded</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell>{dataset.name}</TableCell>
                <TableCell>{dataset.format.toUpperCase()}</TableCell>
                <TableCell>{formatDistanceToNow(new Date(dataset.uploadedAt), { addSuffix: true })}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => onAnalyse(dataset)}
                  >
                    Analyse
                  </Button>
                  {dataset.format === 'csv' ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => onDelete(dataset.id)}
                    >
                      Delete
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onDownload(dataset)}
                    >
                      Download
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default DatasetList;