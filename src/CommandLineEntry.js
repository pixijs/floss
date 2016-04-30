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
    let spawn = require('child_process').spawn;
    let electronPath = require( 'electron-prebuilt' );

    let jiboTestElectronProjectPath = path.join(__dirname, "../");
    let args = JSON.stringify({
      'testPath' : testPath,
      'debug': !!parsedArgs.debug
    });

    let electronProcess = spawn(electronPath, [jiboTestElectronProjectPath, args], { stdio: 'inherit' } );
    electronProcess.on('close', function (code) {
        console.log('process exit code ' + code);
    });
  }

  static parseCommandLineArgs(cmdLineArgs) {
    commander.option('-d, --debug', 'Launch electron in debug mode')
      .option('-p, --path [path/to/folder/or/file.js]', 'Either a path to a directory containing index.js or a path to a single test file')
      .parse(cmdLineArgs);

    return commander;
  }
}

module.exports = CommandLineEntry;
