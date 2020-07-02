FROM nginx:1.17.8-alpine as builder
COPY src /life-game/src
COPY public /life-game/public
COPY package.json /life-game/package.json
RUN  apk add --update nodejs npm && cd life-game  && npm install && npm run build

FROM nginx:1.17.8-alpine

COPY srvapi /srvapi
RUN  echo 'http://dl-cdn.alpinelinux.org/alpine/v3.9/main' >> /etc/apk/repositories
RUN  echo 'http://dl-cdn.alpinelinux.org/alpine/v3.9/community' >> /etc/apk/repositories
RUN  apk update
RUN  apk add mongodb
RUN  apk add --update nodejs npm && cd srvapi && npm install

COPY entrypoint.sh /entrypoint.sh
RUN  chmod +x /entrypoint.sh

COPY nginx-srvapi.conf /etc/nginx/conf.d/default.conf
COPY mongod.conf /etc/mongod.conf
COPY --from=builder /life-game/build /usr/share/nginx/html

CMD ["/entrypoint.sh" ]


