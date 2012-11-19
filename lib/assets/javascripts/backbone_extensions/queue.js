(function(_, Backbone, $) {
  var MAX_TRIES = 100;

  function isDeferred(obj) {
    return _(obj).isObject() && _(['done', 'fail', 'always']).all(function(method) { return _(obj[method]).isFunction(); });
  }

  function Queue(queue) {
    this._queue = queue || [];
  }

  _(Queue).extend({extend: Backbone.Model.extend, MAX_TRIES: MAX_TRIES});

  _(Queue.prototype).extend({
    add: function(item) {
      var deferred = $.Deferred();
      if (!_(item).isFunction()) {
        throw 'Item must be a function!';
      }
      this._queue.push({item: item, result: deferred, attempts: 0});
      return deferred.promise();
    },

    flush: function() {
      _(this._queue).each(function(job) { job.result.reject(); });
      this._queue = [];
    },

    head: function() {
      return this._queue[0];
    },

    processHead: function() {
      var self = this, job = this.head();
      if (job) {
        var item = job.item, result = job.result;
        job.attempts++;
        var itemResult = item();
        if (!isDeferred(itemResult)) {
          result.resolve();
        } else {
          itemResult
            .done(function() {
              var args = _(arguments).toArray(), success = args.shift();
              self.shift();
              result[(success ? 'resolve' : 'reject') + 'With'](result, args);
            })
            .fail(function() {
              if (job.attempts >= MAX_TRIES) {
                self.shift();
                result.rejectWith(result, arguments);
              }
            })
            .progress(function(options) {
              result.notifyWith(result, _(options).extend({attempts: job.attempts}));
            })
            .always(function() { self.processHead(); });
        }
      }
    },

    shift: function() {
      return this._queue.shift();
    },

    size: function() {
      return this._queue.length;
    }
  });

  Backbone.extensions = _(Backbone.extensions || {}).extend({Queue: Queue});
})(_, Backbone, jQuery);
