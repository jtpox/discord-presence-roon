/** @module settings */
const RoonApiSettings = require('node-roon-api-settings');

/**
 * Default settings object.
 * @typedef {Object} TSettings
 * @property {string} discordClientId - Client ID to access the Discord RPC.
 * @property {string} roonZones - Zones to monitor. Separate by commas and ordered by priority.
 * @property {boolean} discogsEnable - Enable/Disable Discogs integration.
 * @property {string} discogsUserToken - User Token to access the Discogs API.
 * @property {boolean} imgurEnable - Enable/Disable Imgur integration.
 * @property {string} imgurClientId - Client ID to access the Imgur API.
 * @property {string} imgurClientSecret - Client Secret to access the Imgur API.
 * @property {string} imgurAlbumId - ID of the anonymous Imgur album.
 * @property {string} imgurAlbumDeleteHash - Delete Hash ot the anonymous Imgur album.
 */
/** @type {TSettings} */
const DefaultSettings = {
    discordClientId: '1149335969523318975',
    roonZones: 'Desktop,Living Room',

    discogsEnable: false,
    discogsUserToken: '',

    imgurEnable: false,
    imgurClientId: '',
    imgurClientSecret: '',
    imgurAlbumId: '',
    imgurAlbumDeleteHash: '',
};

let Roon;
let Settings;

/**
 * Constructor for Roon settings.
 * @function Initiate
 * @param {import('@roonlabs/node-roon-api').RoonApi} roon The Roon instance.
 */
function Initiate(roon) {
    Roon = roon;
    Settings = Roon.load_config('settings') || DefaultSettings;
}

/**
 * Sets up the settings service to be used by Roon.
 * @function Service
 * @param {Function} InitiateIntegrations The function to restart all integrations.
 * @returns {RoonApiSettings} The RoonApiSettings instance.
 */
function Service(InitiateIntegrations) {
    return new RoonApiSettings(Roon, {
        get_settings: (cb) => {
            cb(Layout());
        },
        save_settings: (req, isdryrun, settings) => {
            if(!isdryrun) {
                Settings = settings.values;
                Roon.save_config('settings', Settings);
                req.send_complete('Success', { settings: Layout() });
                InitiateIntegrations();
            }
        },
    });
}

/**
 * Create the settings form layout.
 * @function Layout
 * @returns {object} The object to create the settings form on Roon.
 */
function Layout() {
    let layout = {
        values: Settings,
        layout: [],
        has_error: false,
    };

    // Roon Grouping
    layout.layout.push({
        type: 'group',
        title: 'Roon Settings',
        items: [
            {
                type: 'string',
                title: 'Zones to Monitor (Separated by commas, order in priority)',
                setting: 'roonZones',
            }
        ],
    });

    // Discord Grouping
    layout.layout.push({
        type: 'group',
        title: 'Discord Settings',
        items: [
            {
                type: 'string',
                title: 'Client ID',
                setting: 'discordClientId',
            },
        ],
    });

    // Imgur Grouping
    layout.layout.push({
        type: 'group',
        title: 'Imgur Integration',
        items: [
            {
                type: 'dropdown',
                title: 'Enable',
                values: [
                    { title: 'No', value: false, },
                    { title: 'Yes', value: true, }
                ],
                setting: 'imgurEnable',
            },
            {
                type: 'string',
                title: 'Client ID',
                setting: 'imgurClientId',
            },
            {
                type: 'string',
                title: 'Client Secret',
                setting: 'imgurClientSecret',
            },
        ],
    });

    // Discogs Grouping
    layout.layout.push({
        type: 'group',
        title: 'Discogs Integration',
        items: [
            {
                type: 'dropdown',
                title: 'Enable',
                values: [
                    { title: 'No', value: false, },
                    { title: 'Yes', value: true, }
                ],
                setting: 'discogsEnable',
            },
            {
                type: 'string',
                title: 'User Token',
                setting: 'discogsUserToken',
            },
        ],
    });

    return layout;
}

module.exports = {
    DefaultSettings,
    Initiate,
    Service,
};