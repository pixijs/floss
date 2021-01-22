import fs = require('fs');
import path = require('path');
import { app, BrowserWindow, ipcMain } from 'electron';

// Path to the html render
const htmlPath = path.join(__dirname, 'index.html');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null;

// Get the configuration path
const configPath = path.join(app.getPath('userData'), 'config.json');

/**
 * Restore the bounds of the window.
 */
const restoreBounds = ():{width:number, height:number} =>
{
    let data:any;

    try
    {
        data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    catch (e)
    {
        // do nothing
    }

    if (data && data.bounds)
    {
        return data.bounds;
    }

    return {
        width: 1024,
        height: 768
    };
};

/**
 * Save the bounds of the window.
 */
const saveBounds = () => fs.writeFileSync(configPath, JSON.stringify({
    bounds: mainWindow?.getBounds()
}));

const createWindow = () =>
{
    const args = JSON.parse(process.argv.slice(2)[0]);

    // Get the window bounds
    const options:Electron.BrowserWindowConstructorOptions = restoreBounds();

    options.show = args.debug;
    options.webPreferences = {
        nodeIntegration: true,
        enableRemoteModule: true,
    };

    // Create handlers for piping rendered logs to console
    if (!args.debug && !args.quiet)
    {
        for (const name in console)
        {
            const n = name as keyof Console;

            ipcMain.on(n, (_event:Event, args:any[]) => console[n](...args));
        }
    }

    // Create the browser window.
    mainWindow = new BrowserWindow(options);

    ipcMain
        .on('mocha-done', () => process.exit(0))
        .on('mocha-error', () => process.exit(1));

    // and load the index.html of the app.
    mainWindow.loadFile(htmlPath);

    // don't show the dev tools if you're not in headless mode. this is to
    // avoid having breakpoints and "pause on caught / uncaught exceptions" halting
    // the runtime.  plus, if you're in headless mode, having the devtools open is probably
    // not very useful anyway
    if (args.debug)
    {
        // Open the DevTools.
        mainWindow.webContents.openDevTools({ mode: 'bottom' });
    }

    mainWindow.webContents.on('did-finish-load', () =>
    {
        mainWindow?.webContents.send('ping', JSON.stringify(args));
    });

    // Update bounds
    mainWindow.on('close', saveBounds);

    // Emitted when the window is closed.
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow.on('closed', () =>
    {
        mainWindow = null;
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit());

app.on('activate', () =>
{
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null)
    {
        createWindow();
    }
});
