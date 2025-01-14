FROM node:20-alpine as builder

RUN apk add --update --no-cache openssl1.1-compat # nødvendig for prisma generate i node:18-alpine

ADD / /src
ENV CI=true
WORKDIR /src

RUN chmod +x /src/entrypoint.sh

RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    NODE_AUTH_TOKEN=$(cat /run/secrets/NODE_AUTH_TOKEN) \
    npm ci
RUN npm run build

USER node

ENV NODE_ENV="production"

ENTRYPOINT ["/src/entrypoint.sh"]

EXPOSE 3000
