# Utiliza una imagen base de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json (o yarn.lock)
COPY package*.json ./

# Instala las dependencias de Node.js
RUN npm install

# Copia el resto del código de tu aplicación React
COPY . .

# Construye la aplicación React para producción
RUN npm run build

# Expone el puerto en el que corre la aplicación React (por defecto suele ser 3000)
EXPOSE 3000

# Define el comando para iniciar el servidor de desarrollo (ajústalo si usas un script diferente)
CMD ["npm", "start"]