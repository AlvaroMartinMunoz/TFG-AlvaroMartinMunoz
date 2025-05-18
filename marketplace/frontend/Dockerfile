# frontend/Dockerfile

# Etapa 1: Construir la aplicación React
FROM node:18-alpine AS builder
# 'AS builder' le da un nombre a esta etapa

WORKDIR /app

COPY package.json package-lock.json* ./
# Si tienes package-lock.json, 'npm ci' es generalmente preferido para builds de CI/producción
# ya que instala exactamente las versiones del lockfile y es más rápido.
# Si no tienes package-lock.json o prefieres 'npm install', está bien.
RUN npm ci --legacy-peer-deps
# RUN npm install --legacy-peer-deps # Alternativa si 'npm ci' no te funciona

COPY . .

# Aquí puedes pasar variables de entorno en tiempo de build si tu app las necesita para construir
# Ejemplo: ARG REACT_APP_API_URL
# ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Etapa 2: Servir la aplicación construida con Nginx
FROM nginx:1.25-alpine

# Copia los archivos estáticos construidos desde la etapa 'builder'
# La carpeta de salida de 'npm run build' suele ser 'build' o 'dist'
# Ajusta '/app/build' si tu carpeta de salida es diferente
COPY --from=builder /app/build /usr/share/nginx/html

# (Opcional pero recomendado si usas React Router)
# Copia un archivo de configuración personalizado de Nginx para manejar el enrutamiento del lado del cliente.
# Si no lo haces, Nginx podría dar 404 en rutas profundas de React al recargar la página.
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80, que es el puerto estándar de Nginx
EXPOSE 80

# Comando para iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]