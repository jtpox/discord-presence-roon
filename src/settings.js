const RoonApiSettings = require('node-roon-api-settings');

const DefaultSettings = {
    discordClientId: '',
    roonZones: '',

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

function Initiate(roon) {
    Roon = roon;
    Settings = Roon.load_config('settings') || DefaultSettings;
}

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