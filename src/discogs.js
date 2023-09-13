const Discogs = require('disconnect').Client;
const RoonSettings = require('./settings');

let Client;
let Settings;

/**
 * Constructor for Discogs integration.
 * @function Initiate
 * @param {import('@roonlabs/node-roon-api').RoonApi} roon The Roon instance.
 * @param {string} discogsUserToken User Token to access the Discogs API.
 */
function Initiate(roon, discogsUserToken) {
    Settings = roon.load_config('settings') || RoonSettings.DefaultSettings;
    if(!Settings.discogsEnable) return;

    Client = new Discogs({
        userToken: discogsUserToken,
    }).database();
}

/**
 * Search through Discogs database using artist name and track name.
 * @async
 * @function Search
 * @param {string} artist Name of artist.
 * @param {string} track Name of track.
 * @returns {object} Data retrieved from Discogs. It may return an empty object.
 */
async function Search(artist, track) {
    if(!Settings.discogsEnable) return {};
    
    let results = await Client.search({
        artist,
        track,
    });

    // Retrieve the first result.
    return results.results[0] || {};
}

/** @namespace discogs */
module.exports = {
    Initiate,
    Search,
};