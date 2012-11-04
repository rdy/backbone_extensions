//= require backbone_extensions/include

(function (Backbone, $) {
  function capitalize(string) {
    return string.slice(0, 1).toUpperCase() + string.slice(1);
  }

  var associations = function (namespace) {
    function buildAssociations(instance, key, container, create) {
      container = container || {};
      if (create && !_(container[key]).isObject()) {
        container[key] = new namespace[capitalize(key)]();
      }
      instance[key] = _(container[key]).isFunction() ? container[key] : function () { return container[key]; };
    }

    return {
      included: function (source) {
        var initialize = source.prototype.initialize || $.noop;

        _(source.prototype).extend({
          initialize: function () {
            var associations = this.associations || $.noop;
            associations.apply(this, arguments);
            initialize.apply(this, arguments);
          },

          belongsTo: function (key, options) {
            buildAssociations(this, key, options);
          },

          hasMany: function (key, options) {
            buildAssociations(this, key, options, true);
          }
        });
      }
    };
  };

  Backbone.associations = associations;
})(Backbone, jQuery);
