#!/usr/bin/env node
'use strict';

const commander = require('commander');
const floss = require('../');

require('colors');

function cli(args, callback) {
    const parsedArgs = parseArgs(args);
    // console.log(parsedArgs.coveragePattern);
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

/**
 * Split the value by comma or spaces
 */
function parseList(value) {
    if(typeof value === 'string') {
        return [value];
    }
    return value.split(/[\s,]\s*/);
}

function parseArgs(args) {
    commander.option('-d, --debug', 'Launch electron in debug mode')
        .option('-p, --path [path/to/folder/or/file.js]', 'Either a path to a directory containing index.js or a path to a single test file')
        .option('-e, --electron [path/to/Electron]', 'Path to version of Electron to test on')
        .option('-s, --sourceMaps', 'Run the coverage report through sourcemap conversion')
        .option('-c, --coveragePattern <sources>', 'Glob paths for coverage support', parseList)
        .parse(args);
    return commander;
}

cli(process.argv, function(returnCode){
    process.exit(returnCode);
});
