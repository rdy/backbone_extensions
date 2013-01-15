(function(_, Backbone) {
  'use strict';
  function Decorator(models, options) {
    this._decoratee = models instanceof Backbone.Collection ? models.models : models;
    this.initialize.call(this, models, options);
  }

  function wrapDecorator(fnName) {
    return function() {
      var Klass = this.constructor, args = arguments;
      if (_(this._decoratee).isArray()) {
        return _(this._decoratee).map(function(model) {
          return (Klass.fn[fnName]).apply(model, args);
        });
      } else {
        return (Klass.fn[fnName]).apply(this._decoratee, args);
      }
    };
  }

  _(Decorator).extend({
    extend: function(protoProps, classProps) {
      var proto = _(protoProps)
          .chain()
          .omit('collection', 'constructor', 'initialize', 'model'),
          wrapped = proto.reduce(function(proto, fn, name) {
            return (proto[name] = wrapDecorator(name)) && proto;
          }, {}).value();
      this.fn = proto.value();
      return _(Backbone.Model.extend.call(this, _(protoProps).extend(wrapped), classProps)).tap(function(Klass) {
        _(['model', 'collection']).each(function(type) {
          if (protoProps[type]) {
            protoProps[type].prototype.decorator = function() {
              return new Klass(this);
            };
          }
        });
      });
    }
  }, Backbone.extensions && Backbone.extensions.include || {});

  _(Decorator.prototype).extend({
    initialize: function(models, options) {}
  });

  Backbone.extensions = _(Backbone.extensions || {}).extend({Decorator: Decorator});
}).call(this, _, Backbone);
