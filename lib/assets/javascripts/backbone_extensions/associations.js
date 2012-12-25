//= require underscore.extensions
(function(_, Backbone) {
  function mixin(namespace) {
    namespace = namespace || {};

    function mergeAssociationOptions() {
      return _(arguments).chain().toArray().reduce(function(result, options) {
        return _(result).extend(options);
      }, {}).omit('class', 'className', 'inverseOf').value();
    }

    function buildAssociation(associationType, associationName, options) {
      function through(association) {
        if (options.through) {
          var throughName = _.str.camelize(options.through);
          return (association && _(options.through).isString() &&
              association.add(this[throughName]().invoke(_(associationName).singularize()), mergeAssociationOptions({parse: true}, options, this.options))) ||
              (_(options.through).isFunction() && options.through.call(this) || this[throughName]())[associationName]();
        }
      }

      function throughCollection() {
        return (this.collection && this.collection[associationName] && this.collection[associationName]()) ||
            (this._options && this._options.collection && this._options.collection[associationName] && this._options.collection[associationName]());
      }

      function createAssociation() {
        var self = this, collectionName = _.str.classify(associationName),
            className = options.className && _.str.classify(options.className),
            newOptions = mergeAssociationOptions(options, this._options);

        if (options.inverseOf) {
          newOptions[_.str.camelize(options.inverseOf)] = function() { return self; };
        }

        return (options['class'] && new options['class'](null, newOptions)) ||
            (className && namespace[className] && new namespace[className](null, newOptions)) ||
            (namespace[collectionName] && new namespace[collectionName](null, newOptions));
      }

      var associations = {
        hasMany: function() { return _(createAssociation.call(this)).tap(_(function(association) { through.call(this, association); }).bind(this)); },
        hasOne: function() { return throughCollection.call(this) || through.call(this) || createAssociation.call(this); },
        belongsTo: function() { return throughCollection.call(this) || through.call(this); }
      };

      this.prototype[associationName] = function() {
        this._associations = this._associations || {};
        this._associations[associationName] = this._associations[associationName] ||
            (this._options && _(this._options).result(associationName)) || associations[associationType].call(this);
        return this._associations[associationName];
      };
    }

    function parseAssociation(associationName, options, callback) {
      if (callback && options.parse) {
        var parseFunc = _(options.parse).isFunction() && options.parse || function(response) {
              return (options.className && (response[_.str.camelize(options.className)] || response[_.str.underscored(options.className)])) ||
                  (response[associationName] || response[_.str.underscored(associationName)]);
            };

        this.prototype.parse = _(this.prototype.parse).wrap(function(oldParse) {
          return _(oldParse.apply(this, _(arguments).rest(1))).tap(_(function(response) {
            var association = this[associationName](), newOptions = mergeAssociationOptions({parse: true}, options, this.options);
            callback.call(this, response, newOptions, association, parseFunc);
          }).bind(this));
        });
      }
    }

    function wrapAssociation(associationType, callback) {
      return function(name, options) {
        options = options || {};
        var associationName = _.str.camelize(name);
        buildAssociation.call(this, associationType, associationName, options);
        parseAssociation.call(this, associationName, options, callback);
        return this;
      };
    }

    var associations = {
      belongsTo: wrapAssociation('belongsTo'),

      hasMany: wrapAssociation('hasMany', function(response, options, association, parseFunc) {
        association.add(parseFunc.call(this, response), options);
      }),

      hasOne: wrapAssociation('hasOne', function(response, options, association, parseFunc) {
        association.clear({silent: true}).set(parseFunc.call(this, response), options);
      })
    };

    return {
      included: function(source) {
        _(source).extend(associations, {
          associations: function() {
            _(arguments).chain().toArray().each(function(options) {
              _(associations).chain().keys().each(function(associationType) {
                if (options[associationType]) {
                  associations[associationType].call(source, options[associationType], _(options).omit(associationType));
                }
              });
            });
          },

          extend: _(source.extend).wrap(function(oldExtend, protoProps, classProps) {
            return _(oldExtend.apply(this, _(arguments).rest(1))).tap(function(Klass) {
              source.associations((protoProps || {}).associations);
            });
          })
        });

        source.prototype.initialize = _(source.prototype.initialize).wrap(function(oldInitialize, attrsOrModels, options) {
          this._options = _(options).clone();
          oldInitialize.call(this, attrsOrModels, options);
        });
      }
    };
  }

  Backbone.extensions = _(Backbone.extensions || {}).extend({associations: mixin});
})(_, Backbone);
