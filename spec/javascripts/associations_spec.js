describe('associations', function () {
  'use strict';
  var subject, app;
  beforeEach(function () {
    var Model = Backbone.Model.extend({}, Backbone.extensions.include);
    var Car = Model.extend(),
        Wheel = Model.extend(),
        Tire = Model.extend(),
        SpareTire = Model.extend(),
        Spoke = Model.extend(),
        Piston = Model.extend();

    app = {
      Car: Car,
      Cars: Backbone.Collection.extend({model: Car}, Backbone.extensions.include),
      Wheel: Wheel,
      Wheels: Backbone.Collection.extend({model: Wheel}, Backbone.extensions.include),
      SpareWheels: Backbone.Collection.extend({}, Backbone.extensions.include),
      Tire: Tire,
      SpareTire: SpareTire,
      SpareTires: Backbone.Collection.extend({model: SpareTire}, Backbone.extensions.include),
      Tires: Backbone.Collection.extend({model: Tire}, Backbone.extensions.include),
      Engine: Model,
      SpareEngine: Model,
      Radio: Model,
      Console: Model,
      Spoke: Spoke,
      Spokes: Backbone.Collection.extend({model: Spoke}, Backbone.extensions.include),
      Piston: Piston,
      Pistons: Backbone.Collection.extend({model: Piston}, Backbone.extensions.include)
    };

    _(app).chain().values().invoke('include', Backbone.extensions.associations(app));
  });

  it('should be an includeable module', function () {
    expect(_(Backbone.extensions.associations).isFunction()).toBe(true);
    expect(_(Backbone.extensions.associations().included).isObject()).toBe(true);
  });

  it('should be resilient against no namespace being provided', function() {
    var instance, Klass = Backbone.Model.extend({}, Backbone.extensions.include);
    expect(function() { Klass.include(Backbone.extensions.associations()); }).not.toThrow();
    expect(function() { Klass.associations({hasMany: 'chickens'}); }).not.toThrow();
    expect(function() { instance = new Klass(); }).not.toThrow();
    expect(instance.chickens()).toBeUndefined();
  });

  describe('.belongsTo', function() {
    it('should return the class', function() {
      expect(app.Wheel.belongsTo('car')).toBe(app.Wheel);
    });

    it('should define a function for the association', function () {
      app.Wheel.belongsTo('car');
      subject = new app.Wheel({id: 1});
      expect(_(subject.car).isFunction()).toBe(true);
    });

    describe('the association function', function () {
      var prius;
      beforeEach(function () {
        app.Wheel.belongsTo('car');
      });

      describe("when the model is initialized without the association's key", function () {
        describe('when options.through', function() {
          var body;
          describe('when it is a string', function() {
            beforeEach(function() {
              app.Wheel.belongsTo('body').belongsTo('car', {through: 'body'});

              body = jasmine.createSpyObj('body', ['car']);
              body.car.andReturn('mockCar');

              subject = new app.Wheel({id: 1}, {body: body});
            });

            it('should use the string called on instance to return the association', function() {
              expect(subject.car()).toEqual(body.car());
            });
          });

          describe('when it is a function', function() {
            beforeEach(function() {
              app.Wheel.belongsTo('body').belongsTo('car', {through: function() { return 'body'; } });

              body = jasmine.createSpyObj('body', ['car']);
              body.car.andReturn('mockCar');

              subject = new app.Wheel({id: 1}, {body: body});
            });

            it('should use that function called on the instance to return the association', function() {
              expect(subject.car()).toEqual(body.car());
            });
          });
        });

        describe("for the model's collection", function() {
          describe('when it has a parent collection', function() {
            var collection;
            beforeEach(function() {
              app.Wheels.belongsTo('car');
              prius = new app.Car({id: 1});
              subject = new app.Wheel({id: 1});
            });

            describe('when the collection has the association', function() {
              beforeEach(function () {
                expect(subject.collection).toBeUndefined();
                collection = new app.Wheels([subject], {car: prius});
              });

              it("should return the collection's instance of the association at runtime, not definition time", function() {
                expect(collection.car()).toBe(prius);
                expect(subject.car()).toBe(collection.car());
              });
            });

            describe('when the collection does not have the association', function() {
              beforeEach(function () {
                collection = new app.Wheels([subject]);
              });

              it('should return undefined', function() {
                expect(subject.car()).toBeUndefined();
              });
            });
          });

          describe('when it does not have parent collection', function() {
            beforeEach(function () {
              subject = new app.Wheel({id: 1});
              expect(subject.car()).toBeUndefined();
            });

            it('should return undefined', function () {
              expect(subject.car()).toBeUndefined();
            });
          });
        });
      });

      describe('when the model is initialized with an instance of the associated object', function () {
        beforeEach(function () {
          prius = new app.Car({id: 1});
          subject = new app.Wheel({id: 1}, {car: prius});
        });

        it('should return the instance of the object', function () {
          expect(subject.car()).toBe(prius);
        });
      });

      describe('when the model is initialized with a function', function () {
        var priusFunc;
        beforeEach(function () {
          var prius = new app.Car({id: 1});
          priusFunc = function() { return prius; };
          subject = new app.Wheel({id: 1}, {car: priusFunc});
        });

        it('should return the same value as that function', function () {
          expect(subject.car()).toBe(priusFunc());
        });
      });
    });
  });

  describe('.hasOne', function() {
    it('should return the class', function() {
      expect(app.Car.hasOne('engine')).toBe(app.Car);
    });

    it('should define a function for the association', function () {
      app.Car.hasOne('engine');
      subject = new app.Car({id: 1});
      expect(_(subject.engine).isFunction()).toBe(true);
    });

    describe('the association function', function () {
      var v6;
      beforeEach(function () {
        app.Car.hasOne('engine');
      });

      describe("when the model is initialized without the association's key", function () {
        describe('when options.inverseOf', function() {
          describe('when it is a string', function() {
            beforeEach(function() {
              app.Engine.belongsTo('car');
              app.Car.hasOne('engine', {inverseOf: 'car'});
              subject = new app.Car({id: 1});
            });

            it('should define the inverse of association using this with the named option', function() {
              expect(subject.engine().car()).toEqual(subject);
            });
          });
        });

        describe('when options.through', function() {
          var engineBlock;
          describe('when it is a string', function() {
            beforeEach(function() {
              app.Wheel.belongsTo('engineBlock').hasOne('car', {through: 'engineBlock'});

              engineBlock = jasmine.createSpyObj('engineBlock', ['car']);
              engineBlock.car.andReturn('mockCar');

              subject = new app.Wheel({id: 1}, {engineBlock: engineBlock});
            });

            it('should use the string called on instance to return the association', function() {
              expect(subject.car() instanceof app.Car).toBe(true);
            });
          });

          describe('when it is a function', function() {
            beforeEach(function() {
              app.Wheel.belongsTo('engineBlock').hasOne('car', {through: function() { return 'engineBlock'; } });

              engineBlock = jasmine.createSpyObj('engineBlock', ['car']);
              engineBlock.car.andReturn('mockCar');

              subject = new app.Wheel({id: 1}, {engineBlock: engineBlock});
            });

            it('should use that function called on the instance to return the association', function() {
              expect(subject.car() instanceof app.Car).toBe(true);
            });
          });
        });

        describe('when options.class', function() {
          beforeEach(function() {
            subject = new app.Car({id: 1});
          });
          describe('when it is provided', function() {
            beforeEach(function() {
              spyOn(app.SpareEngine.prototype, 'initialize').andCallThrough();
              app.Car.hasOne('engine', {'class': app.SpareEngine, foo: 'bar'});
              subject = new app.Car({id: 1}, {parse: true});
            });

            it('should return a new instance of the child model with that class', function () {
              expect(subject.engine() instanceof app.SpareEngine).toBe(true);
            });

            it("should initialize the new instance of the child collection with the parent's options, without the class option", function() {
              expect(subject.engine()).toBeDefined();
              expect(app.SpareEngine.prototype.initialize).toHaveBeenCalled();
              expect(app.SpareEngine.prototype.initialize.mostRecentCall.args[1]).toEqual({parse: true, foo: 'bar'});
            });
          });

          describe('when is not provided', function() {
            it('should return a new instance of the child model ' +
                'by inferring the class name from the given name ' +
                'and fetching the constructor from the provided namespace', function () {
              expect(subject.engine() instanceof app.Engine).toBe(true);
            });
          });
        });

        describe('when options.className', function() {
          beforeEach(function() {
            subject = new app.Car({id: 1});
          });
          describe('when it is provided', function() {
            beforeEach(function() {
              spyOn(app.SpareEngine.prototype, 'initialize').andCallThrough();
              app.Car.hasOne('engine', {className: 'SpareEngine', foo: 'bar'});
              subject = new app.Car({id: 1}, {parse: true});
            });

            it('should return a new instance of the child collection with that class', function () {
              expect(subject.engine() instanceof app.SpareEngine).toBe(true);
            });

            it("should initialize the new instance of the child collection with the parent's options, without the className option", function() {
              expect(subject.engine()).toBeDefined();
              expect(app.SpareEngine.prototype.initialize).toHaveBeenCalled();
              expect(app.SpareEngine.prototype.initialize.mostRecentCall.args[1]).toEqual({parse: true, foo: 'bar'});
            });
          });

          describe('when it is not provided', function() {
            it('should return a new instance of the child collection ' +
                'by inferring the class name from the given name ' +
                'and fetching the constructor from the provided namespace', function () {
              expect(subject.engine() instanceof app.Engine).toBe(true);
            });
          });
        });

        describe("for the model's collection", function() {
          var engine;
          beforeEach(function() {
            app.Cars.hasOne('engine');
            engine = new app.Engine({id: 1});
            subject = new app.Car({id: 1});
          });
          describe('when it has a parent collection', function() {
            var collection;

            describe('when the collection has the association', function() {
              beforeEach(function () {
                expect(subject.collection).toBeUndefined();
                collection = new app.Cars([subject], {engine: engine});
              });

              it("should return the collection's instance of the association at runtime, not definition time", function() {
                expect(collection.engine()).toBe(engine);
                expect(subject.engine()).toBe(collection.engine());
              });
            });

            describe('when the collection does not have the association', function() {
              beforeEach(function () {
                collection = new app.Cars([subject]);
              });

              it('should return a new model', function () {
                expect(subject.engine() instanceof app.Engine).toBe(true);
                expect(subject.engine()).not.toEqual(engine);
              });
            });
          });

          describe('when it does not have parent collection', function() {
            it('should return a new model', function () {
              expect(subject.engine() instanceof app.Engine).toBe(true);
              expect(subject.engine()).not.toEqual(engine);
            });
          });
        });
      });

      describe('when the model is initialized with an instance of the associated object', function () {
        beforeEach(function () {
          v6 = new app.Engine([]);
          subject = new app.Car({id: 1}, {engine: v6});
        });

        it('should return the instance of the object', function () {
          expect(subject.engine()).toBe(v6);
        });
      });

      describe('when the model is initialized with a function', function () {
        var v6Func;
        beforeEach(function () {
          var v6 = new app.Engine({});
          v6Func = function() { return v6; };
          subject = new app.Car({id: 1}, {engine: v6Func});
        });

        it('should return the same value as that function', function () {
          expect(subject.engine()).toBe(v6Func());
        });
      });
    });
  });

  describe('.hasMany', function() {
    it('should return the class', function() {
      expect(app.Car.hasMany('wheels')).toBe(app.Car);
    });

    it('should define a function for the association', function () {
      app.Car.hasMany('wheels');
      subject = new app.Car({id: 1});
      expect(_(subject.wheels).isFunction()).toBe(true);
    });

    describe('the association function', function () {
      var rims;
      beforeEach(function () {
        app.Car.hasMany('wheels');
      });

      describe("when the model is initialized without the association's key", function () {
        beforeEach(function() {
          subject = new app.Car({id: 1});
        });

        describe('when options.inverseOf', function() {
          describe('when it is a string', function() {
            beforeEach(function() {
              app.Wheels.belongsTo('car');
              app.Car.hasMany('wheels', {inverseOf: 'car'});
              subject = new app.Car({id: 1});
            });

            it('should define the inverse of association using this with the named option', function() {
              expect(subject.wheels().car()).toEqual(subject);
            });
          });
        });

        describe('when options.through', function() {
          var tire1, tire2;
          describe('when it is a string', function() {
            beforeEach(function() {
              app.Wheel.belongsTo('tire');
              app.Car.hasMany('tires', {through: 'wheels'});

              tire1 = new app.Tire({id: 1});
              tire2 = new app.Tire({id: 2});
              var wheel1 = new app.Wheel({id: 1}, {tire: function() { return tire1; }}),
                  wheel2 = new app.Wheel({id: 2}, {tire: function() { return tire2; }}),
                  wheels = new app.Wheels([wheel1, wheel2]);

              subject = new app.Car({id: 1}, {wheels: wheels});
            });

            it('should use the string called on instance to return the association', function() {
              expect(subject.tires() instanceof app.Tires).toBe(true);
            });
          });

          describe('when it is a function', function() {
            beforeEach(function() {
              app.Wheel.belongsTo('tire');
              app.Car.hasMany('tires', {through: function() { return this.wheels(); }});

              tire1 = new app.Tire({id: 1});
              tire2 = new app.Tire({id: 2});
              var wheel1 = new app.Wheel({id: 1}, {tire: function() { return tire1; }}),
                  wheel2 = new app.Wheel({id: 2}, {tire: function() { return tire2; }}),
                  wheels = new app.Wheels([wheel1, wheel2]);

              subject = new app.Car({id: 1}, {wheels: wheels});
            });

            it('should use that function called on the instance to return the association', function() {
              expect(subject.tires() instanceof app.Tires).toBe(true);
            });
          });
        });

        describe('when options.class', function() {
          describe('when it is provided', function() {
            beforeEach(function() {
              app.Car.hasMany('wheels', {'class': app.SpareWheels, foo: 'bar'});
              subject = new app.Car({id: 1}, {parse: true});
            });

            it('should return a new instance of the child collection with that class', function () {
              expect(subject.wheels() instanceof app.SpareWheels).toBe(true);
            });
          });

          describe('when it is not provided', function() {
            beforeEach(function () {
              app.Car.hasMany('wheels');
              subject = new app.Car({id: 1});
            });

            it('should return a new instance of the child collection ' +
                'by inferring the class name from the given name ' +
                'and fetching the constructor from the provided namespace', function () {
              expect(subject.wheels() instanceof app.Wheels).toBe(true);
            });
          });
        });

        describe('when options.className', function() {
          describe('when it is provided', function() {
            beforeEach(function() {
              app.Car.hasMany('wheels', {className: 'SpareWheels', foo: 'bar'});
              subject = new app.Car({id: 1});
              spyOn(app.SpareWheels.prototype, 'initialize').andCallThrough();
            });

            it('should return a new instance of the child collection with that class', function () {
              expect(subject.wheels() instanceof app.SpareWheels).toBe(true);
            });

            it("should initialize the new instance of the child collection with the parent's options, without the className option", function() {
              expect(subject.wheels()).toBeDefined();
              expect(app.SpareWheels.prototype.initialize).toHaveBeenCalledWith(null, {parse: true, foo: 'bar'});
            });
          });

          describe('when it is not provided', function() {
            beforeEach(function () {
              app.Car.hasMany('wheels');
              subject = new app.Car({id: 1});
            });

            it('should return a new instance of the child collection ' +
                'by inferring the class name from the given name ' +
                'and fetching the constructor from the provided namespace', function () {
              expect(subject.wheels() instanceof app.Wheels).toBe(true);
            });
          });
        });
      });

      describe('when the model is initialized with an instance of the associated object', function () {
        beforeEach(function () {
          rims = new app.Wheels([]);
          subject = new app.Car({id: 1}, {wheels: rims});
        });

        it('should return the instance of the object', function () {
          expect(subject.wheels()).toBe(rims);
        });
      });

      describe('when the model is initialized with a function', function () {
        var rimsFunc;
        beforeEach(function () {
          var rims = new app.Wheels([]);
          rimsFunc = function() { return rims; };
          subject = new app.Car({id: 1}, {wheels: rimsFunc});
        });

        it('should return the same value as that function', function () {
          expect(subject.wheels()).toBe(rimsFunc());
        });
      });
    });
  });

  describe('.associations', function () {
    it('should not throw an error when called with undefined or null', function() {
      expect(function() {
        app.Wheel.associations(null);
      }).not.toThrow();
      expect(function() {
        app.Wheel.associations(undefined);
      }).not.toThrow();
      expect(function() {
        app.Wheel.associations(null, undefined);
      }).not.toThrow();
    });

    describe('options.belongsTo', function () {
      it('should call the underlying association function passing through the options', function() {
        spyOn(app.Wheel, 'belongsTo').andCallThrough();
        app.Wheel.associations({belongsTo: 'car', foo: 'bar'});
        var car = new app.Car({id: 1});
        subject = new app.Wheel({id: 1}, {car: car});
        expect(subject.car()).toEqual(car);
      });
    });

    describe('options.hasMany', function () {
      it('should call the underlying association function passing through the options', function() {
        app.Car.associations({hasMany: 'wheels', className: 'SpareWheels'});
        subject = new app.Car({id: 1});
        expect(subject.wheels).toBeDefined();
        expect(subject.wheels() instanceof app.SpareWheels).toBe(true);
      });
    });

    describe('options.hasOne', function () {
      it('should call the underlying association function passing through the options', function() {
        app.Car.associations({hasOne: 'engine', className: 'SpareEngine'});
        subject = new app.Car({id: 1});
        expect(subject.engine).toBeDefined();
        expect(subject.engine() instanceof app.SpareEngine).toBe(true);
      });
    });
  });

  describe('.extend', function() {
    it('should call associations withe the provided associations', function() {
      spyOn(app.Car, 'associations').andCallThrough();
      var Klass = app.Car.extend({associations: {hasOne: 'engine'}});
      expect(app.Car.associations).toHaveBeenCalled();
      expect(app.Car.associations.mostRecentCall.object).toEqual(Klass);
      expect(app.Car.associations).toHaveBeenCalledWith({hasOne: 'engine'});

      Klass = app.Car.extend({associations: [{hasOne: 'engine'}, {hasMany: 'wheels'}]});
      expect(app.Car.associations).toHaveBeenCalled();
      expect(app.Car.associations.mostRecentCall.object).toEqual(Klass);
      expect(app.Car.associations).toHaveBeenCalledWith({hasOne: 'engine'}, {hasMany: 'wheels'});
    });
  });

  describe('#parse', function() {
    describe('for hasOne', function() {
      var baseParseSpy;
      beforeEach(function() {
        baseParseSpy = spyOn(app.Car.prototype, 'parse').andCallThrough();
      });

      describe('when the association is defined with parse: true', function() {
        describe("with the default parse function", function() {
          var result;
          beforeEach(function() {
            app.Car.associations({hasOne: 'engine', parse: true});
            subject = new app.Car();
            result = subject.parse({engine: {cylinders: 6}, foo: 'bar', cow: ['moo']});
          });

          it("should call the object's normal parse function", function() {
            expect(baseParseSpy).toHaveBeenCalledWith({engine : { cylinders : 6 }, foo: 'bar', cow: ['moo']});
          });

          it("should remove the key from parse response", function() {
            expect(result.engine).toBeUndefined();
          });
        });

        it("should replace the child object's attributes with the association's data from the response, passing parse: true downwards", function() {
          app.Car.associations({hasOne: 'engine', className: 'SpareEngine', parse: true});
          subject = new app.Car({}, {extra: 'extra options'});
          spyOn(app.SpareEngine.prototype, 'clear').andCallThrough();
          spyOn(app.SpareEngine.prototype, 'set').andCallThrough();
          var changeSpy = jasmine.createSpy('change');
          subject.engine().on('change', changeSpy);

          var engineData = {cylinders: 6, manufacturer: 'toyota'};
          subject.parse({spare_engine: engineData});
          expect(app.SpareEngine.prototype.clear).toHaveBeenCalled();
          expect(_(app.SpareEngine.prototype.clear.mostRecentCall.args[0]).pick('silent')).toEqual({silent: true});
          expect(app.SpareEngine.prototype.set).toHaveBeenCalled();
          expect(app.SpareEngine.prototype.set.mostRecentCall.args[1]).toEqual({parse: true, extra: 'extra options'});
          expect(app.SpareEngine.prototype.set.mostRecentCall.args[0]).toEqual(engineData);
          expect(_(app.SpareEngine.prototype.set.mostRecentCall.args[1]).pick('parse')).toEqual({parse: true});
          expect(changeSpy).toHaveBeenCalled();
        });

        describe('when options.through', function() {
          var consoleData;
          beforeEach(function() {
            consoleData = {id: 1, radio: {id: 3}};
          });

          describe('when it is a string', function() {
            beforeEach(function() {
              app.Console.belongsTo('radio');
              app.Car.hasOne('console', {parse: true}).hasOne('radio', {through: 'console', parse: true});
              subject = new app.Car({id: 1});
            });

            it('should use the string to parse the association', function() {
              subject.parse({console: consoleData});
              expect(subject.radio().id).toEqual(3);
            });
          });

          describe('when it is a function', function() {
            beforeEach(function() {
              app.Console.belongsTo('radio');
              app.Car.hasOne('console', {parse: true}).hasOne('radio', {through: function() { return 'console'; }, parse: true});
              subject = new app.Car({id: 1});
            });

            it('should use the result of that function to parse the association', function() {
              subject.parse({console: consoleData});
              expect(subject.radio().id).toEqual(3);
            });
          });

          describe('when options.parseName', function() {
            beforeEach(function() {
              app.Console.belongsTo('radio');
              app.Car.hasOne('console', {parse: true}).hasOne('radio', {through: 'console', parse: true, parseName: 'am_fm_radio'});
              subject = new app.Car({id: 1});
            });

            it('should use it to find the association', function() {
              subject.parse({console: {id: 1, am_fm_radio: {id: 3}}});
              expect(subject.radio().id).toEqual(3);
            });
          });
        });

        describe('when options.parseName', function() {
          var result, changeSpy, engineData;
          beforeEach(function() {
            app.Car.associations({hasOne: 'engine', className: 'SpareEngine', parse: true, parseName: 'engineZ'});
            subject = new app.Car();
            spyOn(app.SpareEngine.prototype, 'clear').andCallThrough();
            spyOn(app.SpareEngine.prototype, 'set').andCallThrough();
            changeSpy = jasmine.createSpy('change');
            subject.engine().on('change', changeSpy);

            engineData = {cylinders: 6, manufacturer: 'toyota'};
            result = subject.parse({engineZ: engineData});
          });

          it('should use it to find the association', function() {
            expect(app.SpareEngine.prototype.clear).toHaveBeenCalled();
            expect(_(app.SpareEngine.prototype.clear.mostRecentCall.args[0]).pick('silent')).toEqual({silent: true});
            expect(app.SpareEngine.prototype.set).toHaveBeenCalled();
            expect(app.SpareEngine.prototype.set.mostRecentCall.args[0]).toEqual(engineData);
            expect(_(app.SpareEngine.prototype.set.mostRecentCall.args[1]).pick('parse')).toEqual({parse: true});
            expect(changeSpy).toHaveBeenCalled();
          });

          it("should remove the key from parse response", function() {
            expect(result.engineZ).toBeUndefined();
          });
        });
      });

      describe('when the association is defined with parse as a function', function() {
        var associationParseSpy, associationParseResult = {water: ['H', 'O', 'H']};
        beforeEach(function() {
          associationParseSpy = jasmine.createSpy('association parse').andCallFake(function() { return associationParseResult; });
          app.Car.associations({hasOne: 'engine', parse: associationParseSpy});
          subject = new app.Car();
        });

        it("should call the association's provided parse function", function() {
          var response = {foo: 'bar'};
          subject.parse(response);
          expect(associationParseSpy).toHaveBeenCalledWith(response);
        });
      });

      describe('when the association is defined with parse as falsy', function() {
        beforeEach(function() {
          app.Car.associations({hasOne: 'engine', parse: false});
          subject = new app.Car();
        });

        it('should not modify the parse function', function() {
          expect(subject.parse).toBe(app.Car.prototype.parse);
        });
      });
    });

    describe('for hasMany', function() {
      var baseParseSpy;
      beforeEach(function() {
        baseParseSpy = spyOn(app.Car.prototype, 'parse').andCallThrough();
      });

      describe('when the association is defined with parse: true', function() {
        describe("with the default parse function", function() {
          var wheelsData, result;
          beforeEach(function() {
            app.Car.associations({hasMany: 'wheels', parse: true});
            subject = new app.Car({}, {extra: 'extra options'});
            spyOn(app.Wheels.prototype, 'add');
            wheelsData = [{id: 1}, {id: 2}];
            result = subject.parse({wheels: wheelsData});
          });

          it('should add to the child collection with its data from the response, passing parse: true downwards', function() {
            expect(app.Wheels.prototype.add).toHaveBeenCalledWith(wheelsData, {parse: true, extra: 'extra options'});
          });

          it("should remove the key from parse response", function() {
            expect(result.wheels).toBeUndefined();
          });
        });

        describe('when options.through', function() {
          var wheelsData;
          beforeEach(function() {
            wheelsData = [{id: 1, tire: {id: 3}}, {id: 2, tire: {id: 4}}];
          });

          describe('when it is a string', function() {
            beforeEach(function() {
              app.Wheel.belongsTo('tire');
              app.Car.hasMany('wheels', {parse: true}).hasMany('tires', {through: 'wheels', parse: true});
              subject = new app.Car({id: 1});
            });

            it('should use the string to parse the association', function() {
              subject.parse({wheels: wheelsData});
              expect(subject.tires().pluck('id')).toEqual([3, 4]);
            });
          });

          describe('when it is a function', function() {
            beforeEach(function() {
              app.Wheel.belongsTo('tire');
              app.Car.hasMany('wheels', {parse: true}).hasMany('tires', {through: function() { return 'wheels'; }, parse: true});
              subject = new app.Car({id: 1});
            });

            it('should use the result of that function to parse the association', function() {
              subject.parse({wheels: wheelsData});
              expect(subject.tires().pluck('id')).toEqual([3, 4]);
            });
          });

          describe('when options.parseName', function() {
            beforeEach(function() {
              app.Wheel.belongsTo('spareTire');
              app.Car.hasMany('wheels', {parse: true}).hasMany('spareTires', {through: 'wheels', parse: true, parseName: 'tire'});
              subject = new app.Car({id: 1});
            });

            it('should use it to find the association', function() {
              subject.parse({wheels: wheelsData});
              expect(subject.spareTires().pluck('id')).toEqual([3, 4]);
            });
          });
        });

        describe('when options.parseName', function() {
          var result;

          it('should use it to find the association', function() {
            app.Car.associations({hasMany: 'wheels', parse: true, parseName: 'wheelz'});
            subject = new app.Car();
            spyOn(app.Wheels.prototype, 'add');
            var wheelsData = [{id: 1}, {id: 2}];
            result = subject.parse({wheelz: wheelsData});
            expect(app.Wheels.prototype.add).toHaveBeenCalledWith(wheelsData, {parse: true});
          });

          it("should remove the key from parse response", function() {
            expect(result.wheelz).toBeUndefined();
          });
        });
      });

      describe('when the association is defined with parse as a function', function() {
        var associationParseSpy, associationParseResult = {water: ['H', 'O', 'H']};
        beforeEach(function() {
          associationParseSpy = jasmine.createSpy('association parse').andCallFake(function() { return associationParseResult; });
          app.Car.associations({hasMany: 'wheels', parse: associationParseSpy});
          subject = new app.Car();
        });

        it("should call the association's provided parse function", function() {
          var response = {foo: 'bar'};
          subject.parse(response);
          expect(associationParseSpy).toHaveBeenCalledWith(response);
        });
      });

      describe('when the association is defined with parse as falsy', function() {
        beforeEach(function() {
          app.Car.associations({hasMany: 'wheels', parse: false});
          subject = new app.Car();
        });

        it('should not modify the parse function', function() {
          expect(subject.parse).toBe(app.Car.prototype.parse);
        });
      });
    });
  });
});
