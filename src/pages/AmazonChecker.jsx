import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import apiService from '../services/api';

const AmazonChecker = () => {
  const { currentUser } = useAuth();
  const [cookie, setCookie] = useState('');
  const [regionalCookie, setRegionalCookie] = useState('');
  const [cards, setCards] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [cookieStatus, setCookieStatus] = useState('inactive');
  const [regionalCookieStatus, setRegionalCookieStatus] = useState('inactive');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
    checkCookieStatus();
    checkRegionalCookieStatus();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiService.getAmazonStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkCookieStatus = async () => {
    try {
      const response = await apiService.getAmazonCookie();
      setCookieStatus('active');
      setCookie(response.cookie);
    } catch (error) {
      setCookieStatus('inactive');
    }
  };

  const checkRegionalCookieStatus = async () => {
    try {
      const response = await apiService.getAmazonRegionalCookie();
      setRegionalCookieStatus('active');
      setRegionalCookie(response.cookie);
    } catch (error) {
      setRegionalCookieStatus('inactive');
    }
  };

  const saveCookie = async () => {
    if (!cookie.trim()) {
      setMessage('Por favor ingresa una cookie válida');
      return;
    }

    setLoading(true);
    try {
      await apiService.post('/amazon/save-cookie', { cookie });
      setMessage('Cookie guardada correctamente');
      setCookieStatus('active');
      loadStats();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error al guardar cookie');
    } finally {
      setLoading(false);
    }
  };

  const saveRegionalCookie = async () => {
    if (!regionalCookie.trim()) {
      setMessage('Por favor ingresa una cookie regional válida');
      return;
    }

    setLoading(true);
    try {
      await apiService.saveAmazonRegionalCookie(regionalCookie);
      setMessage('Cookie regional guardada correctamente');
      setRegionalCookieStatus('active');
      loadStats();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error al guardar cookie regional');
    } finally {
      setLoading(false);
    }
  };

  const checkCards = async (useRegionalCookie = false) => {
    if (!cards.trim()) {
      setMessage('Por favor ingresa las tarjetas a verificar');
      return;
    }

    // Check if we have the appropriate cookie
    if (!useRegionalCookie && cookieStatus !== 'active') {
      setMessage('No tienes una cookie activa. Guarda una cookie primero.');
      return;
    }

    if (useRegionalCookie && regionalCookieStatus !== 'active') {
      setMessage('No tienes una cookie regional activa. Guarda una cookie regional primero.');
      return;
    }

    const cardList = cards.split('\n').filter(card => card.trim());
    
    if (cardList.length === 0) {
      setMessage('No se encontraron tarjetas válidas');
      return;
    }

    if (cardList.length > 15) {
      setMessage('Máximo 15 tarjetas por consulta');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      let response;
      
      if (useRegionalCookie) {
        // Use regional cookie API endpoint
        response = await apiService.checkCardsWithRegionalCookie(cardList);
      } else {
        // Use standard cookie API endpoint
        response = await apiService.post('/amazon/check-cards', { cards: cardList });
      }
      
      setResults(response.results || []);
      setMessage(`Verificación completada. ${response.totalCards || response.results.length} tarjetas procesadas.`);
      loadStats();
    } catch (error) {
      if (error.response?.data?.requiresUpgrade) {
        setMessage('Se requiere plan premium para usar Amazon Checker');
      } else {
        setMessage(error.response?.data?.message || 'Error al verificar tarjetas');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCard = (card) => {
    const parts = card.split('|');
    if (parts.length === 4) {
      return `${parts[0].slice(0, 6)}******${parts[0].slice(-4)}|${parts[1]}|${parts[2]}|${parts[3]}`;
    }
    return card;
  };

  const getStatusColor = (status) => {
    if (status.includes('Approved')) return 'text-green-600';
    if (status.includes('Declined')) return 'text-red-600';
    if (status.includes('Address Required')) return 'text-yellow-600';
    if (status.includes('Invalid Cookies')) return 'text-orange-600';
    return 'text-gray-600';
  };

  const exportResults = () => {
    if (results.length === 0) return;
    
    const liveCards = results.filter(r => r.status.includes('Approved')).map(r => r.card);
    const declineCards = results.filter(r => r.status.includes('Declined')).map(r => r.card);
    
    const exportData = {
      live: liveCards,
      decline: declineCards,
      total: results.length,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amazon-checker-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Amazon Checker</h1>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          cookieStatus === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          Cookie: {cookieStatus === 'active' ? 'Activa' : 'Inactiva'}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Error') || message.includes('requiere') 
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
            <h3 className="text-sm font-medium text-gray-500">Total Checks</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalChecks}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Approved</h3>
            <p className="text-2xl font-bold text-green-600">{stats.approvedCards}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Declined</h3>
            <p className="text-2xl font-bold text-red-600">{stats.declinedCards}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
          </div>
        </div>
      )}

      {/* Cookie Management */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Cookie Management</h2>
        
        {/* Standard Amazon Cookie */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Amazon Cookie
            </label>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              cookieStatus === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {cookieStatus === 'active' ? 'Activa' : 'Inactiva'}
            </div>
          </div>
          <textarea
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            placeholder="Pega tu cookie de Amazon aquí..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="3"
          />
          <button
            onClick={saveCookie}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cookie'}
          </button>
        </div>
        
        {/* Regional Amazon Cookie */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Amazon Regional Cookie
            </label>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              regionalCookieStatus === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {regionalCookieStatus === 'active' ? 'Activa' : 'Inactiva'}
            </div>
          </div>
          <textarea
            value={regionalCookie}
            onChange={(e) => setRegionalCookie(e.target.value)}
            placeholder="Pega tu cookie regional de Amazon aquí..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="3"
          />
          <button
            onClick={saveRegionalCookie}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cookie Regional'}
          </button>
        </div>
      </div>

      {/* Card Checker */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Card Checker</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarjetas (Formato: cc|mm|aaaa|cvv)
            </label>
            <textarea
              value={cards}
              onChange={(e) => setCards(e.target.value)}
              placeholder="4532640527811647|09|2025|123&#10;4532640527811648|10|2026|456"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows="6"
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo 15 tarjetas por consulta. Una tarjeta por línea.
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => checkCards(false)}
              disabled={loading || cookieStatus === 'inactive'}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar con Cookie Standard'}
            </button>
            <button
              onClick={() => checkCards(true)}
              disabled={loading || regionalCookieStatus === 'inactive'}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar con Cookie Regional'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800">Resumen de Resultados</h2>
            <button
              onClick={exportResults}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              Exportar Resultados
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="font-medium text-green-800">Live</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {results.filter(r => r.status.includes('Approved')).length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="font-medium text-red-800">Decline</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {results.filter(r => r.status.includes('Declined')).length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="font-medium text-yellow-800">Otros</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {results.filter(r => !r.status.includes('Approved') && !r.status.includes('Declined')).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Results */}
      {results.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Resultados Detallados</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                result.status.includes('Approved') 
                  ? 'border-green-200 bg-green-50' 
                  : result.status.includes('Declined')
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm font-medium">{formatCard(result.card)}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    result.status.includes('Approved') 
                      ? 'bg-green-100 text-green-800' 
                      : result.status.includes('Declined')
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white p-2 rounded border">
                    <span className="font-medium text-gray-600">Status:</span>
                    <p className="text-gray-900">{result.status}</p>
                  </div>
                  
                  {result.response && (
                    <div className="bg-white p-2 rounded border">
                      <span className="font-medium text-gray-600">Response:</span>
                      <p className="text-gray-900">{result.response}</p>
                    </div>
                  )}
                  
                  {result.removed && (
                    <div className="bg-white p-2 rounded border">
                      <span className="font-medium text-gray-600">Removed:</span>
                      <p className="text-gray-900">{result.removed}</p>
                    </div>
                  )}
                  
                  {result.bin && (
                    <div className="bg-white p-2 rounded border">
                      <span className="font-medium text-gray-600">BIN Info:</span>
                      <p className="text-gray-900">
                        {result.bin.scheme} {result.bin.type} {result.bin.category}
                      </p>
                    </div>
                  )}
                  
                  {result.country && (
                    <div className="bg-white p-2 rounded border">
                      <span className="font-medium text-gray-600">Country:</span>
                      <p className="text-gray-900">
                        {result.country.name} {result.country.emoji}
                      </p>
                    </div>
                  )}
                  
                  {result.bank && (
                    <div className="bg-white p-2 rounded border">
                      <span className="font-medium text-gray-600">Bank:</span>
                      <p className="text-gray-900">{result.bank.name}</p>
                    </div>
                  )}
                  
                  {result.processingTime && (
                    <div className="bg-white p-2 rounded border">
                      <span className="font-medium text-gray-600">Time:</span>
                      <p className="text-gray-900">{result.processingTime}s</p>
                    </div>
                  )}
                  
                  {result.proxyUsed && (
                    <div className="bg-white p-2 rounded border">
                      <span className="font-medium text-gray-600">Proxy:</span>
                      <p className="text-gray-900">{result.proxyUsed}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800 mb-3">Instrucciones</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>1. <strong>Cookie:</strong> Guarda tu cookie de Amazon para poder verificar tarjetas.</p>
          <p>2. <strong>Cookie Regional:</strong> Guarda tu cookie regional para integracion con el bot de Telegram.</p>
          <p>3. <strong>Formato:</strong> Las tarjetas deben estar en formato cc|mm|aaaa|cvv</p>
          <p>4. <strong>Límite:</strong> Máximo 15 tarjetas por consulta</p>
          <p>5. <strong>Plan:</strong> Se requiere plan premium para usar esta función</p>
        </div>
      </div>
    </div>
  );
};

export default AmazonChecker; 