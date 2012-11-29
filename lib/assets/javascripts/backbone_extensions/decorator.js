(function(_, Backbone) {
  function decorateModels(self, models) {
    var decoratee = models instanceof Backbone.Collection ? models.models : models,
        proto = _(self)
            .chain()
            .functions()
            .without('collection', 'constructor', 'initialize', 'model')
            .inject(function(result, method) { result[method] = self[method]; return result; }, {})
            .value();

    if (_(decoratee).isArray()) {
      _(proto).each(function(fn, name) {
        self[name] = function() {
          var args = arguments;
          return _(decoratee).map(function(model) {
            return fn.apply(model, args);
          });
        };
      });
    } else {
      _(proto).each(function(fn, name) {
        self[name] = function() {
          return fn.apply(decoratee, arguments);
        };
      });
    }
  }

  function Decorator(models, options) {
    decorateModels(this, models);
    this.initialize.apply(this, arguments);
  }

  _(Decorator).extend({
    extend: function(protoProps, classProps) {
      return _(Backbone.Model.extend.apply(this, arguments)).tap(function(Klass) {
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
    initialize: function() {}
  });

  Backbone.extensions = _(Backbone.extensions || {}).extend({Decorator: Decorator});
})(_, Backbone);
