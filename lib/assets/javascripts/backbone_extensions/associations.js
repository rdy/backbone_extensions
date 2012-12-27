//= require underscore.extensions
(function(_, Backbone) {
  function mixin(namespace) {
    namespace = namespace || {};

    function mergeAssociationOptions() {
      return _(arguments).chain().toArray().reduce(function(result, options) { return _(result).extend(options); }, {})
          .omit('class', 'className', 'inverseOf', 'parseKey', 'through').value();
    }

    function buildAssociation(associationType, associationName, options) {
      function through() {
        function association() {
          var t = (_(options.through).isFunction() && options.through.call(this)) || _.str.camelize(options.through);
          return this[t] && this[t]() && this[t]()[associationName] && this[t]()[associationName]();
        }
        return options.through && association.call(this);
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

        return _((options['class'] && new options['class'](null, newOptions)) ||
            (className && namespace[className] && new namespace[className](null, newOptions)) ||
            (namespace[collectionName] && new namespace[collectionName](null, newOptions))).tap(_(function(association) {
              through.call(this, association);
            }).bind(this));
      }

      var associations = {
        hasMany: createAssociation,
        hasOne: function() { return throughCollection.call(this) || createAssociation.call(this); },
        belongsTo: function() { return throughCollection.call(this) || through.call(this); }
      };

      this.prototype[associationName] = function() {
        return (this._associations || (this._associations = {})) && this._associations[associationName] ||
            (this._associations[associationName] = (this._options && _(this._options).result(associationName)) || associations[associationType].call(this));
      };
    }

    function parseAssociation(associationType, associationName, options) {
      function parseKey(key, response) {
        return response[_.str.camelize(key)] || response[_.str.underscored(key)];
      }

      function through(response) {
        if (options.through) {
          var t = parseKey(_(options).result('through'), response);
          return (t && (associationType === 'hasOne' && t[options.parseKey || _(associationName).singularize()] ||
              _(t).pluck(options.parseKey || _(associationName).singularize())));
        }
      }

      if (options.parse) {
        var associations = {
          hasMany: function(response, association, parseFunc, newOptions) {
            association.add(parseFunc.call(this, response), newOptions);
          },
          hasOne: function(response, association, parseFunc, newOptions) {
            association.clear({silent: true}).set(parseFunc.call(this, response), newOptions);
          }
        };

        var parseFunc = _(options.parse).isFunction() && options.parse ||
            function(response) {
              return through.call(this, response) ||
                  (options.parseKey && parseKey(options.parseKey, response)) ||
                  (options.className && parseKey(options.className, response)) ||
                  (response[associationName] || response[_.str.underscored(associationName)]);
            };

        this.prototype.parse = _(this.prototype.parse).wrap(function(oldParse, response) {
          return _(oldParse.call(this, response)).tap(_(function(response) {
            if (associations[associationType]) {
              var association = this[associationName](), newOptions = mergeAssociationOptions({parse: true}, options, this.options);
              associations[associationType].call(this, response, association, parseFunc, newOptions);
            }
          }).bind(this));
        });
      }
    }

    var associations = _(['belongsTo', 'hasMany', 'hasOne']).reduce(function(associations, associationType) {
      associations[associationType] = function(name, options) {
        options = options || {};
        var associationName = _.str.camelize(name);
        buildAssociation.call(this, associationType, associationName, options);
        parseAssociation.call(this, associationType, associationName, options);
        return this;
      };
      return associations;
    }, {});

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
            return _(oldExtend.call(this, protoProps, classProps)).tap(function(Klass) {
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
