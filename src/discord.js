const { Client } = require('@xhayper/discord-rpc');

let Discord = {};

function Initiate(clientId) {
    const client = new Client({
        clientId: clientId,
    });

    client.on('ready', () => {
        console.log(`Discord: Authed for user ${client.user.username}`);
        Discord = client;
    });

    Connect(client);
}

async function Connect(client, count = 0) {
    try {
        await client.login();
    } catch {
        console.log('Discord: Timed out. Please edit settings and try again.');
    }
}

function Self() { return Discord; }

module.exports = {
    Self,
    Initiate,
};