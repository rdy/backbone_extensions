//= require backbone_extensions/include

(function (Backbone, $) {
  function capitalize(string) {
    return string.slice(0, 1).toUpperCase() + string.slice(1);
  }

  var mixin = function (namespace) {
    var Associations = function(object) {
      this._wrapped = object;
    };

    function buildAssociation(instance, name, container, create) {
      container = container || {};
      if (create && !_(container[name]).isObject()) {
        container[name] = new namespace[capitalize(name)]();
      }
      instance[name] = _(container[name]).isFunction() ? container[name] : function () { return container[name]; };
    }

    _(Associations.prototype).extend({
      belongsTo: function (name, options) { buildAssociation(this._wrapped, name, options); },
      hasMany: function (name, options) { buildAssociation(this._wrapped, name, options, true); },
      hasOne: function (name, options) { buildAssociation(this._wrapped, name, options, true); }
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
