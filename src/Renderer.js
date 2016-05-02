import Mocha from 'mocha';
import chai from 'chai';
import path from 'path';
import fs from 'fs';

require('mocha/mocha');
require('chai/chai');

global.chai = chai;
global.should = chai.should;
global.assert = chai.assert;
global.expect = chai.expect;

export default class Renderer {
    
    constructor(linkId) {
        const ipc = require('ipc');
        ipc.on('ping', (data) => {
            const response = JSON.parse(data);
            global.options = response;
            if (response.debug) {
                this.headful(response.path);
            } else {
                this.headless(response.path);
            }
        });

        // Add the stylesheet
        const mochaPath = path.dirname(require.resolve('mocha'));
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
        const ipc = require('ipc');
        try {
            mochaInst.run(function(errorCount) {
                if (errorCount > 0) {
                    ipc.send('mocha-error', 'ping');
                } else {
                    ipc.send('mocha-done', 'ping');
                }
            });
        } catch (e) {
            ipc.send('mocha-error', 'ping');
        }
    }

    redirectOutputToConsole() {

        const remote = require('remote');
        const remoteConsole = remote.require('console');

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