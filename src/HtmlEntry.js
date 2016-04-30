'use strict';

let RunMocha = require('./src/RunMocha');
global.window = require('electron').BrowserWindow;

require('ipc').on('ping', function(messageString) {

  let messageObj = JSON.parse(messageString);
  if(messageObj.debug) {
    RunMocha.runHeadful(messageObj.testPath);
  } else {
    RunMocha.runHeadless(messageObj.testPath);
  }
});
