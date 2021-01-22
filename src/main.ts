import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { FlossEvent } from './common';
import * as chalk from 'chalk';

// Get the configuration path
const configPath = path.join(app.getPath('userData'), 'config.json');

/**
 * Restore the bounds of the window.
 */
const restoreBounds = (): Partial<Electron.Rectangle> =>
{
    try
    {
        return JSON.parse(readFileSync(configPath, 'utf8'));
    }
    catch (e)
    {
        return {
            width: 1024,
            height: 768
        };
    }
};

const createWindow = () =>
{
    const args = JSON.parse(process.argv.slice(2)[0]);

    // Get the window bounds
    const options = {
        ...restoreBounds(),
        show: args.debug,
        background: '#fff',
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
    };

    // Create handlers for piping rendered logs to console
    if (!args.debug && !args.quiet)
    {
        for (const name in console)
        {
            const n = name as keyof Console;

            ipcMain.on(n, (_event: any, args: any[]) => console[n](...args));
        }
    }

    // Create the browser window.
    const mainWindow = new BrowserWindow(options);

    ipcMain
        .on(FlossEvent.Done, () => process.exit(0))
        .on(FlossEvent.Error, (_event: any, message: string) => 
        {
            if (message)
            {
                console.error(chalk.red(`\n[floss] Error: ${message}\n`));
            }
            process.exit(1);
        });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    const { webContents } = mainWindow;

    // don't show the dev tools if you're not in headless mode. this is to
    // avoid having breakpoints and "pause on caught / uncaught exceptions" halting
    // the runtime.  plus, if you're in headless mode, having the devtools open is probably
    // not very useful anyway
    if (args.debug)
    {
        webContents.openDevTools({ mode: 'bottom' });
    }

    webContents.on('did-finish-load', () =>
    {
        webContents.send(FlossEvent.Start, JSON.stringify(args));
    });

    mainWindow.on('close', () =>
    {
        writeFileSync(configPath, JSON.stringify(mainWindow.getBounds()));
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit());
