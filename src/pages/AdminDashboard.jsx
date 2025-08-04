import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [subscriptionStats, setSubscriptionStats] = useState({
    free: 0,
    basic: 0,
    pro: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Load users from localStorage
    const loadUsers = () => {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(storedUsers.map(u => ({...u, password: '********'})));  // Hide passwords
      
      // Calculate subscription stats
      const stats = storedUsers.reduce((acc, user) => {
        const status = user.subscriptionStatus || 'free';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {
        free: 0,
        basic: 0,
        pro: 0
      });
      
      setSubscriptionStats(stats);
    };
    
    loadUsers();
  }, []);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsEditing(false);
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleRoleChange = (e) => {
    setSelectedUser({...selectedUser, role: e.target.value});
  };
  
  const handleSubscriptionChange = (e) => {
    setSelectedUser({...selectedUser, subscriptionStatus: e.target.value});
  };
  
  const handleNumericIdChange = (e) => {
    setSelectedUser({...selectedUser, numericId: e.target.value});
  };
  
  const handleSave = () => {
    // Update user in localStorage
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = storedUsers.findIndex(u => u.id === selectedUser.id);
    
    if (userIndex !== -1) {
      storedUsers[userIndex].role = selectedUser.role;
      storedUsers[userIndex].subscriptionStatus = selectedUser.subscriptionStatus;
      storedUsers[userIndex].numericId = selectedUser.numericId;
      
      localStorage.setItem('users', JSON.stringify(storedUsers));
      
      // Update users state
      setUsers(storedUsers.map(u => ({...u, password: '********'})));
      
      // Recalculate subscription stats
      const stats = storedUsers.reduce((acc, user) => {
        const status = user.subscriptionStatus || 'free';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {
        free: 0,
        basic: 0,
        pro: 0
      });
      
      setSubscriptionStats(stats);
      
      setIsEditing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Admin Dashboard</h1>
      
      {/* Subscription Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Free Users</h3>
          <p className="text-3xl font-bold text-indigo-600">{subscriptionStats.free}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Basic Subscribers</h3>
          <p className="text-3xl font-bold text-green-600">{subscriptionStats.basic}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Pro Subscribers</h3>
          <p className="text-3xl font-bold text-purple-600">{subscriptionStats.pro}</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* User List */}
        <div className="md:w-2/3 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numeric ID</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    onClick={() => handleUserSelect(user)}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedUser?.id === user.id ? 'bg-indigo-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.numericId || 'Not set'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.subscriptionStatus === 'pro' ? 'bg-blue-100 text-blue-800' : 
                        user.subscriptionStatus === 'basic' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscriptionStatus || 'free'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* User Details */}
        <div className="md:w-1/3 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-gray-800">User Details</h2>
            {selectedUser && !isEditing && (
              <button 
                onClick={handleEditClick}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
              >
                Edit
              </button>
            )}
          </div>
          
          {selectedUser ? (
            <div>
              {isEditing ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <div className="mt-1 text-gray-900">{selectedUser.name}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="mt-1 text-gray-900">{selectedUser.email}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Numeric ID</label>
                      <input
                        type="text"
                        value={selectedUser.numericId || ''}
                        onChange={handleNumericIdChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        placeholder="Numeric ID for Telegram Bot"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select
                        value={selectedUser.role}
                        onChange={handleRoleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subscription</label>
                      <select
                        value={selectedUser.subscriptionStatus}
                        onChange={handleSubscriptionChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={handleSave}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="mt-1 text-gray-900">{selectedUser.name}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 text-gray-900">{selectedUser.email}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Numeric ID</label>
                    <div className="mt-1 text-gray-900">{selectedUser.numericId || 'Not set'}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedUser.role || 'user'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subscription</label>
                    <div className="mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedUser.subscriptionStatus === 'pro' ? 'bg-blue-100 text-blue-800' : 
                        selectedUser.subscriptionStatus === 'basic' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.subscriptionStatus || 'free'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subscription Expiry</label>
                    <div className="mt-1 text-gray-900">
                      {selectedUser.subscriptionExpiry 
                        ? new Date(selectedUser.subscriptionExpiry).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              Select a user to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;