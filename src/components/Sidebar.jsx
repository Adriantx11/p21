import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const Sidebar = () => {
  const location = useLocation();
  const { currentUser, isAdmin } = useAuth();
  
  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/subscription-plans')) return 'subscription';
    if (path.includes('/amazon')) return 'amazon';
    if (path.includes('/proxies')) return 'proxies';
    return 'dashboard';
  };
  
  const [activeItem, setActiveItem] = useState(getActiveItem());
  
  // Define menu items
  const menuItems = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      link: '/dashboard'
    },
    { 
      id: 'amazon', 
      name: 'Amazon Checker', 
      icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
      link: '/amazon'
    },
    { 
      id: 'subscription', 
      name: 'Mi Cuenta', 
      icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
      link: '/subscription-plans'
    },
  ];

  // Add admin menu items for admin users
  if (isAdmin()) {
    menuItems.push({
      id: 'admin',
      name: 'Admin Panel',
      icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      link: '/admin'
    });
    menuItems.push({
      id: 'subscriptions',
      name: 'Gestión Suscripciones',
      icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
      link: '/admin/subscriptions'
    });
    menuItems.push({
      id: 'proxies',
      name: 'Proxy Manager',
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      link: '/proxies'
    });
  }

  const handleMenuClick = (itemId) => {
    setActiveItem(itemId);
  };

  return (
    <aside className="bg-white shadow-sm w-64 min-w-64 hidden md:block">
      <div className="p-6 h-full">
        <div className="flex flex-col items-center justify-center space-y-3 mb-8">
          {currentUser && (
            <>
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-700">{currentUser.name}</h3>
                <p className="text-sm text-gray-500">{currentUser.email}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentUser.subscriptionStatus === 'monthly' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentUser.subscriptionStatus === 'monthly' 
                  ? 'Monthly Plan' 
                  : 'Free Trial'}
              </div>
            </>
          )}
        </div>

        <nav className="mt-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.link}
                  className={`flex items-center px-4 py-3 text-sm rounded-md ${
                    activeItem === item.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => handleMenuClick(item.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;