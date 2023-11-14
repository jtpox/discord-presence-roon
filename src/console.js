const colors = require('colors');

/**
 * console.info with colors.
 * @function Info
 * @param {string} msg Message you want to log.
 */
function Info(msg) {
    console.info(` INFO: ${msg} `.bgWhite.black);
}

/**
 * console.debug with colors.
 * @function Debug
 * @param {string} msg Message you want to log.
 */
function Debug(msg) {
    console.debug(` DEBUG: ${msg} `.bgWhite.blue);
}

/**
 * console.warn with colors.
 * @function Warn
 * @param {string} msg Message you want to log.
 */
function Warn(msg) {
    console.warn(` WARN: ${msg} `.bgYellow.black);
}

/**
 * console.error with colors.
 * @function Error
 * @param {string} msg Message you want to log.
 */
function Error(msg) {
    console.error(` ERROR: ${msg} `.bgRed.white);
}

module.exports = {
    Info,
    Debug,
    Warn,
    Error,
};