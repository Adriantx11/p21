# Galaxy Dashboard - Amazon Checker Integration

Una aplicación web moderna con dashboard analítico y herramienta exclusiva de verificación de tarjetas para Amazon.

## 🚀 Características

### Dashboard Principal
- **Analytics Avanzados**: Gráficos interactivos y estadísticas en tiempo real
- **Sistema de Suscripciones**: Plan Free Trial (1 día) y Plan Mensual
- **Interfaz Moderna**: Diseño galáctico con tema oscuro
- **Responsive**: Compatible con todos los dispositivos

### Amazon Checker (Exclusivo Plan Mensual)
- **Verificación de Tarjetas**: Herramienta para verificar tarjetas de crédito en Amazon
- **Gestión de Cookies**: Almacenamiento seguro de cookies de Amazon
- **Estadísticas Detalladas**: Métricas de verificación y éxito
- **Formato Estándar**: Soporte para formato cc|mm|aaaa|cvv
- **Límite de Seguridad**: Máximo 15 tarjetas por consulta

## 🛠️ Tecnologías

### Frontend
- **React 18** con Vite
- **Tailwind CSS** para estilos
- **Recharts** para gráficos
- **React Router** para navegación
- **Context API** para estado global

### Backend
- **Node.js** con Express
- **MongoDB** con Mongoose
- **JWT** para autenticación
- **bcrypt** para encriptación
- **Helmet** para seguridad

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- MongoDB
- pnpm (recomendado)

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd dashboard
```

### 2. Instalar dependencias
```bash
# Frontend
pnpm install

# Backend
cd backend
pnpm install
```

### 3. Configurar variables de entorno
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Galaxy Subscriptions Dashboard
VITE_APP_VERSION=1.0.0

# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/galaxy-dashboard
JWT_SECRET=your-secret-key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 4. Ejecutar la aplicación
```bash
# Terminal 1 - Backend
cd backend
pnpm dev

# Terminal 2 - Frontend
pnpm dev
```

## 🔐 Autenticación y Roles

### Usuarios
- **Free Trial**: Acceso básico al dashboard (1 día)
- **Monthly Plan**: Acceso completo + Amazon Checker + todas las funcionalidades

### Admin
- Panel de administración
- Gestión de usuarios
- Estadísticas del sistema

## 📊 Amazon Checker

### Funcionalidades
- **Guardar Cookie**: Almacenamiento seguro de cookies de Amazon
- **Verificar Tarjetas**: Procesamiento de hasta 15 tarjetas por consulta
- **Estadísticas**: Métricas de éxito y fallo
- **Formato**: cc|mm|aaaa|cvv (una por línea)

### Seguridad
- Verificación de plan premium
- Validación de formato de tarjetas
- Límites de uso
- Encriptación de datos sensibles

## 🎨 Interfaz

### Tema Galáctico
- Fondo animado con estrellas
- Gradientes espaciales
- Efectos de transparencia
- Tipografía moderna

### Componentes
- **Dashboard**: Vista principal con métricas
- **Sidebar**: Navegación principal
- **Charts**: Gráficos interactivos
- **Amazon Checker**: Herramienta exclusiva

## 🔧 Desarrollo

### Estructura del Proyecto
```
dashboard/
├── src/
│   ├── components/
│   │   ├── charts/          # Gráficos
│   │   ├── Dashboard.jsx    # Dashboard principal
│   │   └── Sidebar.jsx      # Navegación
│   ├── pages/
│   │   ├── AmazonChecker.jsx # Amazon Checker
│   │   └── SubscriptionPlans.jsx
│   └── services/
│       └── api.js           # Servicios API
├── backend/
│   ├── routes/
│   │   ├── amazon.js        # Rutas Amazon
│   │   └── auth.js          # Autenticación
│   ├── models/
│   │   └── User.js          # Modelo usuario
│   └── server.js            # Servidor principal
└── amazon.py                # Script original Python
```

### Comandos de Desarrollo
```bash
# Frontend
pnpm dev          # Desarrollo
pnpm build        # Producción
pnpm preview      # Vista previa

# Backend
pnpm dev          # Desarrollo con nodemon
pnpm start        # Producción
```

## 🚀 Despliegue

### Frontend (Vercel/Netlify)
```bash
pnpm build
# Subir dist/ a tu plataforma
```

### Backend (Railway/Render)
```bash
# Configurar variables de entorno
# Conectar base de datos MongoDB
# Deploy automático desde GitHub
```

## 📝 Licencia

Este proyecto es privado y confidencial. No distribuir sin autorización.

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📞 Soporte

Para soporte técnico o preguntas sobre Amazon Checker:
- Email: support@galaxydashboard.com
- Telegram: @galaxysupport

---

**Nota**: Amazon Checker es una herramienta exclusiva para usuarios con plan mensual. Se requiere autenticación y plan premium para su uso.
