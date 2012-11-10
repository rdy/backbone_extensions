//= require backbone_extensions/include

(function (Backbone, $) {
  function capitalize(string) {
    return string.slice(0, 1).toUpperCase() + string.slice(1);
  }

  var mixin = function (namespace) {
    var Associations = function(object) {
      this._wrapped = object;
    };

    function buildAssociation(instance, name, initializeOptions, associationOptions) {
      initializeOptions = initializeOptions || {};
      var association = initializeOptions[name];

      instance[name] = {
        'function': function() {
          return association;
        },
        'object': function() {
          return function() { return association; };
        },
        'undefined': function () {
          if (associationOptions.create) {
            var object = new namespace[capitalize(name)]();
            return function() { return object; };
          }
          else if (associationOptions.walkCollection) {
            return function() {
              var parentAssociation = (instance.collection || {})[name];
              return (parentAssociation || $.noop)();
            };
          }
          else {
            return $.noop;
          }
        }

      }[typeof association]();
    }

    _(Associations.prototype).extend({
      belongsTo: function (name, options) { buildAssociation(this._wrapped, name, options, {walkCollection: true}); },
      hasMany: function (name, options) { buildAssociation(this._wrapped, name, options, {create: true}); },
      hasOne: function (name, options) { buildAssociation(this._wrapped, name, options, {create: true}); },
      value: function() { return this._wrapped; }
    });

    return {
      included: function (source) {
        var initialize = source.prototype.initialize || $.noop;

        _(source.prototype).extend({
          initialize: function () {
            var associations = this.associations || $.noop;
            associations.apply(new Associations(this), arguments);
            initialize.apply(this, arguments);
          }
        });
      }
    };
  };

  Backbone.associations = mixin;
})(Backbone, jQuery);
