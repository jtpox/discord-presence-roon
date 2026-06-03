/** @module discord */
const { DiscordIPC, ActivityTypes } = require('discord-ipc');
const { Info, Error } = require('./console');

let Discord = undefined;
const scopes = ['rpc'];

/**
 * Constructor for Discord integration.
 * @function Initiate
 * @param {import('./settings').TSettings} settings Extension settings object.
 */
async function Initiate(settings) {
    Discord = new DiscordIPC({
        clientId: settings.discordClientId,
        debug: true,
    });

    try {
        await Discord.connect();
        await Discord.handshake();
        await Discord.authenticate();
    } catch (err) {
        Error(`Discord IPC Init: ${err}`);
    }
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