# FAILSAFE DOCKERFILE AS BACKUP
FROM node:18-alpine
WORKDIR /app
COPY mockup/backend/package.json .
COPY mockup/backend/absolute-failsafe-server.js .
COPY mockup/ ./mockup/
EXPOSE 3000
CMD ["node", "absolute-failsafe-server.js"]