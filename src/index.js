import path from 'path';
import commander from 'commander';
import findRoot from 'find-root';
import {
    spawn
} from 'child_process';
import electronPath from 'electron-prebuilt';

import Renderer from './Renderer';
import Main from './Main';

class JiboTest {
    static cli(args) {
        const parsedArgs = this.parseArgs(args);
        if (!parsedArgs.path) {
            console.error("Error, no path specified");
            parsedArgs.outputHelp();
            return;
        }
        this.run(
            parsedArgs.path, 
            !!parsedArgs.debug,
            function(){}
        );
    }

    static run(testPath, debug, onCompleteCallback) {

        if (typeof debug === "function") {
            onCompleteCallback = debug;
            debug = false;
        }

        const root = findRoot(__dirname);
        const app = path.join(root, 'electron');
        const args = JSON.stringify({
            'testPath': testPath,
            'debug': debug
        });

        const childProcess = spawn(
            electronPath, [app, args], {
                stdio: 'inherit'
            }
        );
        childProcess.on('close', (code) => {
            // console.log('process exit code ' + code);
            onCompleteCallback(code);
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

module.exports = JiboTest;