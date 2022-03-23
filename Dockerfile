FROM node:14.17.0-alpine
ENV NODE_ENV production
ENV PORT 8080
WORKDIR /app

COPY node_modules node_modules
COPY views views
COPY security security
COPY server.js server.js

CMD ["node", "server.js"]

EXPOSE 8080
