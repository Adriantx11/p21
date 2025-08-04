import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!currentUser?.name) return 'U';
    return currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center px-6 py-3">
        <div className="flex items-center">
          <Link to="/dashboard" className="text-xl font-bold text-indigo-600">Galaxy Subscriptions</Link>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notifications Button */}
          <button className="p-2 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          {/* Subscription Status */}
          {currentUser && (
            <div className="hidden md:block">
              <Link 
                to="/subscription-plans" 
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentUser.subscriptionStatus === 'monthly' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {currentUser.subscriptionStatus === 'monthly' 
                  ? 'Monthly Plan' 
                  : 'Free Trial'}
              </Link>
            </div>
          )}
          
          {/* Profile Dropdown */}
          {currentUser ? (
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)} 
                className="flex items-center focus:outline-none"
              >
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  {getInitials()}
                </div>
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    Signed in as <span className="font-medium">{currentUser.email}</span>
                  </div>
                  <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</Link>
                  {isAdmin() && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Panel</Link>
                  )}
                  <Link to="/subscription-plans" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Cuenta</Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link to="/login" className="px-4 py-2 rounded text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                Sign in
              </Link>
              <Link to="/register" className="px-4 py-2 rounded text-sm font-medium text-indigo-600 bg-white hover:bg-gray-100 border border-indigo-600">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;