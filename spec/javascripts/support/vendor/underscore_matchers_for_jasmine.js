(function() {
  function toBeA() {
    return {
      compare: function(actual, expected) {
        return {pass: actual instanceof expected};
      }
    };
  }

  function toHave() {
    return {
      compare: function(actual, expected) {
        return {
          pass: _.all(_.flatten([expected]), function(attr) {
            return _.has(actual, attr);
          })
        };
      }
    };
  }

  beforeEach(function() {
    jasmine.addMatchers({
      toHave: toHave,
      toHaveAny: toHave,
      toBeA: toBeA,
      toBeAn: toBeA,
      toBeAnInstanceOf: toBeA
    });
  });
})();
