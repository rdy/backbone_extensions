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
        var camelized = _.str.camelize(key), underscored = _.str.underscored(key);
        if (response[camelized]) {
          return {key: camelized, response: response[camelized]};
        }
        else if (response[underscored]) {
          return {key: underscored, response: response[underscored]};
        }
        else {
          return {response: null};
        }
      }

      function through(response) {
        var t = parseResponseWith(_(options).result('through'), response).response,
            singularAssociationName = _.singularize && _(associationName).singularize(),
            p = options.parseName || singularAssociationName;
        return {response: t && p && _(t)[associationType === 'hasOne' ? 'result' : 'pluck'](p)};
      }

      if (options.parse) {
        var associations = {
          hasMany: function(assocResponse, association, newOptions) {
            association.add(assocResponse, newOptions);
          },
          hasOne: function(assocResponse, association, newOptions) {
            association.clear({silent: true}).set(assocResponse, newOptions);
          }
        };

        if (associations[associationType]) {
          var parseFunc = _(options.parse).isFunction() &&
                  function(response) { return {response: options.parse.call(this, response) }; } ||
                  function(response) {
                    return (options.through && through.call(this, response)) ||
                        (options.parseName && parseResponseWith(options.parseName, response)) ||
                        (options.className && parseResponseWith(options.className, response)) ||
                        parseResponseWith(associationName, response);
                  };

          if(!this._parsers) {
            var originalParse = this.prototype.parse,
                parsers = this._parsers = [];
            this.prototype.parse = function(response) {
              return _(originalParse.call(this, response)).tap(_(function(parsedResponse) {
                _(parsers)
                    .chain()
                    .map(function(parser) {
                      var result = parser.parseFn.call(this, parsedResponse);
                      parser.associationFn.call(this, result.response);
                      return result.key;
                    }, this)
                    .compact()
                    .each(function(key) {
                      delete parsedResponse[key];
                    });
              }).bind(this));
            };
          }

          this._parsers.push({
            parseFn: parseFunc,
            associationFn: function(assocResponse) {
              associations[associationType].call(this, assocResponse, this[associationName](), mergeAssociationOptions(options, this.options));
            }
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
