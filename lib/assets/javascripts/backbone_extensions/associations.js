//= require backbone_extensions/include

(function (Backbone, $) {
  function capitalize(string) {
    return string.slice(0, 1).toUpperCase() + string.slice(1);
  }

  var mixin = function (namespace) {
    var Associations = function(object) {
      this._wrapped = object;
    };

    function buildAssociation(self, name, initializeOptions, associationOptions) {
      initializeOptions = initializeOptions || {};
      var association = initializeOptions[name];

      self[name] = {
        'function': function() {
          return association;
        },
        'object': function() {
          return function() { return association; };
        },
        'undefined': function () {
          if (associationOptions.create) {
            var Klass = initializeOptions.klass || namespace[capitalize(name)];
            var object = new Klass();
            return function() { return object; };
          }
          else if (associationOptions.walkCollection) {
            return function() {
              var parentAssociation = (self.collection || {})[name];
              return (parentAssociation || $.noop)();
            };
          }
          else {
            return $.noop;
          }
        }

      }[typeof association]();
    }

    function parseAssociation(self, name, initializeOptions, associationOptions) {
      initializeOptions = initializeOptions || {};
      if(!!initializeOptions.parse) {
        if(!_(initializeOptions.parse).isFunction()) {
          initializeOptions.parse = associationOptions.defaultParse;
        }

        var baseParse = self.parse;
        self.parse = function(response) {
          return baseParse.call(this, initializeOptions.parse.call(this, response));
        };
      }
    }

    _(Associations.prototype).extend({
      belongsTo: function (name, options) {
        buildAssociation(this._wrapped, name, options, {walkCollection: true});
        return this;
      },
      hasMany: function (name, options) {
        buildAssociation(this._wrapped, name, options, {create: true});
        parseAssociation(this._wrapped, name, options, {
          defaultParse: function(response) {
            if(response && response[name] && this[name]()) {
              this[name]().reset(response[name]);
            }
            return _(response).omit(name);
          }
        });
        return this;
      },
      hasOne: function (name, options) {
        buildAssociation(this._wrapped, name, options, {create: true});
        parseAssociation(this._wrapped, name, options, {
          defaultParse: function(response) {
            if(response && response[name] && this[name]()) {
              this[name]().clear({silent: true});
              this[name]().set(response[name], {silent: true});
              this[name]().change();
            }
            return _(response).omit(name);
          }
        });
        return this;
      },
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
