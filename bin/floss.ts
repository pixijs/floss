#!/usr/bin/env node

import commander = require('commander');
import chalk from 'chalk';
import floss = require('../');

function cli(args:string[], callback:(code:number)=>void) {
    const parsedArgs = parseArgs(args);
    // console.log(parsedArgs.coveragePattern);
    if (!parsedArgs.path) {
        console.error(chalk.red("Error, no path specified."));
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
function parseList(value:string) {
    return value.split(/[\s,]\s*/);
}

function parseArgs(args:string[]) {
    commander.option('-d, --debug', 'Launch electron in debug mode')
        .option('-p, --path [path/to/folder/or/file.js]', 'Either a path to a directory containing index.js or a path to a single test file')
        .option('-e, --electron [path/to/Electron]', 'Path to version of Electron to test on')
        .option('-c, --coveragePattern <sources>', 'Glob paths for coverage support', parseList)
        .option('-s, --coverageSourceMaps', 'Run the coverage report through sourcemap conversion')
        .option('-h, --coverageHtmlReporter', 'Also generate an html report')
        .option('-r, --reporter [spec]', 'Mocha reporter for headless mode only')
        .option('-o, --reporterOptions [filename=report.xml]', 'Additional arguments for reporter options, query-string formatted')
        .option('-q, --quiet', 'Prevent console.(log/info/error/warn) messages from appearing in STDOUT')
        .parse(args);
    return commander;
}

cli(process.argv, function(returnCode){
    process.exit(returnCode);
});
