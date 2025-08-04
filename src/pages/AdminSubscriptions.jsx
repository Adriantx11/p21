import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const AdminSubscriptions = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    subscriptionStatus: 'free',
    subscriptionExpiry: ''
  });

  useEffect(() => {
    if (!currentUser || !isAdmin()) {
      navigate('/dashboard');
      return;
    }

    fetchUsers();
  }, [currentUser, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      setUsers(response);
    } catch (error) {
      setError('Error al cargar usuarios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    if (!selectedUser) return;

    try {
      setUpdating(true);
      setError('');

      const expiryDate = updateData.subscriptionExpiry 
        ? new Date(updateData.subscriptionExpiry).toISOString()
        : null;

      await apiService.updateUserSubscription(selectedUser._id, {
        subscriptionStatus: updateData.subscriptionStatus,
        subscriptionExpiry: expiryDate
      });

      // Refresh users list
      await fetchUsers();
      
      setShowUpdateModal(false);
      setSelectedUser(null);
      setUpdateData({ subscriptionStatus: 'free', subscriptionExpiry: '' });
    } catch (error) {
      setError(error.message || 'Error al actualizar suscripción');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (user) => {
    setSelectedUser(user);
    setUpdateData({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry 
        ? new Date(user.subscriptionExpiry).toISOString().split('T')[0]
        : ''
    });
    setShowUpdateModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      free: 'bg-gray-100 text-gray-800',
      monthly: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      free: 'Free Trial',
      monthly: 'Monthly Plan'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Suscripciones</h1>
          <p className="mt-2 text-gray-600">Administra las suscripciones de todos los usuarios</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Usuarios ({users.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suscripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const daysUntilExpiry = getDaysUntilExpiry(user.subscriptionExpiry);
                  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
                  
                  return (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">ID: {user.numericId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Usuario'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.subscriptionStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.subscriptionExpiry)}
                        {daysUntilExpiry !== null && (
                          <div className={`text-xs ${
                            isExpired 
                              ? 'text-red-600' 
                              : daysUntilExpiry <= 7 
                                ? 'text-yellow-600' 
                                : 'text-green-600'
                          }`}>
                            {isExpired 
                              ? 'Expirada' 
                              : daysUntilExpiry <= 7 
                                ? `${daysUntilExpiry} días restantes`
                                : `${daysUntilExpiry} días restantes`
                            }
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openUpdateModal(user)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Actualizar Suscripción - {selectedUser.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan de Suscripción
                  </label>
                  <select
                    value={updateData.subscriptionStatus}
                    onChange={(e) => setUpdateData({
                      ...updateData,
                      subscriptionStatus: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="free">Free Trial</option>
                    <option value="monthly">Monthly Plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Expiración
                  </label>
                  <input
                    type="date"
                    value={updateData.subscriptionExpiry}
                    onChange={(e) => setUpdateData({
                      ...updateData,
                      subscriptionExpiry: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dejar vacío para Free Trial (1 día automático)
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedUser(null);
                    setUpdateData({ subscriptionStatus: 'free', subscriptionExpiry: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateSubscription}
                  disabled={updating}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    updating
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {updating ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions; 