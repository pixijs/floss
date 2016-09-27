'use strict';

const path = require('path');
const assign = require('object-assign');
const spawn = require('child_process').spawn;

let electron;
try {
    electron = require('electron-prebuilt');
}
catch(err) {
    // silence is golden
}

/**
 * API to launch the Floss application.
 * @module floss
 * @param {Object|String} options The options map or path.
 * @param {String} [options.path] Path to the JS file to run.
 * @param {Boolean} [options.debug] `true` opens in headful mode.
 * @param {String} [options.electron] Path to custom electron version. If undefined
 *        will use environment variable `ELECTRON_PATH` or electron-prebuilt
 *        installed alongside.
 * @param {Function} done Called when completed. Passes error if failed.
 */
function floss(options, done) {

    if (typeof options === "string") {
        options = {
            path: options
        };
    }

    options = assign({
        debug: false,
        electron: process.env.ELECTRON_PATH || electron
    }, options);

    if (!options.path) {
        console.error("Error: No path specified for Floss.".red);
        return done();
    }

    if (!options.electron) {
        console.error("Error: Unable to find Electron. Install 'electron-prebuilt' alongside Floss.".red);
        return done();
    }

    const app = path.join(__dirname, 'electron');
    const args = JSON.stringify(options);

    let isWindows = /^win/.test(process.platform);
    if(isWindows  && !path.extname(options.electron)) {
        // In the case where floss is running in windows with the cmdline option --electron electron
        // options.electron will just be "electron" at this point.
        // Due to limitations with how nodejs spawns windows processes we need to add .cmd to the end of the command
        // https://github.com/nodejs/node/issues/3675
        options.electron = options.electron + ".cmd";
    }

    const childProcess = spawn(
        options.electron, [app, args], {
            stdio: 'inherit'
        }
    );
    childProcess.on('close', (code) => {
        if (code !== 0) {
            return done(new Error('Mocha tests failed'));
        }
        done();
    });
}

// Backward compatibility
floss.run = floss;

module.exports = floss;
