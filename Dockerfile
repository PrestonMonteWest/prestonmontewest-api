FROM node:12

ARG port=3000

WORKDIR /app

COPY package.json .

RUN npm i

COPY . .

ENV PORT=${port}

EXPOSE ${port}

CMD [ "npm", "start" ]
