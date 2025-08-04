import express from 'express';
import { protect } from '../middleware/auth.js';
import Proxy from '../models/Proxy.js';

const router = express.Router();

// Middleware para verificar si el usuario es admin
const checkAdminAccess = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar permisos' });
  }
};

// Obtener todos los proxies (solo admin)
router.get('/', protect, checkAdminAccess, async (req, res) => {
  try {
    const { page = 1, limit = 20, country, status } = req.query;
    
    const filter = {};
    if (country) filter.country = { $regex: country, $options: 'i' };
    if (status) filter.isActive = status === 'active';
    
    const proxies = await Proxy.find(filter)
      .sort({ successRate: -1, lastUsed: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password'); // No enviar contraseñas
    
    const total = await Proxy.countDocuments(filter);
    
    res.json({
      proxies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error al obtener proxies:', error);
    res.status(500).json({ message: 'Error al obtener proxies' });
  }
});

// Agregar nuevo proxy (solo admin)
router.post('/', protect, checkAdminAccess, async (req, res) => {
  try {
    const { host, port, username, password, protocol, country } = req.body;
    
    if (!host || !port) {
      return res.status(400).json({ message: 'Host y puerto son requeridos' });
    }
    
    // Verificar si el proxy ya existe
    const existingProxy = await Proxy.findOne({ host, port });
    if (existingProxy) {
      return res.status(400).json({ message: 'Este proxy ya existe' });
    }
    
    const proxy = new Proxy({
      host,
      port,
      username,
      password,
      protocol: protocol || 'http',
      country: country || 'Unknown'
    });
    
    await proxy.save();
    
    res.status(201).json({
      message: 'Proxy agregado exitosamente',
      proxy: {
        id: proxy._id,
        host: proxy.host,
        port: proxy.port,
        protocol: proxy.protocol,
        country: proxy.country,
        isActive: proxy.isActive
      }
    });
  } catch (error) {
    console.error('Error al agregar proxy:', error);
    res.status(500).json({ message: 'Error al agregar proxy' });
  }
});

// Actualizar proxy (solo admin)
router.put('/:id', protect, checkAdminAccess, async (req, res) => {
  try {
    const { host, port, username, password, protocol, country, isActive } = req.body;
    
    const proxy = await Proxy.findById(req.params.id);
    if (!proxy) {
      return res.status(404).json({ message: 'Proxy no encontrado' });
    }
    
    // Actualizar campos
    if (host) proxy.host = host;
    if (port) proxy.port = port;
    if (username !== undefined) proxy.username = username;
    if (password !== undefined) proxy.password = password;
    if (protocol) proxy.protocol = protocol;
    if (country) proxy.country = country;
    if (isActive !== undefined) proxy.isActive = isActive;
    
    await proxy.save();
    
    res.json({
      message: 'Proxy actualizado exitosamente',
      proxy: {
        id: proxy._id,
        host: proxy.host,
        port: proxy.port,
        protocol: proxy.protocol,
        country: proxy.country,
        isActive: proxy.isActive
      }
    });
  } catch (error) {
    console.error('Error al actualizar proxy:', error);
    res.status(500).json({ message: 'Error al actualizar proxy' });
  }
});

// Eliminar proxy (solo admin)
router.delete('/:id', protect, checkAdminAccess, async (req, res) => {
  try {
    const proxy = await Proxy.findByIdAndDelete(req.params.id);
    if (!proxy) {
      return res.status(404).json({ message: 'Proxy no encontrado' });
    }
    
    res.json({ message: 'Proxy eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar proxy:', error);
    res.status(500).json({ message: 'Error al eliminar proxy' });
  }
});

// Obtener proxy aleatorio para uso (solo usuarios autenticados)
router.get('/random', protect, async (req, res) => {
  try {
    const proxy = await Proxy.findOne({ isActive: true })
      .sort({ successRate: -1, lastUsed: 1 })
      .select('-password');
    
    if (!proxy) {
      return res.status(404).json({ message: 'No hay proxies disponibles' });
    }
    
    // Actualizar último uso
    proxy.lastUsed = new Date();
    await proxy.save();
    
    res.json({
      proxy: {
        id: proxy._id,
        host: proxy.host,
        port: proxy.port,
        protocol: proxy.protocol,
        username: proxy.username,
        country: proxy.country
      }
    });
  } catch (error) {
    console.error('Error al obtener proxy aleatorio:', error);
    res.status(500).json({ message: 'Error al obtener proxy' });
  }
});

// Actualizar estadísticas de proxy (usado internamente)
router.post('/:id/stats', protect, async (req, res) => {
  try {
    const { success, responseTime } = req.body;
    
    const proxy = await Proxy.findById(req.params.id);
    if (!proxy) {
      return res.status(404).json({ message: 'Proxy no encontrado' });
    }
    
    if (success) {
      proxy.successCount += 1;
    } else {
      proxy.failCount += 1;
    }
    
    if (responseTime) {
      proxy.responseTime = responseTime;
    }
    
    proxy.lastUsed = new Date();
    proxy.updateSuccessRate();
    await proxy.save();
    
    res.json({ message: 'Estadísticas actualizadas' });
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
    res.status(500).json({ message: 'Error al actualizar estadísticas' });
  }
});

// Obtener estadísticas de proxies (solo admin)
router.get('/stats', protect, checkAdminAccess, async (req, res) => {
  try {
    const stats = await Proxy.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
          avgSuccessRate: { $avg: '$successRate' },
          totalSuccess: { $sum: '$successCount' },
          totalFail: { $sum: '$failCount' }
        }
      }
    ]);
    
    const countryStats = await Proxy.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      overall: stats[0] || {
        total: 0,
        active: 0,
        inactive: 0,
        avgSuccessRate: 0,
        totalSuccess: 0,
        totalFail: 0
      },
      byCountry: countryStats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

// Importar proxies desde texto (solo admin)
router.post('/import', protect, checkAdminAccess, async (req, res) => {
  try {
    const { proxies } = req.body;
    
    if (!proxies || !Array.isArray(proxies)) {
      return res.status(400).json({ message: 'Formato inválido. Se requiere un array de proxies.' });
    }
    
    const results = {
      added: 0,
      skipped: 0,
      errors: 0
    };
    
    for (const proxyData of proxies) {
      try {
        // Parsear diferentes formatos de proxy
        let host, port, username, password, protocol = 'http';
        
        if (typeof proxyData === 'string') {
          // Formato: protocol://user:pass@host:port
          const match = proxyData.match(/^(https?|socks4|socks5):\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)$/);
          if (match) {
            protocol = match[1];
            username = match[2] || null;
            password = match[3] || null;
            host = match[4];
            port = parseInt(match[5]);
          } else {
            // Formato: host:port
            const parts = proxyData.split(':');
            if (parts.length === 2) {
              host = parts[0];
              port = parseInt(parts[1]);
            } else {
              results.errors++;
              continue;
            }
          }
        } else if (typeof proxyData === 'object') {
          host = proxyData.host;
          port = proxyData.port;
          username = proxyData.username || null;
          password = proxyData.password || null;
          protocol = proxyData.protocol || 'http';
        } else {
          results.errors++;
          continue;
        }
        
        // Verificar si ya existe
        const existing = await Proxy.findOne({ host, port });
        if (existing) {
          results.skipped++;
          continue;
        }
        
        // Crear nuevo proxy
        const proxy = new Proxy({
          host,
          port,
          username,
          password,
          protocol,
          country: proxyData.country || 'Unknown'
        });
        
        await proxy.save();
        results.added++;
        
      } catch (error) {
        results.errors++;
      }
    }
    
    res.json({
      message: 'Importación completada',
      results
    });
    
  } catch (error) {
    console.error('Error al importar proxies:', error);
    res.status(500).json({ message: 'Error al importar proxies' });
  }
});

export default router; 