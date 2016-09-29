const glob = require('glob');
const path = require('path');
const fs = require('fs');
const {Reporter, Instrumenter, Collector, hook} = require('istanbul');

//thanks to https://github.com/tropy/tropy/blob/master/test/support/coverage.js
class Coverage {

    constructor(root, pattern, sourceMaps) {
        this.root = root;
        this.sourceMaps = !!sourceMaps;
        this.pattern = pattern;
        this.instrumenter = new Instrumenter();
        this.transformer = this.instrumenter.instrumentSync.bind(this.instrumenter);
        this.cov = global.__coverage__ = {};
        this.matched = this.match();
        hook.hookRequire(this.matched, this.transformer, {});
    }

    match() {
        const map = {}
        const fn = function (file) {
            return map[file]
        }
        if(typeof this.pattern === 'string') {
            fn.files = glob.sync(this.pattern, { root: this.root, realpath: true });
        }
        else if(Array.isArray(this.pattern)){
            fn.files = [];
            this.pattern.forEach((pattern) => {
                const files = glob.sync(pattern, { root: this.root, realpath: true });
                fn.files = fn.files.concat(files);
            });
        }
        for (let file of fn.files) {
            map[file] = true
        }
        return fn
    }

    report(done) {
        for (let file of this.matched.files) {
            if (!this.cov[file]) {
                // Files that are not touched by code ran by the test runner is
                // manually instrumented, to illustrate the missing coverage.
                this.transformer(fs.readFileSync(file, 'utf-8'), file)

                // When instrumenting the code, istanbul will give each
                // FunctionDeclaration a value of 1 in coverState.s,
                // presumably to compensate for function hoisting.
                // We need to reset this, as the function was not hoisted,
                // as it was never loaded.
                for (let key of Object.keys(this.instrumenter.coverState.s)) {
                    this.instrumenter.coverState.s[key] = 0
                }

                this.cov[file] = this.instrumenter.coverState
            }
        }

        const collector = new Collector()
        collector.add(this.cov)

        const reporter = new Reporter()
        reporter.addAll(['text-summary', 'json']);
        reporter.write(collector, true, () => {
            if(this.sourceMaps) {
                var remapIstanbul = require('remap-istanbul');
                const coverageJson = path.join(this.root, 'coverage/coverage-final.json');
                remapIstanbul(coverageJson, {
                    'html': path.join(this.root, 'coverage'),
                    'json': path.join(this.root, 'coverage', 'coverage-final.json')
                }).then(() => {
                    done();
                });
            }
            else {
                done();
            }
        });
    }
}

module.exports = Coverage;
