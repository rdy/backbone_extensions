beforeEach(function() {
  this.addMatchers({
    toBeAPromise: function() {
      var actual = this.actual;
      return _(actual).isObject() && _(actual.done).isFunction() && _(actual.resolve).isUndefined();
    }
  });
});
