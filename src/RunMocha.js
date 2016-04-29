'use strict';

let path = require('path');
let fs = require('fs');

require('./../node_modules/mocha/mocha.js');
require('./../node_modules/chai/chai.js');

let chai = require('chai');
global.should = chai.should;
global.assert = chai.assert;
global.expect = chai.expect;

class RunMocha {
  static runHeadful(message) {
    mocha.setup({
      ui:'bdd',
      enableTimeouts: false
    });

    // include the test directories / files passed in via parameters
    let argv = JSON.parse(message);

    if(argv.args) {
      let testPath = argv.args[0];

      if(fs.existsSync(testPath)) {
        // if a single directory, find the index.js file and include that
        if(fs.statSync(testPath).isDirectory()) {

          let indexFile = path.join(testPath, "index.js");
          console.log("checking for index file: ", indexFile);
          if(fs.existsSync(indexFile)) {
            require(indexFile);
          } else {
            console.error("no index.js file found in directory: " + testPath);
          }
        }
        // if it is a single file, only include that file
        else {
          require(testPath);
        }
      }
    }

    mocha.run();
  }

  static runHeadless(message) {
    let argv = JSON.parse(message);
    let file = argv.args[0];

    let Mocha = require('mocha');
    let mochaInst = new Mocha('bbd');
    mochaInst.files.push(path.resolve(file));
    mochaInst.run();
  }
}

module.exports = RunMocha;
