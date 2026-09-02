FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "node_modules/vite/bin/vite.js", "--port", "3000", "--host"]
