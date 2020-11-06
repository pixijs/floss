# Floss

Unit-testing for those hard to reach places.

[![Node.js CI](https://github.com/pixijs/floss/workflows/Node.js%20CI/badge.svg)](https://github.com/pixijs/floss/actions?query=workflow%3A%22Node.js+CI%22) [![npm version](https://badge.fury.io/js/floss.svg)](https://badge.fury.io/js/floss)

Uses Electron to provide a Mocha unit-testing environment which can be run headlessly or to debugged with DevTools. This was largely inspired by the [electron-mocha](https://github.com/jprichardson/electron-mocha) and [mocha-electron](https://github.com/tscanlin/mochatron) projects but didn't quite have the debugging features needed to develop tests.

## Installation

Install globally:

```bash
npm install -g floss electron
```

Install locally within a project:

```bash
npm install floss electron --save-dev
```

## Gulp Usage

```js
const floss = require('floss');
gulp.task('test', function(done) {
    floss('test/index.js', done);
});
```

### Debug Mode

Open tests in an Electron window where test can can be debugged with `debugger` and dev tools.

```js
floss({
    path: 'test/index.js',
    debug: true
}, done);
```

### Mocha Reporter

The `reporter` and `reporterOptions` are pass-through options for Mocha to specify a different reporter when running Floss in non-debug mode.

```js
floss({
    path: 'test/index.js',
    reporter: 'xunit',
    reporterOptions: {
    	filename: 'report.xml'
    }
}, done);
```

### Custom Options

Additional properties can be passed to the test code by adding more values to the run options.

```js
floss({
    path: 'test/index.js',
    customUrl: 'http://localhost:8080' // <- custom
}, done);
```

The test code and use the global `options` property to have access to the run options.

```js
console.log(options.customUrl); // logs: http://localhost:8080
```

### Electron Arguments

Commandline arguments can be passed to Electron directly by using `args`. In the example below, you may wan to disable Electron's user-gesture policy if you are testing HTML video or audio playback.

```js
floss({
    path: 'test/index.js',
    args: ['--autoplay-policy=no-user-gesture-required']
}, done);
```

## Command Line Usage

### Arguments

* **--path** or **-p** (String) Path to the file to test
* **--debug** or **-d**  (Boolean) Enable to run in headful mode, default `false`.
* **--quiet** or **-q** (Boolean) Prevent console[log/info/error/warn/dir] messages from appearing in `stdout`.
* **--electron** or **-e**  (String) Path to the electron to use.
* **--reporter** or **-R**  (String) Mocha reporter type, default `spec`.
* **--reporterOptions** or **-O**  (String) Mocha reporter options.
* **-- [args]** Additional arguments can be passed to Electron after `--`

### Usage

Command Line usage when installed globally:

```bash
floss --path test/index.js
```

Or installed locally:

```bash
node node_modules/.bin/floss --path test/index.js
```

Alernatively, within the **package.json**'s' scripts:

```json
{
    "scripts": {
        "test": "floss --path test/index.js"
    }
}
```

### Debug Mode

Open tests in an Electron window where test can can be debugged with `debugger` and dev tools.

```bash
floss --path test/index.js --debug
```

### Istanbul Code Coverage

Floss supports `nyc`. To use it, just use floss as you would mocha:

```bash
nyc floss --path test/index.js
```

### Mocha Reporter

Can use the same reporter options as the API mentioned above. The `reporterOptions` are expressed as a querystring, for instance `varname=foo&another=bar`.

```bash
floss --path test/index.js \
    --reporter=xunit \
    --reporterOptions output=report.xml
```

### Electron Arguments

Supports passing additional arguments to Electron after `--`.

```bash
floss --path test/index.js -- --autoplay-policy=no-user-gesture-required
```

## Custom Electron Version

Some application may require a specific version of Electron. Floss uses Electron 1.0.0+, but you can specific the path to your own version. The custom version can be used either through the commandline argument `--electron`, by setting the Node environmental variable `ELECTRON_PATH` or by setting the run option `electron`.

```js
gulp.task('test', function(done) {
    floss({
        path: 'test/index.js',
        electron: require('electron')
    }, done);
});
```
```bash
floss --path test/index.js \
	--electron /usr/local/bin/electron
```

```bash
ELECTRON_PATH=/usr/local/bin/electron floss --path test/index.js
```

## GitHub Actions Integration

```yml
name: Node.js CI
on:
  push:
    branches: [ '**' ]
    tags: [ '**' ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v1
      with:
        node-version: '12'
    - run: npm install
    - uses: GabrielBB/xvfb-action@v1.0
      with:
        run: npm test
```

## Travis Integration

Floss can be used with [Travis CI](https://travis-ci.org/) to run Electron headlessly by utilizing Xvfb. Here's a sample of how to setup this project.

### .travis.yml

```yml
language: node_js

node_js:
    - "12"

addons:
  apt:
    sources:
      - ubuntu-toolchain-r-test

env:
  - CXX=g++-4.8

services:
    - xvfb

install:
    - npm install

script:
    - npm test
```
