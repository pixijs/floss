# Floss

Unit-testing for those hard to reach places.

Uses Electron to provide a Mocha unit-testing environment which can be run headlessly or to debugged with DevTools. This was largely inspired by the [electron-mocha](https://github.com/jprichardson/electron-mocha) and [mocha-electron](https://github.com/tscanlin/mochatron) projects but didn't quite have the debugging features needed to develop tests.

## Gulp Usage

```js
var floss = require('floss');
gulp.task('test', function(done) {
    floss.run('test/index.js', done);    
});
```

### Debug Mode

Open tests in an Electron window where test can can be debuged with `debugger` and dev tools.

```js
gulp.task('test', function(done) {
    floss.run({
        path: 'test/index.js',
        debug: true
    }, done);
});
```

### Additional Options

Additional properties can be passed to the test code by adding more values to the run options.

```js
gulp.task('test', function(done) {
    floss.run({
        path: 'test/index.js',
        customUrl: 'http://localhost:8080' // <- custom
    }, done);
});
```

The test code and use the global `options` property to have access to the run options.

```js
console.log(options.customUrl); // logs: http://localhost:8080
```

## Command Line Usage

Installed globally via `npm install -g floss`.

```bash
floss --path test/index.js
```

Or installed locally:

```bash
node node_modules/.bin/floss --path test/index.js
```

### Debug Mode

To enable debugging use the `--debug` argument:

```bash
floss --path test/index.js --debug
```

## Travis Integration

Floss can be used with [Travis CI](https://travis-ci.org/) to run Electron headlessly by utilizing Xvfb. Here's a sample of how to setup this project.

### package.json

Note that scripts `test` must be setup in your **package.json**;

```json
{
    "scripts": {
        "test": "gulp test"
    }
}
```

### .travis.yml

```yml
language: node_js
node_js:
    - "4"

install:
    - npm install xvfb-maybe
    - npm install

before_script:
  - export DISPLAY=':99.0'
  - Xvfb :99 -screen 0 1024x768x24 -extension RANDR &

script:
    - xvfb-maybe npm test
```
