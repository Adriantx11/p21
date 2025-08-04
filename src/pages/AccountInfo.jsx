import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import apiService from '../services/api';

const AccountInfo = () => {
  const { currentUser } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [amazonStats, setAmazonStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const fetchAccountInfo = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch subscription status
      const subscriptionData = await apiService.getSubscriptionStatus();
      setSubscriptionStatus(subscriptionData);

      // Fetch Amazon stats if user has monthly plan
      if (currentUser?.subscriptionStatus === 'monthly') {
        try {
          const statsData = await apiService.getAmazonStats();
          setAmazonStats(statsData);
        } catch (error) {
          console.log('Amazon stats not available:', error.message);
        }
      }
    } catch (error) {
      setError('Error al cargar información de la cuenta');
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'no-expiry', text: 'Sin fecha de expiración' };
    
    const days = getDaysUntilExpiry(expiryDate);
    
    if (days < 0) {
      return { status: 'expired', text: 'Expirada' };
    } else if (days <= 7) {
      return { status: 'warning', text: `${days} días restantes` };
    } else {
      return { status: 'active', text: `${days} días restantes` };
    }
  };

  if (loading) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando información de la cuenta...</p>
        </div>
      </div>
    );
  }

  const expiryInfo = getExpiryStatus(subscriptionStatus?.subscriptionExpiry);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Información de la Cuenta</h1>
          <p className="mt-2 text-gray-600">Detalles completos de tu cuenta y suscripción</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información Personal */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Personal</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{currentUser?.name}</h3>
                  <p className="text-gray-500">{currentUser?.email}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">ID Numérico:</span>
                    <p className="text-gray-900">{currentUser?.numericId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Rol:</span>
                    <p className="text-gray-900 capitalize">{currentUser?.role}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Estado:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      currentUser?.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentUser?.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Miembro desde:</span>
                    <p className="text-gray-900">{formatDate(currentUser?.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Suscripción */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Suscripción</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Plan Actual:</span>
                {getStatusBadge(currentUser?.subscriptionStatus)}
              </div>
              
              <div className="border-t pt-4">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-500">Fecha de Expiración:</span>
                    <p className="text-gray-900">{formatDate(subscriptionStatus?.subscriptionExpiry)}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-500">Estado:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                      expiryInfo.status === 'expired' 
                        ? 'bg-red-100 text-red-800'
                        : expiryInfo.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {expiryInfo.text}
                    </span>
                  </div>

                  {subscriptionStatus?.isExpired && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-red-800 text-sm">
                        Tu suscripción ha expirado. Actualiza tu plan para continuar usando todas las funcionalidades.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas de Amazon Checker (solo para usuarios monthly) */}
          {currentUser?.subscriptionStatus === 'monthly' && (
            <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Amazon Checker - Estadísticas</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {amazonStats?.totalChecks || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total de Verificaciones</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {amazonStats?.approvedCards || 0}
                  </div>
                  <div className="text-sm text-green-600">Tarjetas Aprobadas</div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {amazonStats?.declinedCards || 0}
                  </div>
                  <div className="text-sm text-red-600">Tarjetas Rechazadas</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {amazonStats?.successRate ? `${amazonStats.successRate}%` : '0%'}
                  </div>
                  <div className="text-sm text-purple-600">Tasa de Éxito</div>
                </div>
              </div>
              
              {amazonStats?.lastAmazonCheck && (
                <div className="mt-4 pt-4 border-t">
                  <span className="font-medium text-gray-500">Última verificación:</span>
                  <p className="text-gray-900">{formatDate(amazonStats.lastAmazonCheck)}</p>
                </div>
              )}
            </div>
          )}

          {/* Información de la Cuenta */}
          <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles de la Cuenta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Información de Acceso</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Último acceso:</span>
                    <p className="text-gray-900">{formatDate(currentUser?.lastLogin)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Cuenta creada:</span>
                    <p className="text-gray-900">{formatDate(currentUser?.createdAt)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Última actualización:</span>
                    <p className="text-gray-900">{formatDate(currentUser?.updatedAt)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Funcionalidades Disponibles</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-900">Dashboard completo</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-900">Analytics avanzados</span>
                  </div>
                  {currentUser?.subscriptionStatus === 'monthly' && (
                    <>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-900">Amazon Checker</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-900">Soporte prioritario</span>
                      </div>
                    </>
                  )}
                  {currentUser?.subscriptionStatus === 'free' && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-yellow-800">Acceso limitado (prueba gratuita)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo; 