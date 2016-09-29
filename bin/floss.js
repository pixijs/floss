#!/usr/bin/env node
'use strict';

const commander = require('commander');
const floss = require('../');

require('colors');

function cli(args, callback) {
    const parsedArgs = parseArgs(args);
    if (!parsedArgs.path) {
        console.error("Error, no path specified.".red);
        parsedArgs.outputHelp();
        return;
    }
    floss(parsedArgs, function(err){
        if(callback) {
            if(err) {
                callback(1);
            } else {
                callback(0);
            }
        }
    });
}

function parseArgs(args) {
    commander.option('-d, --debug', 'Launch electron in debug mode')
        .option('-p, --path [path/to/folder/or/file.js]', 'Either a path to a directory containing index.js or a path to a single test file')
        .option('-e, --electron [path/to/Electron]', 'Path to version of Electron to test on')
        .option('-r, --reporter [spec]', 'Mocha reporter for headless mode only')
        .option('-o, --reporter-options [filename=report.xml]', 'Additional arguments for reporter options, query-string formatted')
        .parse(args);
    return commander;
}

cli(process.argv, function(returnCode){
    process.exit(returnCode);
});