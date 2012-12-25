(function(_) {
  if (_.str && _.str.exports) {
    _.mixin(_.str.exports());
  }

  function namespace(obj, ns) {
    return _(ns).inject(function(base, n) {
      var _baseN = _(base[n]);
      if (_baseN.isUndefined() || _baseN.isNull()) {
        base[n] = {};
      }
      return base[n];
    }, obj);
  }

  _.mixin({
    namespace: function(obj, ns) {
      if (arguments.length === 2) {
        if (_(ns).isArray()) {
          return namespace(obj, ns);
        } else {
          return namespace(obj, ns.split('.'));
        }
      } else {
        return namespace(obj, Array.prototype.slice.call(arguments, 1));
      }
    }
  });

  if (this.InflectionJS) {
    _.mixin({
      pluralize: function(obj, number, options) {
        if (!_(number).isNumber()) {
          options = number;
          number = 0;
        }
        options = options || {};
        if (number === 1) {
          options.skip = obj;
        }
        options.skip = options.skip || '';
        return InflectionJS.apply_rules(obj, InflectionJS.plural_rules, options.skip);
      },
      singularize: function(obj, options) {
        options = options || {};
        options.skip = options.skip || '';
        return InflectionJS.apply_rules(obj, InflectionJS.singular_rules, options.skip);
      }
    });
  }
})(_);
