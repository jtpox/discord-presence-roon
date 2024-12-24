/** @module discord */
const { register, Client } = require('@xhayper/discord-rpc');
const { Info, Error } = require('./console');

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
        Info(`Discord: Authed for user ${client.user.username}`);
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
    client.clientId = clientId;
    try {
        client.login({
            // scopes,
        }).catch(console.error);
    } catch {
        Error('Discord: Timed out. Please edit settings and try again.');
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