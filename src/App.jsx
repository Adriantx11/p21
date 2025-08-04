import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AmazonChecker from './pages/AmazonChecker';
import ProxyManager from './pages/ProxyManager';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AccountInfo from './pages/AccountInfo';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/galaxy-theme.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen galaxy-background">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Protected Routes with Layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div className="flex flex-col h-screen">
                  <Header />
                  <div className="flex flex-1">
                    <Sidebar />
                    <main className="flex-1 p-6 overflow-auto">
                      <UserDashboard />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <div className="flex flex-col h-screen">
                  <Header />
                  <div className="flex flex-1">
                    <Sidebar />
                    <main className="flex-1 p-6 overflow-auto">
                      <AdminDashboard />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/subscription-plans" element={
              <ProtectedRoute>
                <div className="flex flex-col h-screen">
                  <Header />
                  <div className="flex flex-1">
                    <Sidebar />
                    <main className="flex-1 p-6 overflow-auto">
                      <AccountInfo />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/amazon" element={
              <ProtectedRoute>
                <div className="flex flex-col h-screen">
                  <Header />
                  <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <main className="flex-1 p-6 overflow-auto bg-gray-50">
                      <AmazonChecker />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/proxies" element={
              <ProtectedRoute adminOnly={true}>
                <div className="flex flex-col h-screen">
                  <Header />
                  <div className="flex flex-1">
                    <Sidebar />
                    <main className="flex-1 p-6 overflow-auto">
                      <ProxyManager />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/subscriptions" element={
              <ProtectedRoute adminOnly={true}>
                <div className="flex flex-col h-screen">
                  <Header />
                  <div className="flex flex-1">
                    <Sidebar />
                    <main className="flex-1 p-6 overflow-auto">
                      <AdminSubscriptions />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;