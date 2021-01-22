const { expect } = require('chai');

describe('test/typescript', function () {
    it('should parse test as typescript using ts-node', function(){
        const result: boolean = true;
        expect(result).to.be.ok;
    });
});
