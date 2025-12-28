import React from 'react'
import './ResultsPanel.css'

const ResultsPanel = ({ results }) => {
  if (!results) {
    return (
      <div className="results-placeholder">
        <p>Run a query to see results here</p>
      </div>
    )
  }

  if (!results.success) {
    return (
      <div className="results-error">
        <div className="error-icon">⚠️</div>
        <div className="error-message">
          <strong>Error:</strong> {results.error}
        </div>
      </div>
    )
  }

  if (results.rows.length === 0) {
    return (
      <div className="results-empty">
        <p>Query executed successfully but returned no results</p>
        <p className="row-count">Rows: 0</p>
      </div>
    )
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <span className="success-indicator">✓ Query executed successfully</span>
        <span className="row-count">Rows: {results.rowCount}</span>
      </div>
      <div className="results-table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              {results.columns.map((column, index) => (
                <th key={index}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {results.columns.map((column, colIndex) => (
                  <td key={colIndex}>{row[column] !== null && row[column] !== undefined ? String(row[column]) : 'NULL'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ResultsPanel

