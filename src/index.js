#!/usr/bin/env node
/** @module main */
const { version, author, homepage } = require('../package.json');
const RoonApi = require('@roonlabs/node-roon-api');
const RoonApiTransport = require('node-roon-api-transport');
const RoonApiImage = require('node-roon-api-image');
const semver = require('semver');

const { DEFAULT_IMAGE, UPDATE_CHECK, UPDATE_CHECK_URL } = require('./common');
const RoonSettings = require('./settings');
const Discord = require('./discord');
const Discogs = require('./discogs');
const Imgur = require('./imgur');

const { Info, Debug, Warn, Error } = require('./console');

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

    CheckVersion();
    RoonSettings.Initiate(roon);
    InitiateIntegrations();

    roon.init_services({
        required_services: [RoonApiTransport, RoonApiImage],
        provided_services: [RoonSettings.Service(InitiateIntegrations)],
    });
    roon.start_discovery();

    setInterval(CheckVersion, UPDATE_CHECK);
}

/**
 * Initiate Discord, Discogs and Imgur integrations.
 * @function InitiateIntegrations
 */
function InitiateIntegrations() {
    Info('Extension: Reloading settings');
    Settings = roon.load_config('settings') || RoonSettings.DefaultSettings;

    Discord.Initiate(Settings);
    Discogs.Initiate(roon, Settings);
    Imgur.Initiate(roon, Settings);
}

/**
 * Check for latest version
 * @function CheckVersion
 */
async function CheckVersion() {
    const latest_package_json = await fetch(UPDATE_CHECK_URL);
    if(!latest_package_json.ok) return;

    const package = await latest_package_json.json();
    if(semver.gt(package.version, version)) Warn(`New discord-presence-roon update available! | Running version: ${version} | Latest version: ${package.version}`);
}

/**
 * Paired event callback for Roon.
 * @function Paired
 * @param {object} core The Roon core.
 */
function Paired(core) {
    let transport = core.services.RoonApiTransport;
    Info('Roon Paired');

    let zone_info = {
        zone_id: null,
        display_name: null,
        outputs: [],
        state: '',
        is_next_allowed: true,
        is_previous_allowed: true,
        is_pause_allowed: false,
        is_play_allowed: true,
        is_seek_allowed: true,
        queue_items_remaining: 0,
        queue_time_remaining: 0,
        seek_position: 0,
        settings: {},
        now_playing: {},
    };

    transport.subscribe_zones((cmd, data) => {
        if(!['Changed', 'Subscribed'].includes(cmd)) return;

        if(data.hasOwnProperty('zones_removed')) {
            Discord.Self().clearActivity();
            return;
        }

        if(
            data.hasOwnProperty('zones')
            || data.hasOwnProperty('zones_changed') 
            || data.hasOwnProperty('zones_added')
        ) {
            const zones_to_check = Settings.roonZones.split(',');
            const available_zones = data.zones || data.zones_changed || data.zones_added;
            const zones = available_zones.filter((zone_data) => zones_to_check.includes(zone_data.display_name));
            const priority_zone = zones.sort((a, b) => zones_to_check.indexOf(a.display_name) - zones_to_check.indexOf(b.display_name));

            if(priority_zone.length < 1) return;

            zone_info = { ...zone_info, ...priority_zone[0] };
        }

        if(data.hasOwnProperty('zones_seek_changed')) {
            const correct_zone = data.zones_seek_changed.find(el => el.zone_id === zone_info.zone_id);
            if(!correct_zone) return;

            zone_info.now_playing.seek_position = correct_zone.seek_position;
            zone_info = { ...zone_info, ...correct_zone };
        }

        if(Discord.Self() === undefined) return;

        SongChanged(core, zone_info);
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

let PreviousAlbumArt = {
    imageKey: DEFAULT_IMAGE,
    imageUrl: DEFAULT_IMAGE,
    uploading: false,
};
/**
 * Song changed event which will update the Discord user activity.
 * @function SongChanged
 * @async
 * @param {object} core The Roon core.
 * @param {object} data The data provided by Roon zones.
 */
async function SongChanged(core, data) {
    if(data.state === 'paused') Discord.Self().clearActivity();

    if(data.state === 'playing') {
        const {
            image_key,
            length,
            seek_position,
            one_line,
            three_line,
        } = data.now_playing;

        const endTimestamp = Math.round((new Date().getTime() / 1000) + length - seek_position);
        const state = (three_line.line3.substring(0, 128)
            + (three_line.line3.length === 1 ? ' ' : '')) || undefined;

        const activity = {
            // type: 2, // Doesn't work. (https://discord-api-types.dev/api/discord-api-types-v10/enum/ActivityType)
            details: one_line.line1.substring(0, 128),
            state,
            endTimestamp,
            instance: false,
            largeImageKey: (image_key === PreviousAlbumArt.imageKey)? PreviousAlbumArt.imageUrl : DEFAULT_IMAGE,
            largeImageText: `Listening at: ${data.display_name}`,
        };
        Discord.Self().setActivity(activity);

        if(
            image_key
            && image_key !== PreviousAlbumArt.imageKey
            && !PreviousAlbumArt.uploading
        ) {
            if(
                Settings.imgurEnable
            ) {
                PreviousAlbumArt.uploading = true;
                Imgur.GetAlbumArt(image_key, GetImage(new RoonApiImage(core))).then((art) => {
                    PreviousAlbumArt.imageKey = image_key;
                    PreviousAlbumArt.imageUrl = art;
                    PreviousAlbumArt.uploading = false;
                    activity.largeImageKey = art;
                    Discord.Self().setActivity(activity);
                }).catch(() => {});
            }

            if(
                Settings.discogsEnable
                && !Settings.imgurEnable
            ) {
                Discogs.Search(data.now_playing.three_line.line2, data.now_playing.three_line.line1).then((result) => {
                    if(result.cover_image) {
                        PreviousAlbumArt.imageKey = image_key;
                        PreviousAlbumArt.imageUrl = result.cover_image;
                        activity.largeImageKey = result.cover_image;
                        Discord.Self().setActivity(activity);
                    }
                }).catch(() => {});
            }
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