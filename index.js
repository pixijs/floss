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

module.exports = {
    run: function(options, done) {

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
};