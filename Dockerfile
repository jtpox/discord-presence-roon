FROM node:alpine AS build
RUN apk update && apk add git
RUN git clone https://github.com/jtpox/discord-presence-roon.git
RUN cd /discord-presence-roon && npm install

FROM node:alpine
RUN mkdir -p /app
COPY --from=build /discord-presence-roon /app
WORKDIR /app
ENTRYPOINT ["node", "."]
