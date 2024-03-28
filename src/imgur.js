const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');
const { Readable } = require('stream');
const { Blob } = require('buffer');

const { Info, Error } = require('./console');
const { DEFAULT_IMAGE } = require('./common');

let Roon;
let ImgurClientId;

let Album = {
    id: null,
    deletehash: null,
};

const API_URL = 'https://api.imgur.com/3';
const HEADERS = {};

/**
 * Constructor for Imgur integration.
 * @function Initiate
 * @param {import('@roonlabs/node-roon-api').RoonApi} roon The Roon instance.
 * @param {import('./settings').TSettings} settings Extension settings object.
 */
function Initiate(roon, settings) {
    Roon = roon;
    ImgurClientId = settings.imgurClientId;
    HEADERS.Authorization = `Client-ID ${ImgurClientId}`

    Album.id = settings.imgurAlbumId;
    Album.deletehash = settings.imgurAlbumDeleteHash;
    Info(`Imgur: Using Album ${Album.id}`);
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
    const data = new FormData();
    data.append('image', new Blob([buffer]), image_key);
    data.append('type', 'image');
    data.append('title', image_key);
    data.append('description', image_key);

    try {
        const upload = await fetch(`${API_URL}/image`, {
            method: 'POST',
            headers: HEADERS,
            body: data,
        });

        if(!upload.ok) {
            Error(`Error uploading cover to Imgur with status: ${upload}`);
            return DEFAULT_IMAGE; 
        }

        const uploadResponse = await upload.json();
        const { deletehash: coverDeleteHash, link } = uploadResponse.data;

        const albumForm = new FormData();
        albumForm.append('deletehashes[]', coverDeleteHash);

        const albumUpdate = await fetch(`${API_URL}/album/${Album.deletehash}/add`, {
            method: 'POST',
            headers: HEADERS,
            body: albumForm,
        });

        if(!albumUpdate.ok) {
            Error(`Error adding cover to album.`);
        }
        const albumResponse = await albumUpdate.json();

        return link;
    } catch (err) {
        Error(`Error uploading cover to Imgur: ${err}`);
    }
}

/**
 * Get album art from anonymous Imgur album.
 * @function GetAlbumArt
 * @async
 * @param {string} image_key Key of the image in the Imgur album.
 * @param {function(image_key:string) => Promise<Buffer|string>} GetImageFn 
 * @returns {Promise<string>} URL of album art or default image tag from Discord assets.
 */
async function GetAlbumArt(image_key, GetImageFn) {
    return new Promise(async (resolve, reject) => {
        let album;
        try {
            album = await GetAlbum();
        } catch (err) {}

        try {
            const { images } = album.data;
            const art = images.find((image) => image.title == image_key);

            // Art doesn't exist, so upload it.
            let link = '';
            if(!art) {
                const imageBuffer = await GetImageFn(image_key);
                const upload = await UploadToAlbum(imageBuffer, image_key);
                link = upload;
            }

            if(art) link = art.link;

            PreviousImage = {
                key: image_key,
                url: link,
            };
            resolve(link);
        } catch (err) {
            Error(err);
            reject(DEFAULT_IMAGE);
        }
    });
}

/**
 * Create an anonymous Imgur album.
 * @function CreateAlbum
 * @async 
 */
async function CreateAlbum() {
    const formData = new FormData();
    formData.append('title', 'Album Covers for Roon Discord Integration');
    const albumFetch = await fetch(`${API_URL}/album`, {
        method: 'POST',
        headers: HEADERS,
        body: formData,
    });

    const { data } = await albumFetch.json();

    const settings = Roon.load_config('settings') || Settings.DefaultSettings;
    settings.imgurAlbumId = data.id;
    settings.imgurAlbumDeleteHash = data.deletehash;

    Album.id = data.id;
    Album.deletehash = data.deletehash;
    Roon.save_config('settings', settings);
    Info(`Imgur: Using Album ${Album.id}`);

    return data;
}

/**
 * Get imags from anonymous Imgur album.
 * @function GetAlbum
 * @async
 */
async function GetAlbum() {
    let output = {
        success: false,
        data: {},
    };

    const albumFetch = await fetch(`${API_URL}/album/${Album.id}/images`, {
        method: 'GET',
        headers: HEADERS,
    });
    if(!albumFetch.ok) {
        Album = await CreateAlbum();
        return GetAlbum();
    }

    const albumImages = await albumFetch.json();
    output.success = true;
    output.data = {
        images: albumImages.data,
    };
    return output;
}

/** @module imgur */
module.exports = {
    Initiate,
    UploadToAlbum,
    GetAlbumArt,
}