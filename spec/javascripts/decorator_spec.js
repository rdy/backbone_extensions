describe('Decorator', function() {
  'use strict';
  var initializeSpy, toJSONSpy, DecoratorKlass, ModelKlass, CollectionKlass, model, collection, subject;
  beforeEach(function() {
    initializeSpy = jasmine.createSpy('initialize');
    toJSONSpy = jasmine.createSpy('toJSON');
    ModelKlass = Backbone.Model.extend();

    CollectionKlass = Backbone.Collection.extend({
       model: ModelKlass
     });

    DecoratorKlass = Backbone.extensions.Decorator.extend({
      model: ModelKlass,
      collection: CollectionKlass,
      initialize: initializeSpy,
      toJSON: toJSONSpy
    });

    model = new ModelKlass({id: 1});
    collection = new CollectionKlass();
    collection.add(model);
  });

  it('should keep the original functions as a property fn', function() {
    expect(DecoratorKlass.fn).toHave('toJSON');
    DecoratorKlass.fn.toJSON = jasmine.createSpy('toJSON').and.callFake(_(DecoratorKlass.fn.toJSON).wrap(function(oldToJSON) {
      return oldToJSON.call(this);
    }));
    model.decorator().toJSON();
    expect(DecoratorKlass.fn.toJSON).toHaveBeenCalled();
    expect(toJSONSpy).toHaveBeenCalled();
  });

  describe('when the Backbone include is present', function() {
    beforeEach(function() {
      expect(Backbone.extensions.include).toBeDefined();
    });
    it('should have the include function', function() {
      expect(DecoratorKlass.include).toEqual(Backbone.extensions.include.include);
    });
  });

  describe('when the decorator is passed a model', function() {
    beforeEach(function() {
      subject = new DecoratorKlass(model);
    });

    it('should call initialize', function() {
      expect(initializeSpy).toHaveBeenCalledWith(model, undefined);
    });

    describe('#toJSON', function() {
      beforeEach(function() {
        subject.toJSON();
      });

      it('should call toJSON with the model', function() {
        expect(_(subject.toJSON).isFunction()).toBe(true);
        expect(toJSONSpy).toHaveBeenCalled();
        expect(toJSONSpy.calls.mostRecent().object).toEqual(model);
      });
    });
  });

  describe('when the decorator is passed an array', function() {
    var array;
    beforeEach(function() {
      var model1 = new ModelKlass({id: 1}), model2 = new ModelKlass({id: 2});
      array = [model1, model2];
      subject = new DecoratorKlass(array);
    });

    it('should call initialize', function() {
      expect(initializeSpy).toHaveBeenCalledWith(array, undefined);
    });

    describe('#toJSON', function() {
      beforeEach(function() {
        subject.toJSON();
      });

      it('should call toJSON with the model', function() {
        expect(_(subject.toJSON).isFunction()).toBe(true);
        expect(toJSONSpy).toHaveBeenCalled();
        expect(toJSONSpy.calls.all().length).toEqual(array.length);
        _(array).each(function(value, i) {
          expect(toJSONSpy.calls.all()[i].object).toEqual(array[i]);
        });
      });
    });
  });

  describe('when the decorator is passed a collection', function() {
    var collection;
    beforeEach(function() {
      var model1 = new ModelKlass({id: 1}), model2 = new ModelKlass({id: 2});
      collection = new CollectionKlass();
      collection.add(model1);
      collection.add(model2);
      subject = new DecoratorKlass(collection);
    });

    it('should call initialize', function() {
      expect(initializeSpy).toHaveBeenCalledWith(collection, undefined);
    });

    describe('#toJSON', function() {
      beforeEach(function() {
        subject.toJSON();
      });

      it('should call toJSON with the model', function() {
        expect(_(subject.toJSON).isFunction()).toBe(true);
        expect(toJSONSpy).toHaveBeenCalled();
        expect(toJSONSpy.calls.all().length).toEqual(collection.length);
        collection.each(function(value, i) {
          expect(toJSONSpy.calls.all()[i].object).toEqual(collection.at(i));
        });
      });
    });
  });

  describe("when it has a model property", function() {
    describe("#decorator", function() {
      it("should return a decorator based on the instance", function() {
        expect(model.decorator()).toEqual(jasmine.any(DecoratorKlass));
      });
    });
  });

  describe("when it has a collection property", function() {
    describe("#decorator", function() {
      it("should return a decorator based on the instance", function() {
        expect(collection.decorator()).toEqual(jasmine.any(DecoratorKlass));
      });
    });
  });
});
