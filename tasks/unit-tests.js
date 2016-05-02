module.exports = function(gulp, options, plugins) {
    gulp.task('unit-tests', function(done) {
        var jibotest = require('../lib/jibo-test');
        jibotest.run('test/index.js', done);
    });  
};