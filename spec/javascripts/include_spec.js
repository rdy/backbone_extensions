describe('include', function() {
  var Klass;
  beforeEach(function() {
    Klass = function() { };
    _(Klass).extend(Backbone.include);
  });

  describe('#include', function() {
    it('should be a function', function() {
      expect(_(Klass.include).isFunction()).toBe(true);
    });

    it('should call the included method when supplied', function() {
      var includedSpy = jasmine.createSpy('included');
      var includedSpy2 = jasmine.createSpy('included');
      Klass.include({ included: includedSpy }, {included: includedSpy2});
      expect(includedSpy).toHaveBeenCalledWith(Klass);
      expect(includedSpy2).toHaveBeenCalledWith(Klass);
    });
  });
});
