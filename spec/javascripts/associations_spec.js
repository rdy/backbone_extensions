describe("Associations", function () {
  var subject, app;
  beforeEach(function () {
    app = {
      Car: Backbone.Model.extend({}, Backbone.include),
      Wheels: Backbone.Collection.extend({}, Backbone.include),
      SpareWheels: Backbone.Collection.extend({}, Backbone.include),
      Wheel: Backbone.Model.extend({}, Backbone.include),
      Engine: Backbone.Model.extend({}, Backbone.include),
      SpareEngine: Backbone.Model.extend({}, Backbone.include)
    };

    _(app).chain().values().invoke('include', Backbone.associations(app));
  });

  it("should be an includeable module", function () {
    expect(_(Backbone.associations).isFunction()).toBe(true);
    expect(_(Backbone.associations().included).isObject()).toBe(true);
  });

  describe("when the model is initialized", function () {
    var associationsSpy;
    beforeEach(function () {
      app.Car.prototype.associations = associationsSpy = jasmine.createSpy('associations');
      subject = new app.Car({some: 'attrs'}, {some: 'options'});
    });

    it("should call #associations", function () {
      expect(associationsSpy).toHaveBeenCalledWith({some: 'attrs'}, {some: 'options'});
    });

    it("should not pollute the object's prototype with association functions", function() {
      expect(subject.belongsTo).toBeUndefined();
      expect(subject.hasMany).toBeUndefined();
      expect(subject.hasOne).toBeUndefined();
    });

    describe("#value", function() {
      it("should return the instance of the object being initialized", function() {
        associationsSpy.reset();
        associationsSpy.andCallFake(function() {
          expect(this.value() instanceof app.Car).toBe(true);
        });
        subject = new app.Car();
        expect(associationsSpy).toHaveBeenCalled();
      });
    });
  });

  describe("defining associations", function () {
    describe("#belongsTo", function () {
      var prius;
      beforeEach(function () {
        app.Wheel.prototype.associations = function(attrs, options) {
          this.belongsTo('car', options);
        };
      });

      it("should return the associations proxy so association definition can be chained", function() {
        var associationsSpy = jasmine.createSpy('associations').andCallFake(function(attrs, options) {
          expect(this.belongsTo('car', options)).toBe(this);
        });
        app.Wheel.prototype.associations = associationsSpy;
        subject = new app.Wheel({id: 1});
        expect(associationsSpy).toHaveBeenCalled();
      });

      it("should define a function for the association", function () {
        subject = new app.Wheel({id: 1});
        expect(_(subject.car).isFunction()).toBe(true);
      });

      describe("the association function", function () {
        describe("when the model is initialized without the association's key", function () {
          describe("when the model has a parent collection", function() {
            var collection;
            beforeEach(function() {
              app.Wheels.prototype.associations = function(models, options) {
                this.belongsTo('car', options);
              };
              prius = new app.Car({id: 1});
              subject = new app.Wheel({id: 1});
            });

            describe("when the collection has the association", function() {
              beforeEach(function () {
                expect(subject.collection).toBeUndefined();
                collection = new app.Wheels([subject], {car: prius});
              });

              it("should return the collection's instance of the association at runtime, not definition time", function() {
                expect(collection.car()).toBe(prius);
                expect(subject.car()).toBe(collection.car());
              });
            });

            describe("when the collection doesn't have the association", function() {
              beforeEach(function () {
                collection = new app.Wheels([subject]);
              });

              it("should return undefined", function() {
                expect(subject.car()).toBeUndefined();
              });
            });
          });

          describe("when the model doesn't have a parent collection", function() {
            beforeEach(function () {
              subject = new app.Wheel({id: 1});
              expect(subject.car()).toBeUndefined();
            });
  
            it("should return undefined", function () {
              expect(subject.car()).toBeUndefined();
            });
          });
        });

        describe("when the model is initialized with an instance of the associated object", function () {
          beforeEach(function () {
            prius = new app.Car({id: 1});
            subject = new app.Wheel({id: 1}, {car: prius});
          });

          it("should return the instance of the object", function () {
            expect(subject.car()).toBe(prius);
          });
        });

        describe("when the model is initialized with a function", function () {
          var priusFunc;
          beforeEach(function () {
            var prius = new app.Car({id: 1});
            priusFunc = function() { return prius; };
            subject = new app.Wheel({id: 1}, {car: priusFunc});
          });

          it("should be that function", function () {
            expect(subject.car).toBe(priusFunc);
          });
        });
      });
    });

    describe("#hasMany", function () {
      var rims;
      beforeEach(function () {
        app.Car.prototype.associations = function(models, options) {
          this.hasMany('wheels', options);
        }
      });

      it("should return the associations proxy so association definition can be chained", function() {
        var associationsSpy = jasmine.createSpy('associations').andCallFake(function(attrs, options) {
          expect(this.hasMany('wheels', options)).toBe(this);
        });
        app.Car.prototype.associations = associationsSpy;
        subject = new app.Car({id: 1});
        expect(associationsSpy).toHaveBeenCalled();
      });

      describe("the association function", function () {
        describe("when the model is initialized without the association's key", function () {
          beforeEach(function () {
            subject = new app.Car({id: 1});
          });

          describe("when options.klass is provided", function() {
            beforeEach(function() {
              app.Car.prototype.associations = function(models, options) {
                this.hasMany('wheels', {klass: app.SpareWheels});
              };
              subject = new app.Car({id: 1});
            });

            it("should return a new instance of the child collection with that class", function () {
              expect(subject.wheels() instanceof app.SpareWheels).toBe(true);
            });
          });

          describe("when options.klass is not provided", function() {
            it("should return a new instance of the child collection by inferring the class name from the given name and fetching the constructor from the provided namespace", function () {
              expect(subject.wheels() instanceof app.Wheels).toBe(true);
            });
          });
        });

        describe("when the model is initialized with an instance of the associated object", function () {
          beforeEach(function () {
            rims = new app.Wheels([]);
            subject = new app.Car({id: 1}, {wheels: rims});
          });

          it("should return the instance of the object", function () {
            expect(subject.wheels()).toBe(rims);
          });
        });

        describe("when the model is initialized with a function", function () {
          var rimsFunc;
          beforeEach(function () {
            var rims = new app.Wheels([]);
            rimsFunc = function() { return rims; };
            subject = new app.Car({id: 1}, {wheels: rimsFunc});
          });

          it("should be that function", function () {
            expect(subject.wheels).toBe(rimsFunc);
          });
        });
      });
    });

    describe("#hasOne", function () {
      var v6;
      beforeEach(function () {
        app.Car.prototype.associations = function(models, options) {
          this.hasOne('engine', options);
        }
      });

      it("should return the associations proxy so association definition can be chained", function() {
        var associationsSpy = jasmine.createSpy('associations').andCallFake(function(attrs, options) {
          expect(this.hasOne('engine', options)).toBe(this);
        });
        app.Car.prototype.associations = associationsSpy;
        subject = new app.Car({id: 1});
        expect(associationsSpy).toHaveBeenCalled();
      });

      describe("the association function", function () {
        describe("when the model is initialized without the association's key", function () {
          beforeEach(function () {
            subject = new app.Car({id: 1});
          });

          describe("when options.klass is provided", function() {
            beforeEach(function() {
              app.Car.prototype.associations = function(models, options) {
                this.hasOne('engine', {klass: app.SpareEngine});
              };
              subject = new app.Car({id: 1});
            });

            it("should return a new instance of the child model with that class", function () {
              expect(subject.engine() instanceof app.SpareEngine).toBe(true);
            });
          });

          describe("when options.klass is not provided", function() {
            it("should return a new instance of the child model by inferring the class name from the given name and fetching the constructor from the provided namespace", function () {
              expect(subject.engine() instanceof app.Engine).toBe(true);
            });
          });
        });

        describe("when the model is initialized with an instance of the associated object", function () {
          beforeEach(function () {
            v6 = new app.Engine([]);
            subject = new app.Car({id: 1}, {engine: v6});
          });

          it("should return the instance of the object", function () {
            expect(subject.engine()).toBe(v6);
          });
        });

        describe("when the model is initialized with a function", function () {
          var v6Func;
          beforeEach(function () {
            var v6 = new app.Engine({});
            v6Func = function() { return v6; };
            subject = new app.Car({id: 1}, {engine: v6Func});
          });

          it("should be that function", function () {
            expect(subject.engine).toBe(v6Func);
          });
        });
      });
    });
  });

  describe("augmenting #parse", function() {
    describe("for hasOne", function() {
      var baseParseSpy;
      beforeEach(function() {
        baseParseSpy = spyOn(app.Car.prototype, 'parse').andCallThrough();
      });

      describe("when the association is defined with parse: true", function() {
        beforeEach(function() {
          app.Car.prototype.associations = function() {
            this.hasOne('engine', {parse: true});
          };
          subject = new app.Car();
          spyOn(app.Engine.prototype, 'clear');
          spyOn(app.Engine.prototype, 'set');
          spyOn(app.Engine.prototype, 'change');
        });

        describe("#parse", function() {
          it("should replace the child object's attributes with the association's data from the response", function() {
            var engineData = {cylinders: 6, manufacturer: 'toyota'};
            subject.parse({engine: engineData});
            expect(app.Engine.prototype.clear).toHaveBeenCalledWith({silent: true});
            expect(app.Engine.prototype.set).toHaveBeenCalledWith(engineData, {silent: true});
            expect(app.Engine.prototype.change).toHaveBeenCalled();
          });

          it("should remove the association's key from the response and call the object's normal parse function", function() {
            subject.parse({engine: {cylinders: 6}, foo: 'bar', cow: ['moo']});
            expect(baseParseSpy).toHaveBeenCalledWith({foo: 'bar', cow: ['moo']});
          });
        });
      });

      describe("when the association is defined with parse as a function", function() {
        var associationParseSpy, associationParseResult = {water: ['H', 'O', 'H']};
        beforeEach(function() {
          associationParseSpy = jasmine.createSpy('association parse').andCallFake(function() { return associationParseResult; });
          app.Car.prototype.associations = function() {
            this.hasOne('engine', {parse: associationParseSpy});
          };
          subject = new app.Car();
        });

        describe("#parse", function() {
          it("should call the association's provided parse function", function() {
            var response = {foo: 'bar'};
            subject.parse(response);
            expect(associationParseSpy).toHaveBeenCalledWith(response);
          });

          it("should call the object's normal parse function", function() {
            subject.parse({engine: {cylinders: 6}, foo: 'bar', cow: ['moo']});
            expect(baseParseSpy).toHaveBeenCalledWith(associationParseResult);
          });
        });
      });

      describe("when the association is defined with parse as falsy", function() {
        beforeEach(function() {
          app.Car.prototype.associations = function() {
            this.hasOne('engine', {parse: false});
          };
          subject = new app.Car();
        });

        it("should not modify the parse function", function() {
          expect(subject.parse).toBe(app.Car.prototype.parse);
        });
      });
    });

    describe("for hasMany", function() {
      var baseParseSpy;
      beforeEach(function() {
        baseParseSpy = spyOn(app.Car.prototype, 'parse').andCallThrough();
      });

      describe("when the association is defined with parse: true", function() {
        beforeEach(function() {
          app.Car.prototype.associations = function() {
            this.hasMany('wheels', {parse: true});
          };
          subject = new app.Car();
          spyOn(app.Wheels.prototype, 'reset');
        });

        describe("#parse", function() {
          it("should reset the child collection with its data from the response", function() {
            var wheelsData = [{id: 1}, {id: 2}];
            subject.parse({wheels: wheelsData});
            expect(app.Wheels.prototype.reset).toHaveBeenCalledWith(wheelsData);
          });

          it("should remove the association's key from the response and call the object's normal parse function", function() {
            subject.parse({wheels: [1,2,3], foo: 'bar', cow: ['moo']});
            expect(baseParseSpy).toHaveBeenCalledWith({foo: 'bar', cow: ['moo']});
          });
        });
      });

      describe("when the association is defined with parse as a function", function() {
        var associationParseSpy, associationParseResult = {water: ['H', 'O', 'H']};
        beforeEach(function() {
          associationParseSpy = jasmine.createSpy('association parse').andCallFake(function() { return associationParseResult; });
          app.Car.prototype.associations = function() {
            this.hasMany('wheels', {parse: associationParseSpy});
          };
          subject = new app.Car();
        });

        describe("#parse", function() {
          it("should call the association's provided parse function", function() {
            var response = {foo: 'bar'};
            subject.parse(response);
            expect(associationParseSpy).toHaveBeenCalledWith(response);
          });

          it("should call the object's normal parse function", function() {
            subject.parse({wheels: [1,2,3], foo: 'bar', cow: ['moo']});
            expect(baseParseSpy).toHaveBeenCalledWith(associationParseResult);
          });
        });
      });

      describe("when the association is defined with parse as falsy", function() {
        beforeEach(function() {
          app.Car.prototype.associations = function() {
            this.hasMany('wheels', {parse: false});
          };
          subject = new app.Car();
        });

        it("should not modify the parse function", function() {
          expect(subject.parse).toBe(app.Car.prototype.parse);
        });
      });
    });
  });
});
