import path from 'path';
import commander from 'commander';
import findRoot from 'find-root';
import assign from 'object-assign';
import {spawn} from 'child_process';
import Renderer from './Renderer';
import Main from './Main';

let electron;
try {
    electron = require('electron-prebuilt');
}
catch(err) {
    // silence is golden
}

require('colors');

class Floss {
    static cli(args, callback) {
        const parsedArgs = this.parseArgs(args);
        if (!parsedArgs.path) {
            console.error("Error, no path specified.".red);
            parsedArgs.outputHelp();
            return;
        }
        this.run(parsedArgs, function(err){
            if(callback) {
                if(err) {
                    callback(1);
                } else {
                    callback(0);
                }
            }
        });
    }

    static run(options, done) {

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

        const root = findRoot(__dirname);
        const app = path.join(root, 'electron');
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

    static parseArgs(args) {
        commander.option('-d, --debug', 'Launch electron in debug mode')
            .option('-p, --path [path/to/folder/or/file.js]', 'Either a path to a directory containing index.js or a path to a single test file')
            .option('-e, --electron [path/to/Electron]', 'Path to version of Electron to test on')
            .parse(args);
        return commander;
    }

    static get Main() {
        return Main;
    }

    static get Renderer() {
        return Renderer;
    }
}

module.exports = Floss;
