const Discogs = require('disconnect').Client;

let Client;
function Initiate() {
    if(process.env.ENABLE_DISCOGS.toLowerCase() == 'false') return;

    Client = new Discogs({
        userToken: process.env.DISCOG_USER_TOKEN,
    }).database();
}

async function Search(artist, track) {
    if(process.env.ENABLE_DISCOGS.toLowerCase() == 'false') return {};
    
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