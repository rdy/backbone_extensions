describe("Queue", function() {
  var subject, array;
  beforeEach(function() {
    array = [];
    subject = new Backbone.extensions.Queue(array);
  });

  describe("#add", function() {
    it("should add an item to the back of the queue", function() {
      var item1 = {}, item2 = {}, item3 = {};
      subject.add(function() { return item1; });
      expect(array[0].item()).toEqual(item1);
      subject.add(function() { return item2; });
      expect(array[0].item()).toEqual(item1);
      subject.add(function() { return item3; });
      expect(array[0].item()).toEqual(item1);
    });

    it("should return a promise indicating the success/failure state of the job", function() {
      var item1 = jasmine.createSpyObj('item1', ['perform']), perform1Deferred = $.Deferred();
      item1.perform.andReturn(perform1Deferred);

      var jobPromise = subject.add(function() { return item1.perform(item1); });
      expect(jobPromise).toBeAPromise();
      expect(jobPromise.state()).toEqual('pending');

      subject.processHead();
      perform1Deferred.resolve(true);
      expect(jobPromise.state()).toEqual('resolved');

      var item2 = jasmine.createSpyObj('item2', ['perform']), perform2Deferred = $.Deferred();
      item2.perform.andReturn(perform2Deferred);

      jobPromise = subject.add(function() { return item2.perform(item2); });
      subject.processHead();
      perform2Deferred.resolve();
      expect(jobPromise.state()).toEqual('rejected');
    });
  });

  describe("#size", function() {
    it("should return the size of the queue", function() {
      expect(subject.size()).toBe(0);
      subject.add($.noop);
      expect(subject.size()).toBe(1);
      subject.add($.noop);
      expect(subject.size()).toBe(2);
    });
  });

  describe("#flush", function() {
    var item1 = {}, item2 = {}, item1Promise, item2Promise;
    beforeEach(function() {
      item1Promise = subject.add(function() { return item1; });
      item2Promise = subject.add(function() { return item2; });
    });

    it("removes all items from the queue without running them", function() {
      expect(subject.size()).toBe(2);
      subject.flush();
      expect(subject.size()).toBe(0);
    });

    it("should reject all the pending job deferreds in the queue", function() {
      subject.flush();
      expect(item1Promise.state()).toEqual('rejected');
      expect(item2Promise.state()).toEqual('rejected');
    });
  });

  describe("#processHead", function() {
    describe("when there are no more jobs in the queue", function() {
      it("should do nothing", function() {
        expect(subject.processHead()).toBeUndefined();
      });
    });

    describe("when there are jobs in the queue", function() {
      var item1, item2, item1Promise;
      beforeEach(function() {
        item1 = jasmine.createSpyObj('item1', ['perform']);
        item2 = jasmine.createSpyObj('item2', ['perform']);
        item1.perform.andReturn($.Deferred());
        item1Promise = subject.add(function() { return item1.perform(item1); });
        subject.add(function() { return item2.perform(item2); });
      });

      it("should do the next job", function() {
        subject.processHead();
        expect(item1.perform).toHaveBeenCalled();
        expect(item2.perform).not.toHaveBeenCalled();
      });

      describe("when the job is finished", function() {
        var perform1Deferred, perform2Deferred;

        beforeEach(function() {
          perform1Deferred = $.Deferred();
          perform2Deferred = $.Deferred();
          item1.perform.andReturn(perform1Deferred);
          item2.perform.andReturn(perform2Deferred);
          subject.processHead();
        });

        it("should remove the job from the queue", function() {
          perform1Deferred.resolve(true);
          expect(subject.size()).toBe(1);
          expect(subject.head().item()).toBe(item2.perform(item2));
        });

        it("should do the next job, if it exists", function() {
          perform1Deferred.resolve(true);
          expect(item2.perform).toHaveBeenCalled();
          perform2Deferred.resolve(true);
          expect(subject.size()).toBe(0);
          expect(subject.head()).toBeUndefined();
        });

        describe("when the job is a success", function() {
          var doneSpy;
          beforeEach(function() {
            doneSpy = jasmine.createSpy('item1 resolution');
            item1Promise.done(doneSpy);
            perform1Deferred.resolve(true, 1, 2, 3);
          });

          it("pass the success status of the job to the job's promise", function() {
            expect(item1Promise.state()).toEqual('resolved');
          });

          it("pass the results of the perform to the resolution of the job's promise", function() {
            expect(doneSpy).toHaveBeenCalledWith(1, 2, 3);
          });
        });

        describe("when the job is a failure", function() {
          var failSpy;
          beforeEach(function() {
            failSpy = jasmine.createSpy('item1 resolution');
            item1Promise.fail(failSpy);
            perform1Deferred.resolve(false, 1, 2, 3);
          });

          it("pass the failure status of the job to the job's promise", function() {
            expect(item1Promise.state()).toEqual('rejected');
          });

          it("pass the results of the perform to the resolution of the job's promise", function() {
            expect(failSpy).toHaveBeenCalledWith(1, 2, 3);
          });
        });
      });

      describe("when the job didn't finish", function() {
        describe("when we haven't reached the maximum number of retry attempts", function() {
          var perform1Deferred;
          beforeEach(function() {
            var count = 0;
            perform1Deferred = $.Deferred();
            item1.perform.andCallFake(function() { return ++count > 1 ? $.Deferred() : perform1Deferred; });
            item2.perform.andReturn($.Deferred());
            subject.processHead();
            perform1Deferred.reject(1, 2, 3);
          });

          it("should not remove the job from the queue", function() {
            expect(item1.perform.callCount).toBe(2);
            expect(subject.size()).toBe(2);
          });
        });

        describe("when we have reached the maximum number of retry attempts", function() {
          var failSpy;
          beforeEach(function() {
            failSpy = jasmine.createSpy('job resolution');
            item1Promise.fail(failSpy);

            var perform1Deferred = $.Deferred();
            item1.perform.andReturn(perform1Deferred);
            item2.perform.andReturn($.Deferred());
            subject.processHead();
            perform1Deferred.reject(1, 2, 3);
          });

          it('should fail the job promise after the maximum number of retry attempts', function() {
            expect(item1.perform.callCount).toBe(100);
            expect(item1Promise.state()).toBe("rejected");
            expect(failSpy).toHaveBeenCalledWith(1, 2, 3);
          });

          it("should remove the job from the queue", function() {
            expect(subject.size()).toBe(1);
            expect(subject.head().item()).toBe(item2.perform(item2));
          });

          it("should do the next job", function () {
            expect(item2.perform).toHaveBeenCalled();
            expect(item2.perform.callCount).toBe(1);
          });
        });
      });
    });
  });
});
