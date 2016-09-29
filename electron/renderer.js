'use strict';

const Mocha = require('mocha');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const path = require('path');
const fs = require('fs');
const resolve = require('resolve');
const {ipcRenderer, remote} = require('electron');
const querystring = require('querystring');

require('mocha/mocha');
require('chai/chai');

global.chai = chai;
global.sinon = sinon;
global.should = chai.should;
global.assert = chai.assert;
global.expect = chai.expect;
global.chai.use(sinonChai);

class Renderer {

    constructor(linkId) {

        ipcRenderer.on('ping', (ev, data) => {
            const response = JSON.parse(data);
            this.options = global.options = response;
            if (response.debug) {
                this.headful(response.path);
            } else {
                this.headless(response.path);
            }
        });

        // Add the stylesheet
        const mochaPath = path.dirname(resolve.sync('mocha', {basedir: __dirname}));
        const link = document.getElementById(linkId);
        link.href = path.join(mochaPath, 'mocha.css');
    }

    headful(testPath) {
        mocha.setup({
            ui: 'bdd',
            enableTimeouts: false
        });

        this.addFile(testPath, (pathToAdd) => {
            if (pathToAdd) {
                require(pathToAdd);
            }
        });
        mocha.run();
    }

    headless(testPath) {
        try {
            this.redirectOutputToConsole();
            mocha.setup({
                ui: 'tdd'
            });

            // Format the reporter options
            let reporterOptions;

            // Parse string as an object
            if (typeof this.options.reporterOptions === "string") {
                reporterOptions = querystring.parse(
                    this.options.reporterOptions
                );
            }

            const mochaInst = new Mocha({
                reporter: this.options.reporter,
                reporterOptions: reporterOptions
            });
            mochaInst.ui('tdd');
            mochaInst.useColors(true);
            this.addFile(testPath, (pathToAdd) => {
                if (pathToAdd) {
                    mochaInst.addFile(pathToAdd);
                }
            });
            mochaInst.run(function(errorCount) {
                try {
                    if (errorCount > 0) {
                        ipcRenderer.send('mocha-error', 'ping');
                    } else {
                        ipcRenderer.send('mocha-done', 'ping');
                    }
                } catch(e) {
                    console.log("[floss] caught inner exception:", e.message);
                    ipcRenderer.send('mocha-error', 'ping');
                }
            });
        } catch (e) {
            console.log("[floss] caught outer exception:", e.message);
            ipcRenderer.send('mocha-error', 'ping');
        }
    }

    redirectOutputToConsole() {

        const remoteConsole = remote.getGlobal('console');

        // we have to do this so that mocha output doesn't look like shit
        console.log = function() {
            remoteConsole.log.apply(remoteConsole, arguments)
        }

        console.dir = function() {
            remoteConsole.dir.apply(remoteConsole, arguments)
        }

        // if we don't do this, we get socket errors and our tests crash
        Object.defineProperty(process, 'stdout', {
            value: {
                write: function(str) {
                    remote.process.stdout.write(str);
                }
            }
        });
    }

    addFile(testPath, callback) {
        testPath = path.resolve(testPath);

        if (fs.existsSync(testPath)) {
            // if a single directory, find the index.js file and include that
            if (fs.statSync(testPath).isDirectory()) {

                let indexFile = path.join(testPath, "index.js");

                console.log("checking for index file: ", indexFile);
                if (fs.existsSync(indexFile)) {
                    callback(indexFile);
                } else {
                    console.error("no index.js file found in directory: " + testPath);
                    callback(null);
                }
            }
            // if it is a single file, only include that file
            else {
                callback(testPath);
            }
        }
    }
}

module.exports = Renderer;