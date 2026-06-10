import React, { useState } from 'react';
import axios from 'axios';
import './LoginPage.css';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('demo@tomas.cz');
  const [password, setPassword] = useState('demo');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password,
        role
      });

      if (response.data.success) {
        onLogin(response.data.token, response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Chyba při přihlašování');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>📦 DANZER</h1>
          <p>Správa inventáře a majetku</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@tomas.cz"
              required
            />
          </div>

          <div className="form-group">
            <label>Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="demo"
              required
            />
          </div>

          <div className="form-group">
            <label>Vaše role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">Admin (vidí všechno)</option>
              <option value="smlouvy">Smlouvy (vidí jen smlouvy)</option>
              <option value="auta">Vozový park (vidí jen auta)</option>
              <option value="majetek">Majetek (vidí jen majetek)</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Přihlašuji se...' : 'Přihlásit se'}
          </button>
        </form>

        <div className="login-info">
          <h3>🎯 Demo přihlášení</h3>
          <p><strong>Email:</strong> demo@tomas.cz</p>
          <p><strong>Heslo:</strong> demo</p>
          <p>Vyberte si svou roli a přihlaste se. Podle role budete vidět pouze příslušné moduly.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
