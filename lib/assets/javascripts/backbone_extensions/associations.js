//= require backbone_extensions/include
//= require underscore.string
(function(_, Backbone) {
  'use strict';
  function mixin(namespace) {
    namespace = namespace || {};

    function mergeAssociationOptions() {
      return _(arguments).chain().toArray().reduce(function(result, options) { return _(result).extend(options); }, {})
          .omit('class', 'className', 'inverseOf', 'parseName', 'through').value();
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
        var collectionName = _.str.classify(associationName), className = options.className && _.str.classify(options.className),
            newOptions = mergeAssociationOptions(options, this._options);

        if (options.inverseOf) {
          newOptions[_.str.camelize(options.inverseOf)] = _(function() { return this; }).bind(this);
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
      function parseResponseWith(key, response) {
        return response[_.str.camelize(key)] || response[_.str.underscored(key)];
      }

      function through(response) {
        var t = parseResponseWith(_(options).result('through'), response),
            singularAssociationName = _.singularize && _(associationName).singularize(),
            p = options.parseName || singularAssociationName;
        return t && p && _(t)[associationType === 'hasOne' ? 'result' : 'pluck'](p);
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

        if (associations[associationType]) {
          var parsers = this._parsers,
              parseFunc = _(options.parse).isFunction() && options.parse ||
              function(response) {
                return (options.through && through.call(this, response)) ||
                    (options.parseName && parseResponseWith(options.parseName, response)) ||
                    (options.className && parseResponseWith(options.className, response)) ||
                    parseResponseWith(associationName, response);
              };

          if(!parsers) {
            parsers = this._parsers = this._parsers || [this.prototype.parse];
            this.prototype.parse = function(response) {
              return _(parsers).reduce(function(response, parser) {
                return parser.call(this, response);
              }, response, this);
            };
          }

          parsers.push(function(response) {
            associations[associationType].call(this, response, this[associationName](), parseFunc, mergeAssociationOptions(options, this.options));
            return response;
          });
        }
      }
    }

    return {
      included: function(source) {
        var associations = _({
          belongsTo: {}, hasMany: {parse: true}, hasOne: {parse: true}
        }).reduce(function(associations, defaultOptions, associationType) {
          associations[associationType] = function(name, options) {
            var associationName = _.str.camelize(name);
            options = _({}).extend(defaultOptions, options);
            buildAssociation.call(this, associationType, associationName, options);
            parseAssociation.call(this, associationType, associationName, options);
            return this;
          };
          return associations;
        }, {});

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
            return _(oldExtend.call(this, protoProps, classProps)).tap(function() {
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
