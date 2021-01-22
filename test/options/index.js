const { expect } = require('chai');

describe('test/options', function () {
    it('should support global options object', function(){
        expect(!!global.options).to.be.ok;
        expect('debug' in global.options).to.be.ok;
        expect('quiet' in global.options).to.be.ok;
        expect('args' in global.options).to.be.ok;
        expect('electron' in global.options).to.be.ok;
        expect(global.options.args).includes('--foo=bar');
    });
});
