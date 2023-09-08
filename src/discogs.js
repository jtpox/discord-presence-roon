const Discogs = require('disconnect').Client;
const RoonSettings = require('./settings');

let Client;
let Settings;

function Initiate(roon, discogsUserToken) {
    Settings = roon.load_config('settings') || RoonSettings.DefaultSettings;
    if(!Settings.enableDiscogs) return;

    Client = new Discogs({
        userToken: process.env.DISCOG_USER_TOKEN,
    }).database();
}

async function Search(artist, track) {
    if(!Settings.enableDiscogs) return {};
    
    let results = await Client.search({
        artist,
        track,
    });

    // Retrieve the first result.
    return results.results[0] || {};
}

module.exports = {
    Initiate,
    Search,
};