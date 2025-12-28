import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { assignments } from '../data/assignments'
import { executeSQL } from '../utils/sqlExecutor'
import SQLEditor from './SQLEditor'
import ResultsPanel from './ResultsPanel'
import SampleDataViewer from './SampleDataViewer'
import './AssignmentDetail.css'

const AssignmentDetail = () => {
  const { id } = useParams()
  const currentAssignment = assignments.find(a => a.id === parseInt(id))
  
  const [sqlQuery, setSqlQuery] = useState('')
  const [queryResults, setQueryResults] = useState(null)
  const [displaySampleData, setDisplaySampleData] = useState(false)

  if (!currentAssignment) {
    return (
      <div className="assignment-not-found">
        <h2>Assignment not found</h2>
        <Link to="/assignments">Back to Assignments</Link>
      </div>
    )
  }

  const runQuery = () => {
    if (!sqlQuery.trim()) {
      setQueryResults({
        success: false,
        error: 'Please enter a SQL query',
        columns: [],
        rows: [],
        rowCount: 0
      })
      return
    }

    const executionResult = executeSQL(sqlQuery, currentAssignment.sampleData)
    setQueryResults(executionResult)
  }

  const clearEditor = () => {
    setSqlQuery('')
    setQueryResults(null)
  }

  return (
    <div className="assignment-detail-container">
      <div className="assignment-detail-header">
        <Link to="/assignments" className="back-button">← Back to Assignments</Link>
        <div className="assignment-info">
          <h1>{currentAssignment.title}</h1>
          <span className="difficulty-badge">{currentAssignment.difficulty}</span>
        </div>
      </div>

      <div className="assignment-detail-content">
        <div className="left-panel">
          <div className="question-panel">
            <h2>Question</h2>
            <p className="question-text">{currentAssignment.question}</p>
          </div>

          <div className="sample-data-panel">
            <div className="panel-header">
              <h2>Sample Data</h2>
              <button
                className="toggle-button"
                onClick={() => setDisplaySampleData(!displaySampleData)}
              >
                {displaySampleData ? 'Hide' : 'Show'} Tables
              </button>
            </div>
            {displaySampleData && (
              <SampleDataViewer sampleData={currentAssignment.sampleData} />
            )}
          </div>
        </div>

        <div className="right-panel">
          <div className="editor-panel">
            <div className="panel-header">
              <h2>SQL Editor</h2>
              <div className="editor-actions">
                <button className="clear-button" onClick={clearEditor}>
                  Clear
                </button>
                <button className="run-button" onClick={runQuery}>
                  Run Query
                </button>
              </div>
            </div>
            <SQLEditor value={sqlQuery} onChange={setSqlQuery} />
          </div>

          <div className="results-panel">
            <h2>Results</h2>
            <ResultsPanel results={queryResults} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignmentDetail
