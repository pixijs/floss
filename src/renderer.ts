import * as Mocha from 'mocha';
import * as pathNode from 'path';
import * as fs from 'fs';
import * as resolve from 'resolve';
import { ipcRenderer, remote } from 'electron';
import * as querystring from 'querystring';
import * as glob from 'glob';
import 'mocha/mocha';
import { FlossEvent } from './common';

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
    constructor(linkId: string)
    {
        ipcRenderer.on(FlossEvent.Start, (_ev: Event, data: string) =>
        {
            this.options = (global as any).options = JSON.parse(data);
            const {
                path,
                debug,
                quiet,
                require: additionalRequire,
            } = this.options;

            // Do this before to catch any errors outside mocha running
            // for instance errors on the page like test's requires
            this.setupConsoleOutput(quiet, !debug);

            if (additionalRequire)
            {
                // eslint-disable-next-line global-require
                require(additionalRequire);
            }

            const files = glob.sync(path);

            if (debug)
            {
                this.headful(files);
            }
            else
            {
                this.headless(files);
            }
        });

        // Add the stylesheet
        const mochaPath = pathNode.dirname(resolve.sync('mocha', { basedir: __dirname }));
        const link = document.getElementById(linkId) as HTMLLinkElement;

        link.href = pathNode.join(mochaPath, 'mocha.css');
    }

    /**
     * Run tests using devtools and Electron window.
     */
    private headful(files: string[])
    {
        mocha.setup({
            ui: 'bdd',
            enableTimeouts: false
        });

        files
            .map((file) => this.addFile(file))
            .filter((file) => file !== null)
            // eslint-disable-next-line global-require
            .forEach((file) => require(file as string));

        mocha.run(() =>
        {
            // write the coverage file if we need to, as NYC won't do so in our setup
            if (nycInst)
            {
                nycInst.writeCoverageFile();
            }
        });
    }

    private headless(files:string[])
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

            files.map((file) => this.addFile(file))
                .filter((file) => file !== null)
                .forEach((file) => mochaInst.addFile(file as string));

            mochaInst.run((errorCount) =>
            {
                // write the coverage file if we need to, as NYC won't do so in our setup
                if (nycInst)
                {
                    try
                    {
                        nycInst.writeCoverageFile();
                    }
                    catch (e)
                    {
                        this.failed('Unable to write coverage file.');

                        return;
                    }
                }

                if (errorCount > 0)
                {
                    // No error needed, Mocha will report this
                    this.failed();
                }
                else
                {
                    this.success();
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
            this.failed(e.message);
        }
    }

    /**
     * Report when we're done, this will close floss.
     */
    private success()
    {
        ipcRenderer.send(FlossEvent.Done);
    }

    /**
     * Report if we failed, this will close floss with non-zero errorCode.
     */
    private failed(message?: string)
    {
        ipcRenderer.send(FlossEvent.Error, message);
    }

    /**
     * Create new bindings for `console` functions
     * Use default console[name] and also send IPC
     * log so we can log to stdout
     */
    private setupConsoleOutput(isQuiet:boolean, isHeadless:boolean)
    {
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
                write: (str: string) => remote.process.stdout.write(str),
            }
        });
    }

    /**
     * Resolve test path into absolute path.
     * @param testPath - Path to test directory of file.
     */
    private addFile(testPath:string): string | null
    {
        testPath = pathNode.resolve(testPath);

        if (!fs.existsSync(testPath))
        {
            return null;
        }

        // if a single directory, find the index.js file and include that
        if (fs.statSync(testPath).isDirectory())
        {
            const indexFile = pathNode.join(testPath, 'index.js');
            const indexTs = pathNode.join(testPath, 'index.ts');

            if (fs.existsSync(indexFile))
            {
                return indexFile;
            }
            else if (fs.existsSync(indexTs))
            {
                return indexTs;
            }

            console.error(`No index.js file found in directory: ${testPath}`);

            return null;
        }
        // if it is a single file, only include that file

        return testPath;
    }
}

module.exports = Renderer;
