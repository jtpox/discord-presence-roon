const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');
const { Readable } = require('stream');
const { ImgurClient } = require('imgur');

let Client;
let Roon;
let ImgurClientId;

let Album = {
    id: null,
    deletehash: null,
};

/**
 * Constructor for Imgur integration.
 * @function Initiate
 * @param {import('@roonlabs/node-roon-api').RoonApi} roon The Roon instance.
 * @param {import('./settings').TSettings} settings Extension settings object.
 */
function Initiate(roon, settings) {
    Roon = roon;
    Client = new ImgurClient({
        clientId: settings.imgurClientId,
        clientSecret: settings.imgurClientSecret,
    });
    ImgurClientId = settings.imgurClientId;

    Album.id = settings.imgurAlbumId;
    Album.deletehash = settings.imgurAlbumDeleteHash;
    console.log(`Imgur: Using Album ${Album.id}`);
}

/**
 * Upload an image to the anonymour Imgur album.
 * @function UploadToAlbum
 * @async
 * @param {Bufer} buffer Buffer of the image file.
 * @param {string} image_key The name of the image file.
 * @returns {string} URL of the image.
 */
async function UploadToAlbum(buffer, image_key) {
    const response = await Client.upload({
        image: Readable.from(buffer),
        title: image_key,
        description: image_key,
        album: Album.deletehash,
        type: 'stream',
    });

    return response.data.link;
}

/**
 * Get album art from anonymous Imgur album.
 * @function GetAlbumArt
 * @async
 * @param {string} image_key 
 * @param {*} GetImageFn 
 * @returns {string} URL of album art or default iamge tag from Discord assets.
 */
async function GetAlbumArt(image_key, GetImageFn) {
    let albumArt = 'roon_labs_logo';
    let album;
    try {
        album = await Client.getAlbum(Album.id);
        if(!album.success) {
            Album = await CreateAlbum();
            album = await Client.getAlbum(Album.id);
        }
    } catch (err) {}

    try {
        const { images } = album.data;
        const art = images.find((image) => image.title == image_key);

        // Art doesn't exist, so upload it.
        if(!art) {
            // console.log('No Art');
            const imageBuffer = await GetImageFn(image_key);
            const upload = await UploadToAlbum(imageBuffer, image_key);
            albumArt = upload;
        }

        if(art) return art.link;
    } catch (err) {
        console.log(err);
    }

    return albumArt;
}

/**
 * Create an anonymous Imgur album.
 * @function CreateAlbum
 * @async 
 */
async function CreateAlbum() {
    const formData = new FormData();
    formData.append('title', 'Album Covers for Roon Discord Integration');
    const albumFetch = await fetch('https://api.imgur.com/3/album', {
        method: 'POST',
        headers: {
            Authorization: `Client-ID ${ImgurClientId}`,
        },
        body: formData,
    });

    const albumDetails = await albumFetch.json();
    const { data } = albumDetails;

    const settings = Roon.load_config('settings') || Settings.DefaultSettings;
    settings.imgurAlbumId = data.id;
    settings.imgurAlbumDeleteHash = data.deletehash;

    Album.id = data.id;
    Album.deletehash = data.deletehash;
    Roon.save_config('settings', settings);

    return data;
}

/** @module imgur */
module.exports = {
    Initiate,
    UploadToAlbum,
    GetAlbumArt,
}