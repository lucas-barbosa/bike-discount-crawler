FROM node:20.11-slim

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

WORKDIR /opt/app/packages/app/dist/src
CMD [ "node", "index.js" ]
