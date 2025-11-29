// Forzar deploy Netlify - mostrar credenciales completas
// listo
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const handleLogin = (newRole, userData) => {
    setRole(newRole);
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/teacher" 
            element={
              user && role === 'teacher' ? (
                <TeacherDashboard user={user} />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          <Route 
            path="/student" 
            element={
              user && role === 'student' ? (
                <StudentDashboard user={user} />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
// Cambio para forzar deploy en Netlify
// Forzar deploy Netlify - mostrar credenciales completas