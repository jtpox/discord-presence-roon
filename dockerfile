FROM node:24-slim

WORKDIR /app

RUN apt-get update && apt-get -y install git

COPY . .
RUN npm install
# RUN git clone https://github.com/jtpox/discord-presence-roon.git . && npm install
