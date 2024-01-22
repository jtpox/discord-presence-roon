FROM node:alpine AS build
RUN apk update && apk add git
RUN git clone https://github.com/jtpox/discord-presence-roon.git
WORKDIR /discord-presence-roon
RUN npm install

FROM node:alpine
RUN mkdir -p /app
COPY --from=build /discord-presence-roon /app
ENTRYPOINT ["node", "."]
