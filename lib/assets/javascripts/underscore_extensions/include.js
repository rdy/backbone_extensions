(function(Backbone) {
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

  Backbone.include = include;
})(Backbone);
