const { register, Client } = require('discord-rpc');

let Discord = {};
const scopes = ['rpc'];

function Initiate(clientId) {
    const client = new Client({
        transport: 'ipc',
    });

    client.on('ready', () => {
        console.log(`Discord: Authed for user ${client.user.username}`);
        Discord = client;
        console.log(Discord);
    });

    Connect(client, clientId);
}

async function Connect(client, clientId, count = 0) {
    try {
        client.login({
            clientId,
            // scopes,
        }).catch(console.error);
    } catch {
        console.log('Discord: Timed out. Please edit settings and try again.');
    }
}

function Self() { return Discord; }

module.exports = {
    Self,
    Initiate,
};