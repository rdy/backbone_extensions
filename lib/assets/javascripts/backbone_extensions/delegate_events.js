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
      _(source.prototype).extend({
        initialize: _(source.prototype.initialize).wrap(function(oldInitialize, attrsOrModels, options) {
          this._modelEvents = [];
          oldInitialize.call(this, attrsOrModels, options);
        }),

        delegateEvents: _(source.prototype.delegateEvents).wrap(function(oldDelegateEvents) {
          var self = this, args = _(arguments).rest(1);

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
})(_, Backbone);
