import React, { useState } from 'react';
import './SampleDataViewer.css';

const SampleDataViewer = ({ sampleData }) => {
  const [activeTable, setActiveTable] = useState(null);

  const tables = Object.keys(sampleData);

  return (
    <div className="sample-data-viewer">
      <div className="table-list">
        {tables.map((tableName) => (
          <button
            key={tableName}
            className={`table-button ${activeTable === tableName ? 'active' : ''}`}
            onClick={() => setActiveTable(activeTable === tableName ? null : tableName)}
          >
            {tableName}
          </button>
        ))}
      </div>

      {activeTable && sampleData[activeTable] && (
        <div className="table-details">
          <div className="table-schema">
            <h3>Schema</h3>
            <div className="schema-list">
              {sampleData[activeTable].schema.map((column, index) => (
                <div key={index} className="schema-item">
                  <span className="column-name">{column.name}</span>
                  <span className="column-type">{column.type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="table-data">
            <h3>Sample Data ({sampleData[activeTable].rows.length} rows)</h3>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {sampleData[activeTable].schema.map((column) => (
                      <th key={column.name}>{column.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleData[activeTable].rows.map((row, index) => (
                    <tr key={index}>
                      {sampleData[activeTable].schema.map((column) => {
                        const colName = column.name;
                        const value = row[colName] !== undefined ? row[colName] : row[colName.toLowerCase()];
                        return <td key={column.name}>{value}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleDataViewer;
