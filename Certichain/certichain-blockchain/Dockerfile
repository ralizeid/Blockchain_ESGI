FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm ci --only=dev

COPY . .

RUN npm run build

EXPOSE 8545

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
