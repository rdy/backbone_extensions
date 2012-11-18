describe('delegateEvents', function() {
  var subject, model, Klass;

  beforeEach(function() {
    Klass = Backbone.View.extend({}, Backbone.extensions.include);
    Klass.include(Backbone.extensions.delegateEvents);
    subject = new Klass();
    model = new Backbone.Model({id: 1});
  });

  describe("#delegateEvents", function() {
    var changeSpy;

    beforeEach(function() {
      changeSpy = jasmine.createSpy('change');
      spyOn($.fn, 'delegate').andCallThrough();
    });

    describe("when it is called with a hash", function() {
      beforeEach(function() {
        subject.delegateEvents({'click div': $.noop});
      });

      it("should call jquery delegate for the events", function() {
        expect($.fn.delegate).toHaveBeenCalled();
      });

      describe("when the hash has a key with an array value", function() {
        var firstSpy, secondSpy;

        beforeEach(function() {
          firstSpy = jasmine.createSpy('first'); secondSpy = jasmine.createSpy('second');

          subject = new Klass({
            el: jasmine.content()[0]
          });
          jasmine.content().append('<div/>');

          subject.delegateEvents({
            'click div': [firstSpy, secondSpy]
          });
        });

        it("should delegate both of the callbacks", function() {
          subject.$("div").click();

          expect(firstSpy).toHaveBeenCalled();
          expect(secondSpy).toHaveBeenCalled();
        });
      });
    });

    describe("when it is called with a tuple", function() {
      var resetSpy1, resetSpy2;

      beforeEach(function() {
        resetSpy1 = jasmine.createSpy('resetSpy1');
        resetSpy2 = jasmine.createSpy('resetSpy2');
        subject.delegateEvents([model, {change: changeSpy, reset: [resetSpy1, resetSpy2]}]);
      });

      it("should bind backbone events", function() {
        model.trigger('change');
        expect(changeSpy).toHaveBeenCalled();
      });

      it("should bind backbone callbacks that are supplied as an array", function() {
        model.trigger('reset');
        expect(resetSpy1).toHaveBeenCalled();
        expect(resetSpy2).toHaveBeenCalled();
      });

      it("should be resilient against null backbone objects", function() {
        expect(function() {
          subject.delegateEvents([null, {change: $.noop}]);
        }).not.toThrow();
      });
    });

    describe("when it is called with a hash and a tuple", function() {
      beforeEach(function() {
        subject.delegateEvents({'click div': $.noop}, [model, {change: changeSpy}]);
      });

      it("should call jQuery delegate for the events", function() {
        expect($.fn.delegate).toHaveBeenCalled();
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
      subject.delegateEvents([[model, {change: changeSpy}]]);
      spyOn($.fn, 'unbind').andCallThrough();
      subject.undelegateEvents();
    });

    it("should remove backbone events", function() {
      model.trigger('change');
      expect(changeSpy).not.toHaveBeenCalled();
    });

    it("should call jQuery unbind", function() {
      expect($.fn.unbind).toHaveBeenCalled();
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
