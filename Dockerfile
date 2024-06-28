FROM node:20.11-slim as builder

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY package.json yarn.lock tsconfig.json .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages ./packages

RUN ls -lh
RUN yarn install 
RUN yarn workspace @crawlers/base build
RUN yarn workspace @crawlers/bike-discount build
RUN yarn workspace @crawlers/app build

FROM node:20.11-slim AS final

RUN mkdir -p /usr/app
WORKDIR /usr/app

COPY --from=builder /opt/app/packages/app/dist ./
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /usr/app/src
CMD [ "node", "index.js" ]