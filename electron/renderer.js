'use strict';

const Mocha = require('mocha');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const path = require('path');
const fs = require('fs');
const resolve = require('resolve');

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

        const ipc = require('electron').ipcRenderer;

        ipc.on('ping', (ev, data) => {
            const response = JSON.parse(data);
            global.options = response;
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

            let mochaInst = new Mocha();
            mochaInst.ui('tdd');
            mochaInst.useColors(true);

            this.addFile(testPath, (pathToAdd) => {
                if (pathToAdd) {
                    mochaInst.addFile(pathToAdd);
                }
            });
            mochaInst.run(function(errorCount) {
                try {
                    const ipc = require('electron').ipcRenderer;
                    if (errorCount > 0) {
                        ipc.send('mocha-error', 'ping');
                    } else {
                        ipc.send('mocha-done', 'ping');
                    }
                } catch(err) {
                    console.log("FLOSS - caught inner exception:", err);
                    const ipc = require('electron').ipcRenderer;
                    ipc.send('mocha-error', 'ping');
                }
            });
        } catch (e) {
            console.log("FLOSS - caught outer exception:", e);
            const ipc = require('electron').ipcRenderer;
            ipc.send('mocha-error', 'ping');
        }
    }

    redirectOutputToConsole() {

        const remote = require('electron').remote;
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
                write: function() {
                    remoteConsole.log.apply(remoteConsole, arguments)
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