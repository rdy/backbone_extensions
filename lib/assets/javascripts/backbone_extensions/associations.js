//= require underscore.string
(function(_, Backbone) {
  function mixin(namespace) {
    namespace = namespace || {};

    function through(associationName, options) {
      return options &&
          options.through &&
          (_(options.through).isFunction() ? options.through.call(this) : this[_.str.camelize(options.through)]())[associationName]();
    }

    function buildHasAssociation(associationType, Klass, associationName, options) {
      var collectionName = _.str.classify(associationName);

      Klass.prototype[associationName] = _(function() {
        var association =
            (options['class'] && (new options['class'](null, _({}).chain().extend(options).extend(this._options).omit('class', associationType).value()))) ||
            (namespace[collectionName] && new namespace[collectionName](null, this._options));

        return (this._options && this._options[associationName] && this._options[associationName]()) || association;
      }).memoize();
    }

    function parseAssociation(Klass, associationName, options, callback) {
      if (options.parse) {
        var parseFunc = _(options.parse).isFunction() ? options.parse : function(response) { return response[associationName];},
            oldParse = Klass.prototype.parse;

        Klass.prototype.parse = function(response) {
          var self = this;
          return _(oldParse.apply(self, arguments)).tap(function(response) {
            var association = self[associationName]();
            callback.call(self, response, association, parseFunc);
          });
        };
      }
    }

    var associations = {
      belongsTo: function(Klass, name, options) {
        var associationName = _.str.camelize(name);

        Klass.prototype[associationName] = function() {

          return (this._options && this._options[associationName] && this._options[associationName]()) ||
              (this.collection && this.collection[associationName] && this.collection[associationName]()) ||
              (this._options && this._options.collection && this._options.collection[associationName] && this._options.collection[associationName]()) ||
              (through.call(this, associationName, options));
        };

        return Klass;
      },

      hasMany: function(Klass, name, options) {
        var associationName = _.str.camelize(name);

        buildHasAssociation('hasMany', Klass, associationName, options);

        parseAssociation(Klass, associationName, options, function(response, association, parseFunc) {
          association.add(parseFunc.call(this, response), _({parse: true}).extend(this._options));
        });

        return Klass;
      },

      hasOne: function(Klass, name, options) {
        var associationName = _.str.camelize(name);

        buildHasAssociation('hasOne', Klass, associationName, options);

        parseAssociation(Klass, associationName, options, function(response, association, parseFunc) {
          association.clear({silent: true});
          association.set(parseFunc.call(this, response), _({parse: true}).extend(this._options));
          association.change();
        });

        return Klass;
      }
    };

    return {
      included: function(source) {
        var oldExtend = source.extend;
        _(source).extend({
          associations: function() {
            var Klass = this;
            _(arguments).chain().toArray().each(function(association) {
              _(['belongsTo', 'hasMany', 'hasOne']).each(function(associationType) {
                if (association[associationType]) {
                  associations[associationType](Klass, association[associationType], _(association).omit('associationType'));
                }
              });
            });
          },

          extend: function(protoProps, classProps) {
            var associations = (protoProps || {}).associations;
            return _(oldExtend.apply(this, arguments)).tap(function(Klass) {
              source.associations(associations);
            });
          }
        });

        var oldInitialize = source.prototype.initialize;
        source.prototype.initialize = function(attrs, options) {
          this._options = _(options).clone();
          oldInitialize.apply(this, arguments);
        };
      }
    };
  }

  Backbone.extensions = _(Backbone.extensions || {}).extend({associations: mixin});
})(_, Backbone);
