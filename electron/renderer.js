'use strict';

const Mocha = require('mocha');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const path = require('path');
const fs = require('fs');
const resolve = require('resolve');
const {ipcRenderer, remote} = require('electron');
const Coverage = require('./coverage');
const querystring = require('querystring');

require('mocha/mocha');
require('chai/chai');

global.chai = chai;
global.sinon = sinon;
global.should = chai.should;
global.assert = chai.assert;
global.expect = chai.expect;
global.chai.use(sinonChai);

const globalLoggers = {};

class Renderer {

    constructor(linkId) {

        ipcRenderer.on('ping', (ev, data) => {
            this.options = global.options = JSON.parse(data);
            const {
                path,
                debug,
                quiet,
                coveragePattern,
                coverageSourceMaps,
                coverageHtmlReporter
            } = this.options;

            if (coveragePattern) {
                const findRoot = require('find-root');
                const root = findRoot(path.join(
                    process.cwd(),
                    path
                ));
                this.coverage = new Coverage(
                    root,
                    coveragePattern,
                    coverageSourceMaps,
                    coverageHtmlReporter,
                    debug
                );
            }

            // Do this before to catch any errors outside mocha running
            // for instance errors on the page like test's requires
            this.setupConsoleOutput(quiet, !debug);

            if (debug) {
                this.headful(path);
            } else {
                this.headless(path);
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
        mocha.run(() => {
            if (this.coverage) {
                this.coverage.report(() => {});
            }
        });
    }

    headless(testPath) {
        try {
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
            mochaInst.run((errorCount) => {
                try {
                    if (errorCount > 0) {
                        ipcRenderer.send('mocha-error', 'ping');
                    }
                    else if (this.coverage) {
                        this.coverage.report(() => {
                            ipcRenderer.send('mocha-done', 'ping');
                        });
                    }
                    else {
                        ipcRenderer.send('mocha-done', 'ping');
                    }
                } catch(e) {
                    console.log(`[floss]: ${e.stack || e.message || e}`);
                    ipcRenderer.send('mocha-error', 'ping');
                }
            });
        } catch (e) {
            console.log(`[floss]: ${e.stack || e.message || e}`);
            ipcRenderer.send('mocha-error', 'ping');
        }
    }

    setupConsoleOutput(isQuiet, isHeadless) {
        const remoteConsole = remote.getGlobal('console');

        if (isQuiet) {
            if (isHeadless) {
                console.log = function() {
                    remoteConsole.log.apply(remoteConsole, arguments)
                }

                console.dir = function() {
                    remoteConsole.dir.apply(remoteConsole, arguments)
                }
            }
        } else if (isHeadless){
            bindConsole();
        }

        // if we don't do this, we get socket errors and our tests crash
        Object.defineProperty(process, 'stdout', {
            value: {
                write: function(str) {
                    remote.process.stdout.write(str);
                }
            }
        });

        // Create new bindings for `console` functions
        // Use default console[name] and also send IPC
        // log so we can log to stdout
        function bindConsole() {
            for (const name in console) {
                if (typeof console[name] === 'function') {
                    globalLoggers[name] = console[name];
                    console[name] = function(...args) {
                        globalLoggers[name].apply(console, args);
                        ipcRenderer.send(name, args);
                    }
                }
            }
        }
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
