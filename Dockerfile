FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]