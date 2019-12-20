FROM node:12
ENV NODE_ENV=production

WORKDIR /app
COPY package.json .
RUN npm i
COPY . .

CMD [ "npm", "start" ]
