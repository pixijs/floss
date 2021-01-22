#!/usr/bin/env node

import * as commander from 'commander';
import * as chalk from 'chalk';
import { floss } from './';
import type { FlossOptions } from './';

/**
 * Parse the commandline arguments.
 */
const getProgram = () =>
    commander
        .requiredOption('-p, --path [path/to/folder/or/file.js]', 'Either a path to a directory containing index.js or a path to a single test file')
        .option('-d, --debug', 'Launch electron in debug mode')
        .option('-e, --electron [path/to/Electron]', 'Path to version of Electron to test on')
        .option('-R, --reporter [spec]', 'Mocha reporter for headless mode only')
        .option('-O, --reporterOptions [filename=report.xml]', 'Additional arguments for reporter options, query-string formatted')
        .option('-q, --quiet', 'Prevent console.(log/info/error/warn) messages from appearing in STDOUT')
        .parseAsync(process.argv);

/**
 * Main entry-point for the CLI
 */
async function main() {

    try {
        const program = await getProgram();
        const options = program.opts() as Partial<FlossOptions>;
    
        // Sanitize undefined properties
        for (const prop in options) {
            if (options[prop] === undefined) {
                delete options[prop];
            }
        }

        await floss(options);
        process.exit(0);
    }
    catch(err) {
        console.log(chalk.red(`[floss] error: ${err.message}`));
        process.exit(1);
    }
}

main();
