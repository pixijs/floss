export default class Main {

    constructor(htmlPath) {

        // The path to the html file
        this.htmlPath = htmlPath;

        // Keep a global reference of the window object, if you don't, the window will
        // be closed automatically when the JavaScript object is garbage collected.
        this.mainWindow = null;

        const app = require('app');

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

        const BrowserWindow = require('browser-window');
        const ipc = require('ipc');

        // Create the browser window.
        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 600,
            show: args.debug
        });

        ipc.on('mocha-done', () => {
            process.exit(0);
        });

        ipc.on('mocha-error', () => {
            process.exit(1);
        });

        // and load the index.html of the app.
        this.mainWindow.loadUrl('file://' + this.htmlPath);

        // Open the DevTools.
        // mainWindow.webContents.openDevTools();

        this.mainWindow.webContents.on('did-finish-load', () => {
            this.mainWindow.webContents.send('ping', JSON.stringify(args));
        });

        // Emitted when the window is closed.
        this.mainWindow.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            this.mainWindow = null;
        });
    }
}