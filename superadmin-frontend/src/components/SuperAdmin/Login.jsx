import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/superAdminService';
import { setAuthData } from '../../api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      const { token, user } = res.data.data;

      if (user.role !== 'superadmin') {
        setError('This portal is for Super Admins only.');
        setLoading(false);
        return;
      }

      setAuthData(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa-login-page">
      <div className="sa-login-card">
        <div className="sa-login-header">
          <div className="sa-logo-badge">SA</div>
          <h1>Super Admin</h1>
          <p>Platform control center</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="sa-error-banner">{error}</div>}

          <label className="sa-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>

          <label className="sa-field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          <button type="submit" className="sa-btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
