# frontend/Dockerfile

FROM node:18-alpine AS builder


WORKDIR /app


COPY package*.json ./


RUN npm ci --legacy-peer-deps



COPY . .


EXPOSE 3000

#
CMD ["npm", "start"]