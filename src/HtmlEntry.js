'use strict';

let RunMocha = require('./src/RunMocha');

require('ipc').on('ping', function(message) {
  console.log("message: ", message);
  RunMocha.runHeadful(message);
});
