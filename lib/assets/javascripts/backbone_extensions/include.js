(function(_, Backbone) {
  'use strict';
  var include = {
    include: function() {
      var self = this;
      _(arguments).chain().toArray().each(function(module) {
        if (module && module.included && _(module.included).isFunction()) {
          module.included(self);
        }
      });
      return this;
    }
  };

  Backbone.extensions = _(Backbone.extensions || {}).extend({include: include});
})(_, Backbone);
