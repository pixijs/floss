# Jibo Test

Uses Electron to provide a Mocha unit-testing environment which can be run headlessly or to debugged in a brwoser. 

## Gulp Implementation

```js
gulp.task('test', function(done) {
    var jiboTest = require('jibo-test');
    jiboTest.run('test/index.js', true, done);
});
```