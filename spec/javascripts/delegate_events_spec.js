describe('delegateEvents', function() {
  'use strict';
  var subject, model, Klass, methodSpy, originalDelegateEventsSpy;

  beforeEach(function() {
    methodSpy = jasmine.createSpy('method');
    originalDelegateEventsSpy = spyOn(Backbone.View.prototype, 'delegateEvents').andCallThrough();
    Klass = Backbone.View.extend({method: methodSpy}, Backbone.extensions.include);
    Klass.include(Backbone.extensions.delegateEvents);
    subject = new Klass();
    model = new Backbone.Model({id: 1});
  });

  describe("#delegateEvents", function() {
    var changeSpy;

    beforeEach(function() {
      changeSpy = jasmine.createSpy('change');
      spyOn($.fn, 'on').andCallThrough();
    });
    
    describe("when called by Backbone.View's constructor", function() {
      describe("when the view has an events property", function() {
        var firstSpy, secondSpy;
        
        beforeEach(function() {
          firstSpy = jasmine.createSpy('first');
          secondSpy = jasmine.createSpy('second');
          
          Klass.prototype.events = {'click div': [firstSpy, secondSpy]};
          
          subject = new Klass({el: jasmine.content()[0]});
          jasmine.content().append('<div/>');
          
          subject.$("div").click();
        });

        it("should bind delegate events from that property", function() {
          expect(firstSpy).toHaveBeenCalled();
          expect(secondSpy).toHaveBeenCalled();
        });
      });
      
      describe("when the view has no events property", function() {
        beforeEach(function() {
          subject = new Klass();
        });
        
        it("should delegate to Backbone.View's delegate events", function() {
          expect(originalDelegateEventsSpy).toHaveBeenCalled();
        });
      });
    });

    describe("when it is called with a hash", function() {
      beforeEach(function() {
        subject.delegateEvents({'click div': $.noop});
      });

      it("should call jQuery on for the events", function() {
        expect($.fn.on).toHaveBeenCalled();
      });

      describe("when the hash has a key with an array value", function() {
        var firstSpy, secondSpy;

        beforeEach(function() {
          firstSpy = jasmine.createSpy('first');
          secondSpy = jasmine.createSpy('second');

          subject = new Klass({el: jasmine.content()[0]});
          jasmine.content().append('<div/>');

          subject.delegateEvents({
            'click div': [firstSpy, secondSpy],
            'mouseenter div': 'method'
          });
        });

        it("should delegate both of the callbacks", function() {
          subject.$("div").click();

          expect(firstSpy).toHaveBeenCalled();
          expect(secondSpy).toHaveBeenCalled();
        });

        it('should bind the event with the expected context if it is a string', function() {
          subject.$("div").trigger('mouseenter');
          expect(methodSpy).toHaveBeenCalled();
          expect(methodSpy.mostRecentCall.object).toEqual(subject);
        });
      });
    });

    describe("when it is called with a tuple", function() {
      describe("when the subject is not a jquery", function() {
        var resetSpy1, resetSpy2, context = {};

        beforeEach(function() {
          resetSpy1 = jasmine.createSpy('resetSpy1');
          resetSpy2 = jasmine.createSpy('resetSpy2');
          spyOn(subject, 'undelegateEvents').andCallThrough();
          subject.delegateEvents([model, {change: changeSpy, reset: [resetSpy1, resetSpy2], add: 'method'}, context]);
        });

        it('should call undelegate events', function() {
          expect(subject.undelegateEvents).toHaveBeenCalled();
        });

        it("should bind backbone events", function() {
          model.trigger('change');
          expect(changeSpy).toHaveBeenCalled();
        });

        it("should bind backbone callbacks that are supplied as an array with the expected context", function() {
          model.trigger('reset');
          expect(resetSpy1).toHaveBeenCalled();
          expect(resetSpy1.mostRecentCall.object).toEqual(context);
          expect(resetSpy2).toHaveBeenCalled();
          expect(resetSpy2.mostRecentCall.object).toEqual(context);
        });

        it('should bind the event with the expected context if it is a string', function() {
          model.trigger('add');
          expect(methodSpy).toHaveBeenCalled();
          expect(methodSpy.mostRecentCall.object).toEqual(context);
        });

        it("should be resilient against null backbone objects", function() {
          expect(function() {
            subject.delegateEvents([null, {change: $.noop}]);
          }).not.toThrow();
        });
      });

      describe("when the subject is a jquery", function() {
        describe("when called with a function", function() {
          describe("when it is called with a selector", function() {
            var $el, clickSpy, selector = 'span';
            beforeEach(function() {
              $el = $('<div/>').append('<span/>');
              clickSpy = jasmine.createSpy('click');
              subject.delegateEvents([$el, {click: clickSpy}, selector]);
            });

            it("should call jQuery on for the events on the selector", function() {
              expect($.fn.on.mostRecentCall.args.length).toBe(3);
              expect($.fn.on.mostRecentCall.args[0]).toEqual('click');
              expect($.fn.on.mostRecentCall.args[1]).toEqual(selector);
              expect($.fn.on.mostRecentCall.object).toEqual($el);

              $el.click();
              expect(clickSpy).not.toHaveBeenCalled();

              expect(function() {
                $el.find(selector).click();
              }).not.toThrow();

              expect(clickSpy).toHaveBeenCalled();
              expect(clickSpy.mostRecentCall.args.length).toBe(1);
            });
          });

          describe("when it is called without a selector", function() {
            var $el, clickSpy;
            beforeEach(function() {
              $el = $('<div/>');
              clickSpy = jasmine.createSpy('click');
              subject.delegateEvents([$el, {click: clickSpy}]);
            });
            it("should call jQuery on for the events", function() {
              expect($.fn.on.mostRecentCall.args.length).toBe(2);
              expect($.fn.on.mostRecentCall.args[0]).toEqual('click');
              expect($.fn.on.mostRecentCall.object).toEqual($el);

              expect(function() {
                $el.click();
              }).not.toThrow();

              expect(clickSpy).toHaveBeenCalled();
              expect(clickSpy.mostRecentCall.args.length).toBe(1);
            });
          });
        });

        describe("when called with a string", function() {
          var $el, clickSpy;
          beforeEach(function() {
            $el = $('<div/>');
            clickSpy = jasmine.createSpy('click');
            subject.click = clickSpy;
            subject.delegateEvents([$el, {click: 'click'}]);
          });

          it("should call jQuery on for the events", function() {
            expect($.fn.on.mostRecentCall.args.length).toBe(2);
            expect($.fn.on.mostRecentCall.args[0]).toEqual('click');
            expect($.fn.on.mostRecentCall.object).toEqual($el);

            expect(function() {
              $el.click();
            }).not.toThrow();

            expect(clickSpy).toHaveBeenCalled();
            expect(clickSpy.mostRecentCall.args.length).toBe(1);
          });
        });
      });
    });

    describe("when it is called with a hash and a tuple", function() {
      beforeEach(function() {
        subject.delegateEvents({'click div': $.noop}, [model, {change: changeSpy}]);
      });

      it("should call jQuery on for the events", function() {
        expect($.fn.on).toHaveBeenCalled();
      });

      it("should bind backbone events", function() {
        model.trigger('change');
        expect(changeSpy).toHaveBeenCalled();
      });
    });
  });

  describe("#undelegateEvents", function() {
    var changeSpy;

    beforeEach(function() {
      changeSpy = jasmine.createSpy('change');
      subject.delegateEvents([model, {change: changeSpy}]);
      subject.undelegateEvents();
    });

    it("should remove backbone events", function() {
      model.trigger('change');
      expect(changeSpy).not.toHaveBeenCalled();
    });

    describe("when the jquery event passed a context", function() {
      var $el, selector = 'span';
      beforeEach(function() {
        $el = $('<div/>').append('<span/>');
        subject.delegateEvents([$el, {click: changeSpy}, selector]);
        spyOn($.fn, 'off').andCallThrough();
        subject.undelegateEvents();
      });

      it("should call jQuery off", function() {
        expect($.fn.off).toHaveBeenCalled();
        expect($.fn.off.calls[0].args[0]).toEqual('click');
        expect($.fn.off.calls[0].args[1]).toEqual(selector);
      });
    });
  });

  describe("#remove", function() {
    it("should call undelegate events", function() {
      spyOn(subject, 'undelegateEvents').andCallThrough();
      subject.remove();
      expect(subject.undelegateEvents).toHaveBeenCalled();
    });
  });
});
