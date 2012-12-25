(function(_, Backbone) {
  function Decorator(models, options) {
    this._decoratee = models instanceof Backbone.Collection ? models.models : models;
    this.initialize.call(this, models, options);
  }

  function wrapDecorator(fn) {
    return function() {
      var args = arguments;
      if (_(this._decoratee).isArray()) {
        return _(this._decoratee).map(function(model) {
          return fn.apply(model, args);
        });
      } else {
        return fn.apply(this._decoratee, args);
      }
    };
  }

  _(Decorator).extend({
    extend: function(protoProps, classProps) {
      var proto = _(protoProps).chain().omit('collection', 'constructor', 'initialize', 'model').reduce(function(proto, fn, name) {
        proto[name] = wrapDecorator(fn);
        return proto;
      }, {}).value();

      return _(Backbone.Model.extend.call(this, _(protoProps).extend(proto), classProps)).tap(function(Klass) {
        _(['model', 'collection']).each(function(type) {
          if (protoProps[type]) {
            protoProps[type].prototype.decorator = function() {
              return new Klass(this);
            };
          }
        });
      });
    }
  }, Backbone.extensions && Backbone.extensions.include ? Backbone.extensions.include : {});

  _(Decorator.prototype).extend({
    initialize: function(models, options) {}
  });

  Backbone.extensions = _(Backbone.extensions || {}).extend({Decorator: Decorator});
})(_, Backbone);
