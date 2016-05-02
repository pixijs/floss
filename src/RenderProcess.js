'use strict';

let path = require('path');
let fs = require('fs');

require('./../node_modules/mocha/mocha.js');
require('./../node_modules/chai/chai.js');

let chai = require('chai');
global.chai = chai;
global.should = chai.should;
global.assert = chai.assert;
global.expect = chai.expect;

class RenderProcess {
  static runHeadful(testPath) {
    mocha.setup({
      ui:'bdd',
      enableTimeouts: false
    });

    this.addFile(testPath, function(pathToAdd){
      if(pathToAdd) {
        require(pathToAdd);
      }
    });

    mocha.run();
  }

  static runHeadless(testPath) {
    this.redirectOutputToConsole();

    mocha.setup({
      ui:'tdd'
    });
    let Mocha = require('mocha');
    let mochaInst = new Mocha();
    mochaInst.ui('tdd');
    mochaInst.useColors(true);

    this.addFile(testPath, function(pathToAdd){
      if(pathToAdd) {
        mochaInst.addFile(pathToAdd);
      }
    });

    try {
      mochaInst.run(function(errorCount){
        if(errorCount > 0) {
          require('ipc').send('mocha-error', 'ping');
        } else {
          require('ipc').send('mocha-done', 'ping');
        }
      });
    } catch(e) {
      require('ipc').send('mocha-error', 'ping');
    }
  }

  static redirectOutputToConsole() {
    let remote = null;
    try {
      remote = require('electron').remote;
    } catch (e) {
      remote = require('remote');
    }
    let remoteConsole = remote.require('console');

    // we have to do this so that mocha output doesn't look like shit
    console.log = function () {
      remoteConsole.log.apply(remoteConsole, arguments)
    }

    console.dir = function () {
      remoteConsole.dir.apply(remoteConsole, arguments)
    }

    // if we don't do this, we get socket errors and our tests crash
    Object.defineProperty(process, 'stdout', {
      value: {
        write: function (msg) {
          remoteConsole.log.apply(remoteConsole, arguments)
        }
      }
    });
  }

  static addFile(testPath, callback) {
    testPath = path.resolve(testPath);

    if(fs.existsSync(testPath)) {
      // if a single directory, find the index.js file and include that
      if(fs.statSync(testPath).isDirectory()) {

        let indexFile = path.join(testPath, "index.js");

        console.log("checking for index file: ", indexFile);
        if(fs.existsSync(indexFile)) {
          callback(indexFile);
        } else {
          console.error("no index.js file found in directory: " + testPath);
          callback(null);
        }
      }
      // if it is a single file, only include that file
      else {
        callback(testPath);
      }
    }
  }
}

module.exports = RenderProcess;
