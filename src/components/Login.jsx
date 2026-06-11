import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(`✅ Login Successful! Welcome ${data.user?.email}`);
        
        // Save token (you can replace with real JWT later)
        localStorage.setItem('adminToken', data.user?.email || 'dummy-token-for-now');
        
        setIsAuthenticated(true);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        setIsSuccess(false);
        setMessage(`❌ ${data.error || 'Login failed'}`);
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage('❌ Cannot connect to server. Is Express running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '500px',
      margin: '80px auto',
      textAlign: 'center',
      background: '#1a1a1a',
      borderRadius: '12px',
      color: 'white'
    }}>
      <h1 style={{ marginBottom: '8px' }}>Gold Admin Panel</h1>
      <p style={{ color: '#aaa', marginBottom: '40px' }}>Sign in to access dashboard</p>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '14px',
            margin: '10px 0',
            borderRadius: '8px',
            border: '1px solid #444',
            background: '#2a2a2a',
            color: 'white',
            fontSize: '16px'
          }}
          required
        />

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '14px',
            margin: '10px 0',
            borderRadius: '8px',
            border: '1px solid #444',
            background: '#2a2a2a',
            color: 'white',
            fontSize: '16px'
          }}
          required
        />

        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            marginTop: '20px',
            background: '#aa3bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && (
        <p style={{ 
          marginTop: '25px', 
          color: isSuccess ? '#4ade80' : '#f87171',
          fontSize: '15px'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Login;