(function() {
  'use strict';
  var exports = this, _ = exports._, Backbone = exports.Backbone;
  var include = {
    include: function() {
      var self = this;
      _.chain(arguments).toArray().each(function(module) {
        if (module && module.included && _.isFunction(module.included)) {
          module.included(self);
        }
      });
      return this;
    }
  };

  Backbone.extensions = _.extend(Backbone.extensions || {}, {include: include});
}).call(this);
