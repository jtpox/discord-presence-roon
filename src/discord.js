/** @module discord */
const { register, Client } = require('discord-rpc');

let Discord = undefined;
const scopes = ['rpc'];

/**
 * Constructor for Discord integration.
 * @function Initiate
 * @param {import('./settings').TSettings} settings Extension settings object.
 */
function Initiate(settings) {
    const client = new Client({
        transport: 'ipc',
    });

    client.on('ready', () => {
        console.log(`Discord: Authed for user ${client.user.username}`);
        Discord = client;
    });

    Connect(client, settings.discordClientId);
}

/**
 * Connect to the Discord RPC.
 * @function Connect
 * @async
 * @param {Client} client The Client instance for Discord RPC.
 * @param {string} clientId The Client ID to access Discord RPC.
 */
async function Connect(client, clientId) {
    try {
        client.login({
            clientId,
            // scopes,
        }).catch(console.error);
    } catch {
        console.log('Discord: Timed out. Please edit settings and try again.');
    }
}

/**
 * Get the Discord RPC instance.
 * @function Self
 * @returns {(Client|undefined)} Returns the Client when a connection has been established, or an empty object otherwise.
 */
function Self() { return Discord; }

module.exports = {
    Self,
    Initiate,
};