import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
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
        setMessage(`📧 A verification code has been sent to ${email}`);
        setShowOtp(true);
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/admin/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: Number(otp) })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(`✅ Login Successful! Welcome ${email}`);
        
        localStorage.setItem('adminToken', email);
        setIsAuthenticated(true);
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        setIsSuccess(false);
        setMessage(`❌ ${data.error || 'Verification failed'}`);
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
      <p style={{ color: '#aaa', marginBottom: '40px' }}>
        {showOtp ? 'Enter verification code' : 'Sign in to access dashboard'}
      </p>

      {!showOtp ? (
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
            {loading ? 'Sending Code...' : 'Login'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            style={{
              width: '100%',
              padding: '14px',
              margin: '10px 0',
              borderRadius: '8px',
              border: '1px solid #444',
              background: '#2a2a2a',
              color: 'white',
              fontSize: '24px',
              textAlign: 'center',
              letterSpacing: '8px'
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
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>
          
          <button 
            type="button" 
            onClick={() => setShowOtp(false)}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '10px',
              background: 'transparent',
              color: '#aaa',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ← Back to Login
          </button>
        </form>
      )}

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