import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import apiService from '../services/api';

const ProxyManager = () => {
  const { currentUser } = useAuth();
  const [proxies, setProxies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Form states
  const [newProxy, setNewProxy] = useState({
    host: '',
    port: '',
    username: '',
    password: '',
    protocol: 'http',
    country: ''
  });
  
  const [importText, setImportText] = useState('');

  useEffect(() => {
    loadProxies();
    loadStats();
  }, [currentPage]);

  const loadProxies = async () => {
    try {
      const response = await apiService.get(`/proxies?page=${currentPage}&limit=20`);
      setProxies(response.data.proxies);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setMessage('Error al cargar proxies');
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.get('/proxies/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const addProxy = async () => {
    if (!newProxy.host || !newProxy.port) {
      setMessage('Host y puerto son requeridos');
      return;
    }

    setLoading(true);
    try {
      await apiService.post('/proxies', newProxy);
      setMessage('Proxy agregado exitosamente');
      setNewProxy({
        host: '',
        port: '',
        username: '',
        password: '',
        protocol: 'http',
        country: ''
      });
      setShowAddForm(false);
      loadProxies();
      loadStats();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error al agregar proxy');
    } finally {
      setLoading(false);
    }
  };

  const updateProxy = async (id, updates) => {
    try {
      await apiService.put(`/proxies/${id}`, updates);
      setMessage('Proxy actualizado exitosamente');
      loadProxies();
      loadStats();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error al actualizar proxy');
    }
  };

  const deleteProxy = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este proxy?')) {
      return;
    }

    try {
      await apiService.delete(`/proxies/${id}`);
      setMessage('Proxy eliminado exitosamente');
      loadProxies();
      loadStats();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error al eliminar proxy');
    }
  };

  const importProxies = async () => {
    if (!importText.trim()) {
      setMessage('Por favor ingresa los proxies a importar');
      return;
    }

    const proxyList = importText.split('\n').filter(line => line.trim());
    
    setLoading(true);
    try {
      const response = await apiService.post('/proxies/import', { proxies: proxyList });
      setMessage(`Importación completada: ${response.data.results.added} agregados, ${response.data.results.skipped} omitidos, ${response.data.results.errors} errores`);
      setImportText('');
      setShowImportForm(false);
      loadProxies();
      loadStats();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error al importar proxies');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Proxy Manager</h1>
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          Acceso denegado. Se requieren permisos de administrador.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Proxy Manager</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            {showAddForm ? 'Cancelar' : 'Agregar Proxy'}
          </button>
          <button
            onClick={() => setShowImportForm(!showImportForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            {showImportForm ? 'Cancelar' : 'Importar Proxies'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Proxies</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.overall.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Activos</h3>
            <p className="text-2xl font-bold text-green-600">{stats.overall.active}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Inactivos</h3>
            <p className="text-2xl font-bold text-red-600">{stats.overall.inactive}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Tasa de Éxito Promedio</h3>
            <p className="text-2xl font-bold text-blue-600">{Math.round(stats.overall.avgSuccessRate)}%</p>
          </div>
        </div>
      )}

      {/* Add Proxy Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Agregar Nuevo Proxy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
              <input
                type="text"
                value={newProxy.host}
                onChange={(e) => setNewProxy({...newProxy, host: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="192.168.1.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Puerto</label>
              <input
                type="number"
                value={newProxy.port}
                onChange={(e) => setNewProxy({...newProxy, port: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="8080"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuario (opcional)</label>
              <input
                type="text"
                value={newProxy.username}
                onChange={(e) => setNewProxy({...newProxy, username: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña (opcional)</label>
              <input
                type="password"
                value={newProxy.password}
                onChange={(e) => setNewProxy({...newProxy, password: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="contraseña"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Protocolo</label>
              <select
                value={newProxy.protocol}
                onChange={(e) => setNewProxy({...newProxy, protocol: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks4">SOCKS4</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">País (opcional)</label>
              <input
                type="text"
                value={newProxy.country}
                onChange={(e) => setNewProxy({...newProxy, country: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="United States"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={addProxy}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Agregando...' : 'Agregar Proxy'}
            </button>
          </div>
        </div>
      )}

      {/* Import Proxies Form */}
      {showImportForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Importar Proxies</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proxies (uno por línea)
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              rows="8"
              placeholder="Formato 1: host:port&#10;192.168.1.1:8080&#10;10.0.0.1:3128&#10;&#10;Formato 2: protocol://user:pass@host:port&#10;http://user:pass@192.168.1.1:8080&#10;https://admin:123456@10.0.0.1:3128"
            />
            <p className="text-xs text-gray-500 mt-1">
              Soporta formatos: host:port o protocol://user:pass@host:port
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={importProxies}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Importando...' : 'Importar Proxies'}
            </button>
          </div>
        </div>
      )}

      {/* Proxies List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Lista de Proxies</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proxy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  País
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasa de Éxito
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Uso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proxies.map((proxy) => (
                <tr key={proxy._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {proxy.host}:{proxy.port}
                    </div>
                    <div className="text-sm text-gray-500">
                      {proxy.protocol.toUpperCase()}
                      {proxy.username && ` • ${proxy.username}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {proxy.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      proxy.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {proxy.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getSuccessRateColor(proxy.successRate)}`}>
                      {proxy.successRate}%
                    </span>
                    <div className="text-xs text-gray-500">
                      {proxy.successCount} ✓ / {proxy.failCount} ✗
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proxy.lastUsed 
                      ? new Date(proxy.lastUsed).toLocaleString()
                      : 'Nunca'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateProxy(proxy._id, { isActive: !proxy.isActive })}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {proxy.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => deleteProxy(proxy._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProxyManager; 