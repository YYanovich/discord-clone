FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --ignore-engines --network-timeout 100000

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]