'use strict';

describe('Floss Tests', ()=>{
  describe("logging", function() {
    it('should not hang when logging objects with circular references in headless mode', function(){
      let foo = {        
        get bar() {
          return this.bar();
        },
      }

      console.log(foo);
      process.stdout.write(foo);
    });
  });
});
