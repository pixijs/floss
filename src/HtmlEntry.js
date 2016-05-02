'use strict';

let RenderProcess = require('../src/RenderProcess');
global.window = require('electron').BrowserWindow;

require('ipc').on('ping', function(messageString) {

  let messageObj = JSON.parse(messageString);
  if(messageObj.debug) {
    RenderProcess.runHeadful(messageObj.testPath);
  } else {
    RenderProcess.runHeadless(messageObj.testPath);
  }
});
