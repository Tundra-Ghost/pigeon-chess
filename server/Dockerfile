FROM node:20-alpine
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --omit=dev || npm install --production

# Copy source
COPY src ./src
COPY db ./db

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

CMD ["node","./src/index.js"]

