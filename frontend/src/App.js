import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ContractsPage from './pages/ContractsPage';
import VehiclesPage from './pages/VehiclesPage';
import AssetsPage from './pages/AssetsPage';

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage('login');
  };

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">
          <h2>📦 DANZER</h2>
          <p className="company">Inventory Management</p>
        </div>

        <nav className="menu">
          {(user.role === 'admin' || user.role === 'smlouvy') && (
            <button
              className={`menu-item ${currentPage === 'contracts' ? 'active' : ''}`}
              onClick={() => setCurrentPage('contracts')}
            >
              📋 Smlouvy
            </button>
          )}

          {(user.role === 'admin' || user.role === 'auta') && (
            <button
              className={`menu-item ${currentPage === 'vehicles' ? 'active' : ''}`}
              onClick={() => setCurrentPage('vehicles')}
            >
              🚗 Vozový park
            </button>
          )}

          {(user.role === 'admin' || user.role === 'majetek') && (
            <button
              className={`menu-item ${currentPage === 'assets' ? 'active' : ''}`}
              onClick={() => setCurrentPage('assets')}
            >
              🏠 Majetek
            </button>
          )}
        </nav>

        <div className="user-section">
          <div className="user-info">
            <p className="username">{user.username}</p>
            <p className="role">Role: {user.role}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Odhlásit se
          </button>
        </div>
      </div>

      <div className="main">
        {currentPage === 'dashboard' && (
          <Dashboard user={user} token={token} onNavigate={setCurrentPage} />
        )}
        {currentPage === 'contracts' && <ContractsPage user={user} token={token} />}
        {currentPage === 'vehicles' && <VehiclesPage user={user} token={token} />}
        {currentPage === 'assets' && <AssetsPage user={user} token={token} />}
      </div>
    </div>
  );
}

export default App;
