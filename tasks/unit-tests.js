module.exports = function(gulp, options, plugins) {
    gulp.task('unit-tests', function(done) {
        var floss = require('../lib/floss');
        floss.run({
            path: 'test/index.js',
            debug: options.argv.debug
        }, done);
    });  
};