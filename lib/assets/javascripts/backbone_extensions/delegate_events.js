(function(_, Backbone) {
  'use strict';
  function bindModelEvents(tuple) {
    var self = this, subject = tuple[0], eventNames = tuple[1], isJquery = !!_(subject).result('jquery'),
        modelEvents = self._modelCallbacks, context = tuple[2];
    modelEvents.push(tuple);
    _(subject && eventNames).each(function(callback, event) {
      _(event.split(' ')).each(function(e) {
        _([callback]).chain().flatten().each(function(c) {
          var fn = _(c).isFunction() ? c : self[c];
            if (isJquery) {
              if (context) {
                subject.on(e, context, fn);
              } else {
                subject.on(e, fn);
              }
            } else {
              subject.on(e, fn, context);
            }
        });
      });
    });
  }

  function unbindModelEvents() {
    var self = this, modelEvents = self._modelCallbacks;
    _(modelEvents).each(function(tuple) {
      var subject = tuple[0], events = tuple[1], context = tuple[2], isJquery = !!_(subject).result('jquery');
      _(subject && events).each(function(callback, event) {
        _(event.split(' ')).each(function(e) {
          _([callback]).chain().flatten().each(function(c) {
            var fn = _(c).isFunction() ? c : self[c];
            if (isJquery) {
              if (context) {
                subject.off(e, context, fn);
              } else {
                subject.off(e, fn);
              }
            } else {
              subject.off(e, fn);
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
      _(source.prototype).extend({
        initialize: _(source.prototype.initialize).wrap(function(oldInitialize, attrsOrModels, options) {
          this._modelCallbacks = [];
          oldInitialize.call(this, attrsOrModels, options);
        }),

        delegateEvents: _(source.prototype.delegateEvents).wrap(function(oldDelegateEvents) {
          var self = this, args = _(arguments).rest();

          if (!args.length) {
            return oldDelegateEvents.call(this);
          }
          wrapUndelegateEvents.call(this, function() {
            _(args).chain().toArray().compact().each(function(obj) {
              var arg = _(obj);
              if (arg.isArray()) {
                bindModelEvents.call(self, obj);
              } else {
                arg.each(function(callbacks, event) {
                  _([callbacks]).chain().flatten().each(function(callback) {
                    oldDelegateEvents.call(self, _({}).tap(function(obj) {
                      obj[event] = callback;
                    }));
                  });
                });
              }
            });
          });
        }),

        undelegateEvents: _(source.prototype.undelegateEvents).wrap(function(oldUndelegateEvents) {
          unbindModelEvents.call(this);
          return oldUndelegateEvents.call(this);
        }),

        remove: _(source.prototype.remove).wrap(function(oldRemove) {
          this.undelegateEvents();
          return oldRemove.call(this);
        })
      });
    }
  };

  Backbone.extensions = _(Backbone.extensions || {}).extend({delegateEvents: delegateEvents});
}).call(this, _, Backbone);
