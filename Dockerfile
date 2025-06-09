FROM node:20.11.1-alpine

WORKDIR /txmon

COPY *.json *.js ./

ENV NODE_OPTIONS=--max_old_space_size=4096

RUN npm install

CMD [ "node", "txmon.js" ]
