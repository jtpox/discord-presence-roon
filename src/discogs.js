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
 * Search through Discogs' database for an {@link album}, by an {@link artist}, containing a {@link track}.
 * @async
 * @function Search
 * @param {string} artist Name of artist. Must not be empty.
 * @param {string} album Name of album.
 * @param {string} track Name of track.
 * @returns {Promise<object>} Data retrieved from Discogs. Returns an empty object if no results are found.
 */
async function Search(artist, album, track) {
    return new Promise(async (resolve, reject) => {
        if(!Settings.discogsEnable) reject({});
        if (!artist) reject(`Missing artist for '${track} - ${album}'`); // Likely to hit a false positive
    
        /** @param {string} str */
        const stripFeat = (str) => str.substring(0, str.indexOf(' (feat.')) || str; // Strip extraneous `feat.` substring
    
        const artists = artist.split(' / ');
        let results = await Client.search({
            title: stripFeat(album), 
            artist: artists[0], // Avoid missing due to Roon providing extraneous artists
            credit: artists[1], // Handles remixes/etc. better, but can miss when Discogs credits are wrong
            track: stripFeat(track),
        });

        // Retrieve the first result.
        resolve(results.results[0] || {});
    });
}

module.exports = {
    Initiate,
    Search,
};