(function(_, Backbone, $) {
  function bindModelEvents(modelEvents, tuple) {
    modelEvents.push(tuple);
    var subject = tuple[0], eventNames = tuple[1];

    _(subject && eventNames).each(function(callback, event) {
      _(event.split(' ')).each(function(e) {
        _([callback]).chain().flatten().each(function(c) {
          subject.on(e, c);
        });
      });
    });
  }

  function unbindModelEvents(modelEvents) {
    _(modelEvents).each(function(tuple) {
      var subject = tuple[0], events = tuple[1];

      _(subject && events).each(function(callback, event) {
        _(event.split(' ')).each(function(e) {
          _([callback]).chain().flatten().each(function(c) {
            subject.off(e, c);
          });
        });
      });
    });
  }

  function wrapUndelegateEvents(callback) {
    this.undelegateEvents = $.noop;
    callback();
    delete this.undelegateEvents;
  }

  var delegateEvents = {
    included: function(source) {
      var delegateDOMEvents = source.prototype.delegateEvents,
          undelegateDOMEvents = source.prototype.undelegateEvents,
          oldRemove = source.prototype.remove;

      _(source.prototype).extend({
        initialize: function() {
          this._modelEvents = [];
        },

        delegateEvents: function() {
          if (!arguments.length) {
            return delegateDOMEvents.call(this);
          }

          var self = this, args = arguments;
          wrapUndelegateEvents.call(this, function() {
            _(args).chain().toArray().compact().each(function(obj) {
              var arg = _(obj);
              if (arg.isArray()) {
                bindModelEvents(self._modelEvents, obj);
              } else {
                arg.each(function(callbacks, event) {
                  _([callbacks]).chain().flatten().each(function(callback) {
                    delegateDOMEvents.call(self, _({}).tap(function(obj) {
                      obj[event] = callback;
                    }));
                  });
                });
              }
            });
          });
        },

        undelegateEvents: function() {
          unbindModelEvents(this._modelEvents);
          return undelegateDOMEvents.call(this);
        },

        remove: function() {
          this.undelegateEvents();
          return oldRemove.call(this);
        }
      });
    }
  };

  Backbone.extensions = _(Backbone.extensions || {}).extend({delegateEvents: delegateEvents});
})(_, Backbone, jQuery);
