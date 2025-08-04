import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Initialize with sample admin user if none exists
const initializeData = () => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  if (users.length === 0) {
    // Create a sample admin user
    const adminUser = {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      subscriptionStatus: 'pro',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };
    
    // Save to localStorage
    localStorage.setItem('users', JSON.stringify([adminUser]));
    console.log('Sample admin user created');
  }
};

// Call initialization function
initializeData();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);