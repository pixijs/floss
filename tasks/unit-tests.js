module.exports = function(gulp, options, plugins) {
    gulp.task('unit-tests', function(done) {
        var floss = require('../lib/floss');
        floss.run('test/index.js', done);
    });  
};