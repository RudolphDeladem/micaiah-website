# Build from the repository root so the shared Scripture library is available:
#   docker build -f server/Dockerfile -t micaiah-insight .
FROM node:22-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/src ./src
COPY mobile/src/data/scripture.json ./data/scripture.json
COPY mobile/src/data/bible-books.json ./bible/src/data/bible-books.json
COPY mobile/assets/bibles/kjv.bible ./bible/assets/bibles/kjv.bible
# Monthly interpretation counts are saved here; mount a persistent volume at /data.
RUN mkdir -p /data && chown node /data
ENV NODE_ENV=production CATALOG_PATH=/app/data/scripture.json BIBLE_DIR=/app/bible USAGE_FILE=/data/usage.json PORT=8787
EXPOSE 8787
USER node
CMD ["node", "src/server.ts"]
