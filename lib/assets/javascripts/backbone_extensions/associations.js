//= require backbone_extensions/include
//= require underscore.string
(function() {
  'use strict';
  var exports = this, _ = exports._, Backbone = exports.Backbone;
  var fn = {};
  function mixin(namespace, globalOptions) {
    namespace = namespace || exports || {};
    globalOptions = globalOptions || {};
    _.extend(fn, {
      mergeOptions: function() {
        return _.chain(arguments).toArray().reduce(function(result, options) { return _.extend(result, options); }, {})
            .omit('class', 'className', 'inverseOf', 'parseName', 'through').value();
      },

      buildAssociation: function(namespace, associationType, associationName, options) {
        function through() {
          function association() {
            var t = (_.isFunction(options.through) && options.through.call(this)) || _.str.camelize(options.through);
            return this[t] && this[t]() && this[t]()[associationName] && this[t]()[associationName]();
          }
          return options.through && association.call(this);
        }

        function throughCollection() {
          return (this.collection && this.collection[associationName] && this.collection[associationName]()) ||
              (this._options && this._options.collection && this._options.collection[associationName] && this._options.collection[associationName]());
        }

        function createAssociation() {
          var self = this, collectionName = _.str.classify(associationName), className = options.className && _.str.classify(options.className),
              newOptions = fn.mergeOptions(globalOptions, options, this._options);

          if (options.inverseOf) {
            newOptions[_.str.camelize(options.inverseOf)] = function() { return self; };
          }

          return _.tap((options['class'] && new options['class'](null, newOptions)) ||
              (className && namespace[className] && new namespace[className](null, newOptions)) ||
              (namespace[collectionName] && new namespace[collectionName](null, newOptions)), function(association) {
            through.call(self, association);
          });
        }

        var associations = {
          hasMany: createAssociation,
          hasOne: function() { return throughCollection.call(this) || createAssociation.call(this); },
          belongsTo: function() { return throughCollection.call(this) || through.call(this); }
        };

        this.prototype[associationName] = function() {
          return (this._associations || (this._associations = {})) && this._associations[associationName] ||
              (this._associations[associationName] = (this._options && _.result(this._options, associationName)) || associations[associationType].call(this));
        };
      },

      parseAssociation: function(associationType, associationName, options) {
        function parseResponseWith(key, response) {
          var result;
          return _.any([_.str.camelize, _.str.underscored], function(fn) {
            var k = fn(key);
            return (result = response[k] && {key: k, response: response[k]});
          }) && result || {response: null};
        }

        function through(response) {
          var t = parseResponseWith(_.result(options, 'through'), response).response,
              singularAssociationName = _.singularize && _.singularize(associationName),
              p = options.parseName || singularAssociationName;
          return {response: t && p && _[associationType === 'hasOne' && 'result' || 'pluck'](t, p)};
        }

        if (options.parse) {
          if (!_.has(this, '_parsers')) {
            this._parsers = [];
          }

          var associations = {
            hasMany: function(assocResponse, association, newOptions) {
              association.add(assocResponse, newOptions);
            },
            hasOne: function(assocResponse, association, newOptions) {
              association.clear({silent: true}).set(assocResponse, newOptions);
            }
          };

          if (associations[associationType]) {
            var parsers = this._parsers;
            if (_.isEmpty(parsers)) {
              this.prototype.parse = _.wrap(this.prototype.parse, function(oldParse, response) {
                var self = this;
                return _.tap(oldParse.call(self, response), function(parsedResponse) {
                  _.chain(parsers)
                      .map(function(parser) {
                        return _.tap(parser.parseFn.call(self).call(self, parsedResponse), function(result) {
                          parser.associationFn.call(self, result.response);
                        }).key;
                      })
                      .each(function(key) {
                        return key && delete parsedResponse[key];
                      });
                });
              });
            }

            this._parsers.push({
              parseFn: function() {
                return _.isFunction(options.parse) &&
                    function(response) { return {response: options.parse.call(this, response) }; } ||
                    function(response) {
                      return (options.through && through.call(this, response)) ||
                          (options.parseName && parseResponseWith(options.parseName, response)) ||
                          (options.className && parseResponseWith(options.className, response)) ||
                          parseResponseWith(associationName, response);
                    };
              },
              associationFn: function(assocResponse) {
                return assocResponse &&
                    associations[associationType].call(this, assocResponse, this[associationName](), fn.mergeOptions(globalOptions, options, this._options));
              }
            });
          }
        }
      }
    });

    return {
      included: function(source) {
        var associations = _.reduce({
          belongsTo: {}, hasMany: {parse: true}, hasOne: {parse: true}
        }, function(associations, defaultOptions, associationType) {
              associations[associationType] = function(name, options) {
                var associationName = _.str.camelize(name);
                options = _.extend({}, defaultOptions, globalOptions, options);
                fn.buildAssociation.call(this, namespace, associationType, associationName, options);
                fn.parseAssociation.call(this, associationType, associationName, options);
                return this;
              };
              return associations;
            }, {});

        _.extend(source, associations, {
          associations: function() {
            var self = this;
            _.chain(arguments).toArray().compact().each(function(options) {
              _.chain(associations).keys().each(function(associationType) {
                if (options[associationType]) {
                  associations[associationType].call(self, options[associationType], _.omit(options, associationType));
                }
              });
            });
          },

          extend: _.wrap(source.extend, function(oldExtend, protoProps, classProps) {
            return _.tap(oldExtend.call(this, protoProps, classProps), function(Klass) {
              var args = (protoProps || {}).associations;
              if (args) {
                Klass.associations.apply(Klass, _.flatten([args]));
              }
            });
          })
        });

        source.prototype.initialize = _.wrap(source.prototype.initialize, function(oldInitialize, attrsOrModels, options) {
          this._options = this._options || _.clone(options);
          oldInitialize.call(this, attrsOrModels, options);
        });
      }
    };
  }
  mixin.fn = fn;

  Backbone.extensions = _.extend(Backbone.extensions || {}, {associations: mixin});
}).call(this);
