/** @module discogs */
const Discogs = require('disconnect').Client;

let Client;
let Settings;

/**
 * Constructor for Discogs integration.
 * @function Initiate
 * @param {import('@roonlabs/node-roon-api').RoonApi} roon The Roon instance.
 * @param {import('./settings').TSettings} settings Extension settings object.
 */
function Initiate(roon, settings) {
    Settings = settings;
    if(!Settings.discogsEnable) return;

    Client = new Discogs({
        userToken: Settings.discogsUserToken,
    }).database();
}

/**
 * Search through Discogs database using artist name and track name.
 * @async
 * @function Search
 * @param {string} artist Name of artist.
 * @param {string} track Name of track.
 * @returns {Promise<object>} Data retrieved from Discogs. It may return an empty object.
 */
async function Search(artist, track) {
    return new Promise(async (resolve, reject) => {
        if(!Settings.discogsEnable) reject({});
    
        let results = await Client.search({
            artist,
            track,
        });

        // Retrieve the first result.
        resolve(results.results[0] || {});
    });
}

module.exports = {
    Initiate,
    Search,
};