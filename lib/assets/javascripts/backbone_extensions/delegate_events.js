(function(_, Backbone) {
  function bindModelEvents(tuple) {
    var self = this, subject = tuple[0], eventNames = tuple[1], modelEvents = self._modelEvents;
    modelEvents.push(tuple);

    _(subject && eventNames).each(function(callback, event) {
      _(event.split(' ')).each(function(e) {
        _([callback]).chain().flatten().each(function(c) {
          if (_(c).isFunction()) {
            subject.on(e, c, self);
          } else {
            subject.on(e, self[c], self);
          }
        });
      });
    });
  }

  function unbindModelEvents() {
    var self = this, modelEvents = self._modelEvents;
    _(modelEvents).each(function(tuple) {
      var subject = tuple[0], events = tuple[1];

      _(subject && events).each(function(callback, event) {
        _(event.split(' ')).each(function(e) {
          _([callback]).chain().flatten().each(function(c) {
            if (_(c).isFunction()) {
              subject.off(e, c);
            } else {
              subject.off(e, self[c]);
            }
          });
        });
      });
    });
  }

  function wrapUndelegateEvents(callback) {
    var oldUndelegateEvents = this.undelegateEvents;
    this.undelegateEvents();
    this.undelegateEvents = function() {};
    callback.call(this);
    this.undelegateEvents = oldUndelegateEvents;
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
                bindModelEvents.call(self, obj);
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
          unbindModelEvents.call(this);
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
})(_, Backbone);
