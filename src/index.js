import path from 'path';
import commander from 'commander';
import findRoot from 'find-root';
import assign from 'object-assign';
import {
    spawn
} from 'child_process';
import electronPath from 'electron-prebuilt';

import Renderer from './Renderer';
import Main from './Main';

class Floss {
    static cli(args) {
        const parsedArgs = this.parseArgs(args);
        if (!parsedArgs.path) {
            console.error("Error, no path specified");
            parsedArgs.outputHelp();
            return;
        }
        this.run(parsedArgs, function(){});
    }

    static run(options, done) {

        if (typeof options === "string") {
            options = {
                path: options
            };
        }

        options = assign({
            debug: false
        }, options);

        const root = findRoot(__dirname);
        const app = path.join(root, 'electron');
        const args = JSON.stringify(options);

        const childProcess = spawn(
            electronPath, [app, args], {
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
