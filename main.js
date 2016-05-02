
module.exports = function(path, debug, onCompleteCallback) {
  require('./src/CommandLineEntry').run(path, debug, onCompleteCallback);  
}
