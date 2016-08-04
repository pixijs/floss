import path from 'path';
import fs from 'fs';

export default class Main {

    constructor(htmlPath) {

        // The path to the html file
        this.htmlPath = htmlPath;

        // Keep a global reference of the window object, if you don't, the window will
        // be closed automatically when the JavaScript object is garbage collected.
        this.mainWindow = null;

        const app = require('electron').app; 

        // Get the configuration path 
        this.configPath = path.join(app.getPath('userData'), 'config.json');

        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        app.on('ready', this.createWindow.bind(this));

        // Quit when all windows are closed.
        app.on('window-all-closed', () => {
            app.quit();
        });

        app.on('activate', () => {
            // On OS X it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (this.mainWindow === null) {
                this.createWindow();
            }
        });
    }

    createWindow() {

        let args = JSON.parse(process.argv.slice(2)[0]);
        
        const BrowserWindow = require('electron').BrowserWindow;
        const ipc = require('electron').ipcMain;
        
        // Get the window bounds
        const options = this.restoreBounds();

        options.show = args.debug;

        // Create the browser window.
        this.mainWindow = new BrowserWindow(options);

        ipc.on('mocha-done', () => {
            process.exit(0);
        });

        ipc.on('mocha-error', () => {
            process.exit(1);
        });

        // and load the index.html of the app.
        this.mainWindow.loadURL('file://' + this.htmlPath);

        // Open the DevTools.
        this.mainWindow.webContents.openDevTools('bottom');

        this.mainWindow.webContents.on('did-finish-load', () => {
            this.mainWindow.webContents.send('ping', JSON.stringify(args));
        });

        // Update bounds
        this.mainWindow.on('close', () => {
            this.saveBounds();
        });

        // Emitted when the window is closed.
        this.mainWindow.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            this.mainWindow = null;
        });
    }

    /**
     * Restore the bounds of the window.
     */
    restoreBounds(){
        let data;
        try {
            data = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        }
        catch(e) {
            // do nothing
        }

        if (data && data.bounds) {
            return data.bounds;
        }
        else {
            return {
                width: 1024,
                height: 768
            };
        }
    }

    /**
     * Save the bounds of the window.
     */
    saveBounds(){
        fs.writeFileSync(this.configPath, JSON.stringify({
            bounds: this.mainWindow.getBounds()
        }));
    }
}