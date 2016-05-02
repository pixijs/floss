# Jibo Test

Uses Electron to provide a Mocha unit-testing environment which can be run headlessly or to debugged in a brwoser. 

## Gulp Implementation

```js
var jibotest = require('jibo-test');
gulp.task('test', function(done) {
    jibotest.run('test/index.js', done);    
});
```

### Debug Mode

Open tests in an Electron window where test can can be debuged with `debugger` and dev tools.

```js
gulp.task('test', function(done) {
    jibotest.run({
        path: 'test/index.js',
        debug: true
    }, done);
});
```

### Additional Options

Additional properties can be passed to the test code by adding more values to the run options.

```js
gulp.task('test', function(done) {
    jibotest.run({
        path: 'test/index.js',
        customUrl: 'http://localhost:8080' // <- custom
    }, done);
});
```

The test code and use the global `options` property to have access to the run options.

```js
console.log(options.customUrl); // logs: http://localhost:8080
```