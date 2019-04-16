'use strict';
const expect = require('chai').expect;

// pull in a file from outside the test/ folder to make sure that
// nyc picks it up
require('../electron/testCoverage.js');

describe('babys first test', ()=>{
  it('should always be true - dummy test', function(){
    expect(true).to.be.ok;
  });

  it('should evaluate to true', ()=>{
    expect(false).to.not.be.ok;
  });
});
