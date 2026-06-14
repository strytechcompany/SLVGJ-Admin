import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Replace native alert with a custom in-app toast to fix Electron focus issues entirely
window.alert = (message) => {
  const alertBox = document.createElement('div');
  alertBox.style.position = 'fixed';
  alertBox.style.top = '20px';
  alertBox.style.left = '50%';
  alertBox.style.transform = 'translateX(-50%)';
  alertBox.style.backgroundColor = '#831843'; // pink to match theme
  alertBox.style.color = 'white';
  alertBox.style.padding = '16px 32px';
  alertBox.style.borderRadius = '9999px';
  alertBox.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
  alertBox.style.zIndex = '999999';
  alertBox.style.fontSize = '15px';
  alertBox.style.fontWeight = '600';
  alertBox.style.transition = 'opacity 0.3s ease-in-out';
  alertBox.innerText = message;
  
  document.body.appendChild(alertBox);

  // Remove after 3 seconds
  setTimeout(() => {
    alertBox.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(alertBox)) {
        document.body.removeChild(alertBox);
      }
    }, 300);
  }, 3000);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
