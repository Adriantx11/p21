# 🚀 Guía de Despliegue

## Frontend (Vercel)

### Variables de Entorno Requeridas:

```env
VITE_API_URL=https://tu-backend-en-render.onrender.com/api
VITE_APP_NAME=Galaxy Subscriptions Dashboard
VITE_APP_VERSION=1.0.0
```

### Pasos para Desplegar:

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login a Vercel:**
   ```bash
   vercel login
   ```

3. **Desplegar:**
   ```bash
   vercel
   ```

4. **Configurar Variables de Entorno:**
   - Ve a tu proyecto en Vercel Dashboard
   - Settings → Environment Variables
   - Agrega las variables listadas arriba

5. **Desplegar a Producción:**
   ```bash
   vercel --prod
   ```

## Backend (Render)

### Variables de Entorno Requeridas:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database
JWT_SECRET=tu-jwt-secret-super-seguro
PORT=5000
NODE_ENV=production
```

### Pasos para Desplegar:

1. **Conectar GitHub a Render**
2. **Crear nuevo Web Service**
3. **Configurar:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** `backend`

## Base de Datos (MongoDB Atlas)

1. **Crear cluster en MongoDB Atlas**
2. **Configurar Network Access**
3. **Crear usuario de base de datos**
4. **Obtener connection string**

## Orden de Despliegue:

1. ✅ **MongoDB Atlas** (Base de datos)
2. ✅ **Backend en Render** (API)
3. ✅ **Frontend en Vercel** (Web App)
4. ✅ **Configurar variables de entorno**
5. ✅ **Probar aplicación completa**

## URLs Finales:

- **Frontend:** `https://tu-app.vercel.app`
- **Backend:** `https://tu-backend.onrender.com`
- **API:** `https://tu-backend.onrender.com/api` 