const { expect } = require('chai');

describe('test/args', function () {
    it('should support arguments pass to electron', function(){
        expect(process.argv).includes('--autoplay-policy=no-user-gesture-required');
    });
});
