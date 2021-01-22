const { expect } = require('chai');

describe('test/failure', function () {
    it('should always fail', function(){
        expect(false).to.be.ok;
    });
});
