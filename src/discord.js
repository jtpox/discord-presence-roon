const { Client } = require('@xhayper/discord-rpc');

let Discord;

function Initiate(clientId) {
    const client = new Client({
        clientId: clientId,
    });

    client.on('ready', () => {
        console.log(`Authed for user ${client.user.username}`);
        // Discord = client;
    });

    Connect(client);
}

async function Connect(client, count = 0) {
    if(count >= 10) {
        console.log('Max retry attempted. Please edit settings and try again.');
        return;
    }

    try {
        client.login();
        Discord = client;
    } catch {
        console.log('Timed out. Edit Discord settings again.');
        // Connect(count++);
    }
}

module.exports = {
    Self: Discord,
    Initiate,
};