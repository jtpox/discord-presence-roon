const { version, author } = require('../package.json');
const RoonApi = require('@roonlabs/node-roon-api');
const RoonApiTransport = require('node-roon-api-transport');
const RoonApiImage = require('node-roon-api-image');

const RoonSettings = require('./settings');
const Discord = require('./discord');
const Discogs = require('./discogs');
const Imgur = require('./imgur');

var roon = new RoonApi({
    extension_id: 'com.jtpox.discord-roon',
    display_name: `Discord Presence Integration`,
    display_version: version,
    publisher: author.name,
    email: author.email,
    website: author.url,

    core_paired: Paired,
    core_unpaired: Unpaired,
});

let ApiImage;
let Settings;

function Initiate() {

    RoonSettings.Initiate(roon);
    InitiateIntegrations();

    roon.init_services({
        required_services: [RoonApiTransport, RoonApiImage],
        provided_services: [RoonSettings.Service(InitiateIntegrations)],
    });
    // roon.start_discovery();
    Discover();
}

function Discover() {
    if(Discord.Self !== undefined) {
        console.log('Discovery started...');
        roon.start_discovery();
    } else {
        console.log('Discord not yet configured.');
        setTimeout(() => {
            Discover();
        }, 5000);
        return;
    }
}

function InitiateIntegrations() {
    console.log('Reloading settings...');
    Settings = roon.load_config('settings') || RoonSettings.DefaultSettings;

    Discord.Initiate(Settings.discordClientId);
    Discogs.Initiate(roon, Settings.discogsUserToken);
    Imgur.Initiate(roon, Settings.imgurClientId, Settings.imgurClientSecret, Settings.imgurAlbumId, Settings.imgurAlbumDeleteHash);
}

function Paired(core) {
    let transport = core.services.RoonApiTransport;
    ApiImage = new RoonApiImage(core);

    transport.subscribe_zones((cmd, data) => {
        if(Discord.Self === undefined) {
            console.log('Undefined');
            console.log(Discord);
            return;
        } else {
            console.log('Defined');
            console.log(Discord);
        }

        if(cmd === 'Changed' && data.hasOwnProperty('zones_changed')) {
            console.log('Here');
            console.log(Discord);
            const zones_to_check = Settings.roonZones.split(',');
            const zones = data.zones_changed.filter((data) => zones_to_check.includes(data.display_name));

            const priority_zone = zones.sort((a, b) => zones_to_check.indexOf(a.display_name) - zones_to_check.indexOf(b.display_name));

            if(priority_zone.length > 0) SongChanged(priority_zone[0]);
        }

        if(cmd === 'Changed' && data.hasOwnProperty('zones_removed')) Discord.user?.clearActivity();
    });
}

function Unpaired(core) {
    if(Discord.Self === undefined) return;
    Discord.Self.clearActivity();
}

async function SongChanged(data) {
    if(data.state === 'paused') {
        Discord.Self.user?.clearActivity();
    }

    if(data.state === 'playing') {
        const startTimestamp = Math.round((new Date().getTime() / 1000) - data.now_playing.seek_position);
        const endTimestamp = Math.round(startTimestamp + data.now_playing.length);

        let albumArt = 'roon_labs_logo';

        if(Settings.imgurEnable === 'true') {
            const imgurAlbum = await Imgur.GetAlbumArt(data.now_playing.image_key, GetImage);
            albumArt = imgurAlbum;
        }

        // Make sure that Imgur is prioritized even when both are enabled.
        if(
            Settings.discogsEnable === 'true'
            && albumArt === 'roon_labs_logo'
        ) {
            const searchResult = await Discogs.Search(data.now_playing.three_line.line2, data.now_playing.three_line.line1);
            albumArt = searchResult.cover_image;
        }

        Discord.Self.user?.setActivity({
            // details: data.now_playing.two_line.line1.substring(0, 128),
            details: data.now_playing.one_line.line1.substring(0, 128),
            state: data.now_playing.three_line.line3.substring(0, 128),
            // state: data.now_playing.two_line.line2.substring(0, 128),
            startTimestamp,
            endTimestamp,
            instance: false,
            largeImageKey: albumArt,
            largeImageText: `Listening at: ${data.display_name}`,
        });
    }
}

async function GetImage(image_key) {
    return new Promise((resolve, reject) => {
        ApiImage.get_image(image_key, (error, content_type, image) => {
            if(error) reject(error);

            resolve(Buffer.from(image));
        });
    });
}

Initiate();