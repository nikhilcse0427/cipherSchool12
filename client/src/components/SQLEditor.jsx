import React from 'react'
import './SQLEditor.css'

const SQLEditor = ({ value, onChange }) => {
  const handleChange = (e) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e) => {
    // Auto-indent on Enter
    if (e.key === 'Enter') {
      const textarea = e.target
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      
      // Get the current line
      const lineStart = text.lastIndexOf('\n', start - 1) + 1
      const currentLine = text.substring(lineStart, start)
      const indent = currentLine.match(/^(\s*)/)[0]
      
      // Insert newline with indentation
      const newText = text.substring(0, start) + '\n' + indent + text.substring(end)
      onChange(newText)
      
      // Set cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + indent.length + 1
      }, 0)
      
      e.preventDefault()
    }
  }

  return (
    <div className="sql-editor-container">
      <textarea
        className="sql-editor"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Write your SQL query here...&#10;Example: SELECT * FROM employees WHERE department = 'Engineering'"
        spellCheck={false}
      />
      <div className="editor-footer">
        <span className="line-count">
          {value.split('\n').length} line{value.split('\n').length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

export default SQLEditor

