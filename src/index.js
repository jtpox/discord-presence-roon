const { Client } = require('@xhayper/discord-rpc');

const dotenv = require('dotenv');
dotenv.config();

const Roon = require('./roon');

var client = new Client({
    clientId: process.env.CLIENT_ID,
});

client.on('ready', () => {
    console.log(`Authed for user ${client.user.username}`);
    Roon.Initiate(client);
});

client.login();