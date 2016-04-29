'use strict';

let path = require('path');
let commander = require('commander');

class CommandLineEntry {
  static launch(cmdLineArgs) {

    let parsedArgs = this.parseCommandLineArgs(cmdLineArgs);

    if(!parsedArgs.path) {
      console.log("Error, no path specified");
      parsedArgs.outputHelp();
      return;
    }

    let testPath = parsedArgs.path;

    if(parsedArgs.debug) {
      // if headful state, launch the electron project
      let spawn = require('child_process').spawn;
      let electronPath = require( 'electron-prebuilt' );

      let jiboTestPath = path.join(__dirname, "../");
      let electronProcess = spawn(electronPath, [jiboTestPath, testPath], { stdio: 'inherit' } );

      electronProcess.on('close', function (code) {
          console.log('process exit code ' + code);
      });
    } else {
      // if headless state, run via command line only
      let RunMocha = require('../src/RunMocha');

      let mochaArgs = {'args': [testPath]};
      let mochaArgsString = JSON.stringify(mochaArgs);
      RunMocha.runHeadless(mochaArgsString);
    }
  }

  static parseCommandLineArgs(cmdLineArgs) {
    commander.option('-d, --debug', 'Launch electron in debug mode')
      .option('-p, --path [path/to/folder/or/file.js]', 'Either a path to a directory containing index.js or a path to a single test file')
      .parse(cmdLineArgs);

    return commander;
  }
}

module.exports = CommandLineEntry;
