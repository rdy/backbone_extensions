(function(Backbone, $) {
  function Decorator(models, options) {
    this._decorateModels.apply(this, arguments);
    this.initialize.apply(this, arguments);
  }

  _(Decorator).extend({
    extend: function(protoProps, classProps) {
      var Klass = Backbone.Model.extend.apply(this, arguments);
      if (protoProps.model) {
        protoProps.model.prototype.decorator = function() {
          return new Klass(this);
        };
      }

      if (protoProps.collection) {
        protoProps.collection.prototype.decorator = function() {
          return new Klass(this);
        };
      }

      return Klass;
    }
  }, Backbone.include ? Backbone.include : {});

  _(Decorator.prototype).extend({
    _decorateModels: function(models, options) {
      var self = this,
          decoratee = models,
          proto = _(this)
              .chain()
              .functions()
              .inject(function(result, method) { result[method] = self[method]; return result; }, {})
              .omit('collection', 'constructor', 'initialize', 'model', '_decorateModels').value();
      if (models instanceof Backbone.Collection) {
        decoratee =  decoratee.models;
      }
      if (decoratee instanceof Array) {
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
    },
    initialize: $.noop
  });

  Backbone.Decorator = Decorator;
})(Backbone, jQuery);
