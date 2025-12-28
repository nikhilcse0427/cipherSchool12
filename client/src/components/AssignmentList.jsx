import React from 'react'
import { Link } from 'react-router-dom'
import { assignments } from '../data/assignments'
import './AssignmentList.css'

const AssignmentList = () => {
  const getBadgeColor = (level) => {
    switch (level) {
      case 'Easy':
        return '#4caf50'
      case 'Medium':
        return '#ff9800'
      case 'Hard':
        return '#f44336'
      default:
        return '#2196f3'
    }
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="assignment-list-container">
        <div className="assignment-list-header">
          <h1>No assignments found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="assignment-list-container">
      <div className="assignment-list-header">
        <h1>SQL Assignment Practice</h1>
        <p>Practice SQL queries with pre-loaded sample data</p>
      </div>
      
      <div className="assignments-grid">
        {assignments.map((item) => (
          <Link
            key={item.id}
            to={`/assignment/${item.id}`}
            className="assignment-card"
          >
            <div className="assignment-card-header">
              <h3>{item.title}</h3>
              <span
                className="difficulty-badge"
                style={{ backgroundColor: getBadgeColor(item.difficulty) }}
              >
                {item.difficulty}
              </span>
            </div>
            <p className="assignment-description">{item.description}</p>
            <div className="assignment-preview">
              <span className="preview-text">{item.question.substring(0, 100)}...</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default AssignmentList
