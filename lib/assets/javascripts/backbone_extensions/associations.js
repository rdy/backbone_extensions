//= require underscore.string
(function(_, Backbone) {
  function mixin(namespace) {
    namespace = namespace || {};

    function buildAssociation(associationType, Klass, associationName, options) {
      function through() {
        return options.through &&
            (_(options.through).isFunction() ? options.through.call(this) : this[_.str.camelize(options.through)]())[associationName]();
      }

      function throughCollection() {
        return (this.collection && this.collection[associationName] && this.collection[associationName]()) ||
            (this._options && this._options.collection && this._options.collection[associationName] && this._options.collection[associationName]());
      }

      function createAssociation() {
        var collectionName = _.str.classify(associationName),
            newOptions = _({}).chain().extend(options).extend(this._options).omit('class', 'className', associationType).value(),
            className = options.className && _.str.classify(options.className);
        return (options['class'] && (new options['class'](null, newOptions))) ||
            (className && namespace[className] && new namespace[className](null, newOptions)) ||
            (namespace[collectionName] && new namespace[collectionName](null, newOptions));
      }

      var associations = {
        hasMany: createAssociation,
        hasOne: function() { return throughCollection.call(this) || through.call(this) || createAssociation.call(this); },
        belongsTo: function() { return throughCollection.call(this) || through.call(this); }
      };

      Klass.prototype[associationName] = _(function() {
        return (this._options && _(this._options).result(associationName)) || associations[associationType].call(this);
      }).memoize();
    }

    function parseAssociation(Klass, associationName, options, callback) {
      if (options.parse) {
        var parseFunc = _(options.parse).isFunction() ? options.parse : function(response) {
              return (options.className && (response[options.className] || response[_.str.underscored(options.className)])) ||
                  (response[associationName] || response[_.str.underscored(associationName)]);
            };

        Klass.prototype.parse = _(Klass.prototype.parse).wrap(function(oldParse) {
          var self = this;
          return _(oldParse.apply(self, _(arguments).rest(1))).tap(function(response) {
            var association = self[associationName]();
            callback.call(self, response, association, parseFunc);
          });
        });
      }
    }

    return {
      included: function(source) {
        _(source).extend({
          belongsTo: function(name, options) {
            var associationName = _.str.camelize(name);

            buildAssociation('belongsTo', this, associationName, options);

            return this;
          },

          hasMany: function(name, options) {
            var associationName = _.str.camelize(name);

            buildAssociation('hasMany', this, associationName, options);

            parseAssociation(this, associationName, options, function(response, association, parseFunc) {
              association.add(parseFunc.call(this, response), _({parse: true}).extend(this._options));
            });

            return this;
          },

          hasOne: function(name, options) {
            var associationName = _.str.camelize(name);

            buildAssociation('hasOne', this, associationName, options);

            parseAssociation(this, associationName, options, function(response, association, parseFunc) {
              association
                  .clear({silent: true})
                  .set(parseFunc.call(this, response), _({parse: true}).extend(this._options));
            });

            return this;
          },

          associations: function() {
            var Klass = this;
            _(arguments).chain().toArray().each(function(association) {
              _(['belongsTo', 'hasMany', 'hasOne']).each(function(associationType) {
                if (association[associationType]) {
                  Klass[associationType].call(Klass, association[associationType], _(association).omit('associationType'));
                }
              });
            });
          },

          extend: _(source.extend).wrap(function(oldExtend, protoProps, classProps) {
            var associations = (protoProps || {}).associations;
            return _(oldExtend.apply(this, _(arguments).rest(1))).tap(function(Klass) {
              source.associations(associations);
            });
          })
        });

        source.prototype.initialize = _(source.prototype.initialize).wrap(function(oldInitialize, attrsOrModels, options) {
          this._options = _(options).clone();
          oldInitialize.apply(this, _(arguments).rest(1));
        });
      }
    };
  }

  Backbone.extensions = _(Backbone.extensions || {}).extend({associations: mixin});
})(_, Backbone);
