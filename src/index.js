#!/usr/bin/env node
/** @module main */
const { version, author, homepage } = require('../package.json');
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
    website: homepage,

    core_paired: Paired,
    core_unpaired: Unpaired,
});

/** @type {import('./settings').TSettings} */
let Settings;

/**
 * The package constructor.
 * @function Initiate
 */
function Initiate() {

    RoonSettings.Initiate(roon);
    InitiateIntegrations();

    roon.init_services({
        required_services: [RoonApiTransport, RoonApiImage],
        provided_services: [RoonSettings.Service(InitiateIntegrations)],
    });
    roon.start_discovery();
}

/**
 * Initiate Discord, Discogs and Imgur integrations.
 * @function InitiateIntegrations
 */
function InitiateIntegrations() {
    console.log('Extension: Reloading settings');
    Settings = roon.load_config('settings') || RoonSettings.DefaultSettings;

    Discord.Initiate(Settings);
    Discogs.Initiate(roon, Settings);
    Imgur.Initiate(roon, Settings);
}

/**
 * Paired event callback for Roon.
 * @function Paired
 * @param {object} core The Roon core.
 */
function Paired(core) {
    let transport = core.services.RoonApiTransport;

    transport.subscribe_zones((cmd, data) => {
        if(Discord.Self() === undefined) return;

        if(cmd === 'Changed' && data.hasOwnProperty('zones_changed')) {
            const zones_to_check = Settings.roonZones.split(',');
            const zones = data.zones_changed.filter((data) => zones_to_check.includes(data.display_name));

            const priority_zone = zones.sort((a, b) => zones_to_check.indexOf(a.display_name) - zones_to_check.indexOf(b.display_name));

            if(priority_zone.length > 0) SongChanged(core, priority_zone[0]);
        }

        if(cmd === 'Changed' && data.hasOwnProperty('zones_removed')) Discord.Self().clearActivity();
    });
}

/**
 * Unpaired event callback for Roon.
 * @param {object} core The Roon core.
 */
function Unpaired(core) {
    if(Discord.Self() === undefined) return;
    Discord.Self().clearActivity();
}

/**
 * Song changed event which will update the Discord user activity.
 * @function SongChanged
 * @async
 * @param {object} core The Roon core.
 * @param {object} data The data provided by Roon zones.
 */
async function SongChanged(core, data) {
    if(data.state === 'paused') {
        Discord.Self().clearActivity();
    }

    if(data.state === 'playing') {
        // const startTimestamp = Math.round((new Date().getTime() / 1000) - (data.now_playing.seek_position || 0));
        // const endTimestamp = Math.round(startTimestamp + data.now_playing.length);
        const endTimestamp = Math.round((new Date().getTime() / 1000) + data.now_playing.length - data.now_playing.seek_position);

        const activity = {
            type: 2, // Doesn't work. (https://discord-api-types.dev/api/discord-api-types-v10/enum/ActivityType)
            details: data.now_playing.one_line.line1.substring(0, 128),
            state: data.now_playing.three_line.line3.substring(0, 128),
            // startTimestamp,
            endTimestamp,
            instance: false,
            largeImageKey: 'roon_labs_logo',
            largeImageText: `Listening at: ${data.display_name}`,
        };
        Discord.Self().setActivity(activity);

        if(Settings.imgurEnable) {
            /* const imgurAlbum = await Imgur.GetAlbumArt(data.now_playing.image_key, GetImage(new RoonApiImage(core)));
            albumArt = imgurAlbum; */
            Imgur.GetAlbumArt(data.now_playing.image_key, GetImage(new RoonApiImage(core))).then((art) => {
                activity.largeImageKey = art;
                Discord.Self().setActivity(activity);
            }).catch(() => {});
        }

        // Make sure that Imgur is prioritized even when both are enabled.
        if(
            Settings.discogsEnable
            && !Settings.imgurEnable
        ) {
            Discogs.Search(data.now_playing.three_line.line2, data.now_playing.three_line.line1).then((result) => {
                if(result.cover_image) activity.largeImageKey = result.cover_image;
                Discord.Self().setActivity(activity);
            }).catch(() => {});
        }
    }
}

/**
 * Get buffer of image from Roon's API.
 * @function GetImage
 * @param {RoonApiImage} api Instance of RoonApiImage (node-roon-api-image)
 * @return {GetBuffer}
 */
function GetImage(api) {
    /**
     * Inner function for GetImage. Uses the RoonAPIImage instance to get the file buffer of the album image.
     * @function
     * @param {string} image_key Key of the album image.
     * @return {Promise<Buffer|string>} File buffer of the album image.
     */
    const GetBuffer = function(image_key) {
        return new Promise((resolve, reject) => {
            api.get_image(image_key, (error, content_type, image) => {
                if(error) reject(error);
    
                resolve(Buffer.from(image));
            });
        });
    }

    return GetBuffer;
}

if(require.main === module) {
    Initiate();
}

module.exports = {
    Initiate,
    InitiateIntegrations,
}