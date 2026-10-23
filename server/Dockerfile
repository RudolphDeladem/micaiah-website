# Build from the repository root so the shared Scripture library is available:
#   docker build -f server/Dockerfile -t micaiah-insight .
FROM node:22-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/src ./src
COPY mobile/src/data/scripture.json ./data/scripture.json
ENV NODE_ENV=production CATALOG_PATH=/app/data/scripture.json PORT=8787
EXPOSE 8787
USER node
CMD ["node", "src/server.ts"]
