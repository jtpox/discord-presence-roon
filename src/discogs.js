const Discogs = require('disconnect').Client;
const RoonSettings = require('./settings');

let Client;
let Settings;

function Initiate(roon, discogsUserToken) {
    Settings = roon.load_config('settings') || RoonSettings.DefaultSettings;
    if(!Settings.discogsEnable) return;

    Client = new Discogs({
        userToken: discogsUserToken,
    }).database();
}

async function Search(artist, track) {
    if(!Settings.discogsEnable) return {};
    
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