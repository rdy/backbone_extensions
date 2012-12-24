describe('associations', function () {
  var subject, app;
  beforeEach(function () {
    app = {
      Car: Backbone.Model.extend({}, Backbone.extensions.include),
      Cars: Backbone.Collection.extend({}, Backbone.extensions.include),
      Wheels: Backbone.Collection.extend({}, Backbone.extensions.include),
      SpareWheels: Backbone.Collection.extend({}, Backbone.extensions.include),
      Wheel: Backbone.Model.extend({}, Backbone.extensions.include),
      Engine: Backbone.Model.extend({}, Backbone.extensions.include),
      SpareEngine: Backbone.Model.extend({}, Backbone.extensions.include)
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

  describe('.associations', function () {
    describe('when called with belongsTo', function () {
      var prius;
      beforeEach(function () {
        app.Wheel.associations({belongsTo: 'car'});
      });

      it('should define a function for the association', function () {
        subject = new app.Wheel({id: 1});
        expect(_(subject.car).isFunction()).toBe(true);
      });

      describe('the association function', function () {
        describe("when the model is initialized without the association's key", function () {
          describe('when options.through', function() {
            var body;
            describe('when it is a string', function() {
              beforeEach(function() {
                app.Wheel.associations({belongsTo: 'body'}, {belongsTo: 'car', through: 'body'});

                body = jasmine.createSpyObj('body', ['car']);
                body.car.andReturn('mockCar');

                subject = new app.Wheel({id: 1}, {body: function() { return body; }});
              });

              it('should use the string called on instance to return the association', function() {
                expect(subject.car()).toEqual(body.car());
              });
            });
            describe('when it is a function', function() {
              beforeEach(function() {
                app.Wheel.associations({belongsTo: 'body'}, {belongsTo: 'car', through: function() { return this.body(); } });

                body = jasmine.createSpyObj('body', ['car']);
                body.car.andReturn('mockCar');

                subject = new app.Wheel({id: 1}, {body: function() { return body; }});
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
                app.Wheels.associations({belongsTo: 'car'});
                prius = new app.Car({id: 1});
                subject = new app.Wheel({id: 1});
              });

              describe('when the collection has the association', function() {
                beforeEach(function () {
                  expect(subject.collection).toBeUndefined();
                  collection = new app.Wheels([subject], {car: function() { return prius; }});
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
            subject = new app.Wheel({id: 1}, {car: function() { return prius; }});
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

    describe('when called with hasMany', function () {
      var rims;
      beforeEach(function () {
        app.Car.associations({hasMany: 'wheels'});
      });

      describe('the association function', function () {
        describe("when the model is initialized without the association's key", function () {
          beforeEach(function() {
            subject = new app.Car({id: 1});
          });

          describe('when options.class', function() {
            describe('when it is provided', function() {
              beforeEach(function() {
                app.Car.associations({hasMany: 'wheels', 'class': app.SpareWheels, foo: 'bar'});
                subject = new app.Car({id: 1}, {parse: true});
              });

              it('should return a new instance of the child collection with that class', function () {
                expect(subject.wheels() instanceof app.SpareWheels).toBe(true);
              });
            });

            describe('when it is not provided', function() {
              beforeEach(function () {
                app.Car.associations({hasMany: 'wheels'});
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
                app.Car.associations({hasMany: 'wheels', className: 'SpareWheels', foo: 'bar'});
                subject = new app.Car({id: 1}, {parse: true});
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
                app.Car.associations({hasMany: 'wheels'});
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
            subject = new app.Car({id: 1}, {wheels: function() { return rims; }});
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

    describe('when called with hasOne', function () {
      var v6;
      beforeEach(function () {
        app.Car.associations({hasOne: 'engine'});
      });

      describe('the association function', function () {
        describe("when the model is initialized without the association's key", function () {
          describe('when options.through', function() {
            var engineBlock;
            describe('when it is a string', function() {
              beforeEach(function() {
                app.Wheel.associations({belongsTo: 'engineBlock'}, {hasOne: 'car', through: 'engineBlock'});

                engineBlock = jasmine.createSpyObj('engineBlock', ['car']);
                engineBlock.car.andReturn('mockCar');

                subject = new app.Wheel({id: 1}, {engineBlock: function() { return engineBlock; }});
              });

              it('should use the string called on instance to return the association', function() {
                expect(subject.car()).toEqual(engineBlock.car());
              });
            });
            describe('when it is a function', function() {
              beforeEach(function() {
                app.Wheel.associations({belongsTo: 'engineBlock'}, {hasOne: 'car', through: function() { return this.engineBlock(); } });

                engineBlock = jasmine.createSpyObj('engineBlock', ['car']);
                engineBlock.car.andReturn('mockCar');

                subject = new app.Wheel({id: 1}, {engineBlock: function() { return engineBlock; }});
              });

              it('should use that function called on the instance to return the association', function() {
                expect(subject.car()).toEqual(engineBlock.car());
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
                app.Car.associations({hasOne: 'engine', 'class': app.SpareEngine, foo: 'bar'});
                subject = new app.Car({id: 1}, {parse: true});
              });

              it('should return a new instance of the child model with that class', function () {
                expect(subject.engine() instanceof app.SpareEngine).toBe(true);
              });

              it("should initialize the new instance of the child collection with the parent's options, without the class option", function() {
                expect(subject.engine()).toBeDefined();
                expect(app.SpareEngine.prototype.initialize).toHaveBeenCalledWith({}, {parse: true, foo: 'bar'});
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
                app.Car.associations({hasOne: 'engine', className: 'SpareEngine', foo: 'bar'});
                subject = new app.Car({id: 1}, {parse: true});
              });

              it('should return a new instance of the child collection with that class', function () {
                expect(subject.engine() instanceof app.SpareEngine).toBe(true);
              });

              it("should initialize the new instance of the child collection with the parent's options, without the className option", function() {
                expect(subject.engine()).toBeDefined();
                expect(app.SpareEngine.prototype.initialize).toHaveBeenCalledWith({}, {parse: true, foo: 'bar'});
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
              app.Cars.associations({hasOne: 'engine'});
              engine = new app.Engine({id: 1});
              subject = new app.Car({id: 1});
            });
            describe('when it has a parent collection', function() {
              var collection;

              describe('when the collection has the association', function() {
                beforeEach(function () {
                  expect(subject.collection).toBeUndefined();
                  collection = new app.Cars([subject], {engine: function() { return engine; }});
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
            subject = new app.Car({id: 1}, {engine: function() { return v6; }});
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
  });

  describe('.extend', function() {
    it('should call associations withe the provided associations', function() {
      spyOn(app.Car, 'associations');
      var Klass = app.Car.extend({associations: {hasOne: 'engine'}});
      expect(app.Car.associations).toHaveBeenCalledWith({hasOne: 'engine'});
      Klass = app.Car.extend({associations: [{hasOne: 'engine'}, {hasMany: 'wheels'}]});
      expect(app.Car.associations).toHaveBeenCalledWith([{hasOne: 'engine'}, {hasMany: 'wheels'}]);
    });
  });

  describe('#parse', function() {
    describe('for hasOne', function() {
      var baseParseSpy;
      beforeEach(function() {
        baseParseSpy = spyOn(app.Car.prototype, 'parse').andCallThrough();
      });

      describe('when the association is defined with parse: true', function() {
        var changeSpy;
        beforeEach(function() {
          app.Car.associations({hasOne: 'engine', className: 'SpareEngine', parse: true});
          subject = new app.Car();
          spyOn(app.SpareEngine.prototype, 'clear').andCallThrough();
          spyOn(app.SpareEngine.prototype, 'set').andCallThrough();
          changeSpy = jasmine.createSpy('change');
          subject.engine().on('change', changeSpy);
        });

        it("should replace the child object's attributes with the association's data from the response, passing parse: true downwards", function() {
          var engineData = {cylinders: 6, manufacturer: 'toyota'};
          subject.parse({spare_engine: engineData});
          expect(app.SpareEngine.prototype.clear).toHaveBeenCalled();
          expect(_(app.SpareEngine.prototype.clear.mostRecentCall.args[0]).pick('silent')).toEqual({silent: true});
          expect(app.SpareEngine.prototype.set).toHaveBeenCalled();
          expect(app.SpareEngine.prototype.set.mostRecentCall.args[0]).toEqual(engineData);
          expect(_(app.SpareEngine.prototype.set.mostRecentCall.args[1]).pick('parse')).toEqual({parse: true});
          expect(changeSpy).toHaveBeenCalled();
        });

        it("should call the object's normal parse function", function() {
          subject.parse({engine: {cylinders: 6}, foo: 'bar', cow: ['moo']});
          expect(baseParseSpy).toHaveBeenCalledWith({engine : { cylinders : 6 }, foo: 'bar', cow: ['moo']});
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
        beforeEach(function() {
          app.Car.associations({hasMany: 'wheels', parse: true});
          subject = new app.Car();
          spyOn(app.Wheels.prototype, 'add');
        });

        it('should add to the child collection with its data from the response, passing parse: true downwards', function() {
          var wheelsData = [{id: 1}, {id: 2}];
          subject.parse({wheels: wheelsData});
          expect(app.Wheels.prototype.add).toHaveBeenCalledWith(wheelsData, {parse: true});
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
