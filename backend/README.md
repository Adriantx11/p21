# Galaxy Subscriptions Backend

Backend API para el sistema de suscripciones Galaxy Dashboard.

## 🚀 Características

- **Autenticación JWT** con bcrypt para contraseñas
- **Base de datos MongoDB** con Mongoose ODM
- **Validación de datos** con express-validator
- **Middleware de seguridad** (Helmet, CORS, Rate Limiting)
- **Sistema de roles** (user/admin)
- **Gestión de suscripciones** (free/monthly)
- **API RESTful** completa

## 📋 Requisitos

- Node.js 16+
- MongoDB (local o Atlas)
- npm o pnpm

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   cd backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Editar `.env` con tus configuraciones:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/galaxy-subscriptions
   JWT_SECRET=tu-super-secret-jwt-key
   FRONTEND_URL=http://localhost:5173
   ```

4. **Crear usuario admin inicial**
   ```bash
   npm run create-admin
   ```

5. **Iniciar servidor**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

## 📊 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener perfil actual
- `POST /api/auth/logout` - Cerrar sesión

### Usuarios
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil
- `PUT /api/users/password` - Cambiar contraseña
- `GET /api/users` - Listar usuarios (admin)
- `PUT /api/users/:id` - Actualizar usuario (admin)
- `DELETE /api/users/:id` - Eliminar usuario (admin)

### Suscripciones
- `GET /api/subscriptions/plans` - Obtener planes disponibles
- `POST /api/subscriptions/upgrade` - Actualizar suscripción
- `GET /api/subscriptions/status` - Estado de suscripción
- `POST /api/subscriptions/cancel` - Cancelar suscripción
- `GET /api/subscriptions/stats` - Estadísticas (admin)
- `PUT /api/subscriptions/:userId` - Actualizar suscripción (admin)

## 🔐 Seguridad

- **JWT Tokens** para autenticación
- **bcrypt** para hash de contraseñas
- **Helmet** para headers de seguridad
- **CORS** configurado
- **Rate Limiting** para prevenir spam
- **Validación** de todos los inputs

## 🗄️ Base de Datos

### Modelo de Usuario
```javascript
{
  name: String,
  email: String (único),
  password: String (hasheado),
  numericId: String (único, para Telegram),
  role: String (user/admin),
  subscriptionStatus: String (free/monthly),
  subscriptionExpiry: Date,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Despliegue

### Opción 1: Vercel
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático

### Opción 2: Heroku
1. Crear app en Heroku
2. Conectar MongoDB Atlas
3. Configurar variables de entorno
4. Deploy

### Opción 3: DigitalOcean/Railway
1. Configurar servidor
2. Instalar MongoDB
3. Configurar PM2
4. Deploy

## 🔧 Variables de Entorno

```env
# Servidor
PORT=5000
NODE_ENV=development

# Base de datos
MONGODB_URI=mongodb://localhost:27017/galaxy-subscriptions

# JWT
JWT_SECRET=tu-super-secret-jwt-key

# CORS
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📝 Scripts Disponibles

- `npm start` - Iniciar servidor de producción
- `npm run dev` - Iniciar servidor de desarrollo
- `npm run create-admin` - Crear usuario admin inicial

## 🧪 Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@galaxy-subscriptions.com","password":"admin123456"}'
```

## 📚 Documentación

Para más detalles sobre los endpoints, consulta el código fuente o usa herramientas como Postman para probar la API.

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License 