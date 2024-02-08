FROM node:20.11-slim as builder

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY package.json yarn.lock tsconfig.json src ./

RUN yarn install
RUN yarn build

FROM node:18-slim AS final

WORKDIR /usr/src/app

COPY --from=builder /opt/app/dist ./dist
COPY package.json yarn.lock ./

RUN yarn install --production
RUN apt-get update -y && apt-get install -y openssl

CMD [ "yarn", "start" ]