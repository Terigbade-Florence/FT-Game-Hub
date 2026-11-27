FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY server ./server
COPY public ./public
# Mount a volume at /data to keep the SQLite file between restarts.
ENV PORT=3000 DB_FILE=/data/data.sqlite
RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 3000
CMD ["node", "server/index.js"]
