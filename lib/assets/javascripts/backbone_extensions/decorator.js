(function() {
  'use strict';
  var exports = this, _ = exports._, Backbone = exports.Backbone;
  function Decorator(models, options) {
    this._decoratee = models instanceof Backbone.Collection ? models.models : models;
    this.initialize.call(this, models, options);
  }

  function wrapDecorator(fnName) {
    return function() {
      var Klass = this.constructor, args = arguments;
      if (_.isArray(this._decoratee)) {
        return _.map(this._decoratee, function(model) {
          return (Klass.fn[fnName]).apply(model, args);
        });
      } else {
        return (Klass.fn[fnName]).apply(this._decoratee, args);
      }
    };
  }

  _.extend(Decorator, {
    extend: function(protoProps, classProps) {
      var proto = _.chain(protoProps).omit('collection', 'constructor', 'initialize', 'model'),
          wrapped = proto.reduce(function(proto, fn, name) {
            return (proto[name] = wrapDecorator(name)) && proto;
          }, {}).value();
      this.fn = proto.value();
      return _.tap(Backbone.Model.extend.call(this, _.extend(protoProps, wrapped), classProps), function(Klass) {
        _.each(['model', 'collection'], function(type) {
          if (protoProps[type]) {
            protoProps[type].prototype.decorator = function() {
              return new Klass(this);
            };
          }
        });
      });
    }
  }, Backbone.extensions && Backbone.extensions.include || {});

  _.extend(Decorator.prototype, {
    initialize: function(models, options) {}
  });

  Backbone.extensions = _.extend(Backbone.extensions || {}, {Decorator: Decorator});
}).call(this);
