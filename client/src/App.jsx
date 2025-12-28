import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/auth/login/Login.jsx'
import Signup from './components/auth/signup/Signup.jsx'
import AssignmentList from './components/AssignmentList.jsx'
import AssignmentDetail from './components/AssignmentDetail.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/assignments"
        element={
          <ProtectedRoute>
            <AssignmentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignment/:id"
        element={
          <ProtectedRoute>
            <AssignmentDetail />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
