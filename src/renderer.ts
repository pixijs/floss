import * as Mocha from 'mocha';
import * as pathNode from 'path';
import * as fs from 'fs';
import * as resolve from 'resolve';
import { ipcRenderer, remote } from 'electron';
import * as querystring from 'querystring';
import 'mocha/mocha';

// enables the browser mocha support - the mocha global is properly set up
// require('mocha/mocha');

let nycInst:any;

if (process.env.NYC_CONFIG)
{
    // do what nyc does in nyc/bin/wrap.js
    try
    {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
        const NYC = require('nyc');
        let config:any = {};

        if (process.env.NYC_CONFIG) config = JSON.parse(process.env.NYC_CONFIG);
        config.isChildProcess = true;

        config._processInfo = {
            pid: process.pid,
            ppid: process.ppid,
            parent: process.env.NYC_PROCESS_ID || null,
            root: process.env.NYC_ROOT_ID
        };
        if (process.env.NYC_PROCESSINFO_EXTERNAL_ID)
        {
            config._processInfo.externalId = process.env.NYC_PROCESSINFO_EXTERNAL_ID;
            delete process.env.NYC_PROCESSINFO_EXTERNAL_ID;
        }

        nycInst = new NYC(config);
        nycInst.wrap();
    }
    catch (e)
    {
        console.log(e);
    }
}

const globalLoggers: Partial<Console> = {};

class Renderer
{
    options:any;
    constructor(linkId:string)
    {
        ipcRenderer.on('ping', (_ev:Event, data:string) =>
        {
            this.options = (global as any).options = JSON.parse(data);
            const {
                path,
                debug,
                quiet,
            } = this.options;

            // Do this before to catch any errors outside mocha running
            // for instance errors on the page like test's requires
            this.setupConsoleOutput(quiet, !debug);

            if (debug)
            {
                this.headful(path);
            }
            else
            {
                this.headless(path);
            }
        });

        // Add the stylesheet
        const mochaPath = pathNode.dirname(resolve.sync('mocha', { basedir: __dirname }));
        const link = document.getElementById(linkId) as HTMLLinkElement;

        link.href = pathNode.join(mochaPath, 'mocha.css');
    }

    headful(testPath:string)
    {
        mocha.setup({
            ui: 'bdd',
            enableTimeouts: false
        });

        this.addFile(testPath, (pathToAdd: string | null) =>
        {
            if (pathToAdd)
            {
                // eslint-disable-next-line global-require
                require(pathToAdd);
            }
        });
        mocha.run(() =>
        {
            // write the coverage file if we need to, as NYC won't do so in our setup
            if (nycInst)
            {
                nycInst.writeCoverageFile();
            }
        });
    }

    headless(testPath:string)
    {
        try
        {
            mocha.setup({
                ui: 'tdd'
            });

            // Format the reporter options
            let reporterOptions:any;

            // Parse string as an object
            if (typeof this.options.reporterOptions === 'string')
            {
                reporterOptions = querystring.parse(
                    this.options.reporterOptions
                );
            }

            const mochaInst = new Mocha({
                reporter: this.options.reporter,
                reporterOptions
            });

            mochaInst.ui('tdd');
            mochaInst.useColors(true);
            this.addFile(testPath, (pathToAdd: string | null) =>
            {
                if (pathToAdd)
                {
                    mochaInst.addFile(pathToAdd);
                }
            });
            mochaInst.run((errorCount) =>
            {
                try
                {
                    // write the coverage file if we need to, as NYC won't do so in our setup
                    if (nycInst)
                    {
                        nycInst.writeCoverageFile();
                    }
                    if (errorCount > 0)
                    {
                        ipcRenderer.send('mocha-error', 'ping');
                    }
                    else
                    {
                        ipcRenderer.send('mocha-done', 'ping');
                    }
                }
                catch (e)
                {
                    console.log(`[floss]: ${e.stack || e.message || e}`);
                    ipcRenderer.send('mocha-error', 'ping');
                }
            });
        }
        catch (e)
        {
            // write the coverage file if we need to, as NYC won't do so in our setup
            if (nycInst)
            {
                nycInst.writeCoverageFile();
            }
            console.log(`[floss]: ${e.stack || e.message || e}`);
            ipcRenderer.send('mocha-error', 'ping');
        }
    }

    setupConsoleOutput(isQuiet:boolean, isHeadless:boolean)
    {
        // Create new bindings for `console` functions
        // Use default console[name] and also send IPC
        // log so we can log to stdout
        const bindConsole = () =>
        {
            for (const name in console)
            {
                const n = name as keyof Console;

                if (typeof console[n] === 'function')
                {
                    globalLoggers[n] = console[n];
                    console[n] = (...args: any[]) =>
                    {
                        globalLoggers[n].apply(console, args);
                        ipcRenderer.send(name, args);
                    };
                }
            }
        };

        const remoteConsole = remote.getGlobal('console');

        if (isQuiet)
        {
            if (isHeadless)
            {
                console.log = (...args: any[]) => remoteConsole.log(...args);
                console.dir = (...args: any[]) => remoteConsole.dir(...args);
            }
        }
        else if (isHeadless)
        {
            bindConsole();
        }

        // if we don't do this, we get socket errors and our tests crash
        Object.defineProperty(process, 'stdout', {
            value: {
                write(str: string)
                {
                    remote.process.stdout.write(str);
                }
            }
        });
    }

    addFile(testPath:string, callback:(path: string | null)=>void)
    {
        testPath = pathNode.resolve(testPath);

        if (fs.existsSync(testPath))
        {
            // if a single directory, find the index.js file and include that
            if (fs.statSync(testPath).isDirectory())
            {
                const indexFile = pathNode.join(testPath, 'index.js');

                if (!fs.existsSync(indexFile))
                {
                    console.error(`No index.js file found in directory: ${testPath}`);
                    callback(null);
                }
                else
                {
                    callback(indexFile);
                }
            }
            // if it is a single file, only include that file
            else
            {
                callback(testPath);
            }
        }
    }
}

module.exports = Renderer;
