describe("Associations", function () {
  it("should be an includeable module", function () {
    expect(_(Backbone.associations).isFunction()).toBe(true);
    expect(_(Backbone.associations().included).isObject()).toBe(true);
  });

  describe("when the model is initialized", function () {
    var subject, namespace, associationsSpy;

    beforeEach(function () {
      associationsSpy = jasmine.createSpy('associations');

      var Klass = Backbone.Model.extend({
        associations: associationsSpy
      }, Backbone.include);
      namespace = {Klass: Klass};
      namespace.Klass.include(Backbone.associations(namespace));

      subject = new namespace.Klass({some: 'attrs'}, {some: 'options'});
    });

    it("should call #associations", function () {
      expect(associationsSpy).toHaveBeenCalledWith({some: 'attrs'}, {some: 'options'});
    });

    it("should not pollute the object's prototype with association functions", function() {
      expect(subject.belongsTo).toBeUndefined();
      expect(subject.hasMany).toBeUndefined();
      expect(subject.hasOne).toBeUndefined();
    });
  });

  describe("defining associations", function () {
    var app, subject;
    beforeEach(function () {
      app = {
        Car: Backbone.Model.extend({}, Backbone.include),
        Wheels: Backbone.Collection.extend({}, Backbone.include),
        Wheel: Backbone.Model.extend({}, Backbone.include),
        Engine: Backbone.Model.extend({}, Backbone.include)
      };

      app.Car.include(Backbone.associations(app));
      app.Wheels.include(Backbone.associations(app));
      app.Wheel.include(Backbone.associations(app));
      app.Engine.include(Backbone.associations(app));
    });

    describe("#belongsTo", function () {
      var prius;
      beforeEach(function () {
        app.Wheel.prototype.associations = function(attrs, options) {
          this.belongsTo('car', options);
        };
      });

      it("should define a function for the association", function () {
        subject = new app.Wheel({id: 1});
        expect(_(subject.car).isFunction()).toBe(true);
      });

      describe("the association function", function () {
        describe("when the model is initialized without the association's key", function () {
          beforeEach(function () {
            subject = new app.Wheel({id: 1});
          });

          it("should return undefined", function () {
            expect(subject.car()).toBeUndefined();
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

      describe("the association function", function () {
        describe("when the model is initialized without the association's key", function () {
          beforeEach(function () {
            subject = new app.Car({id: 1});
          });

          it("should return a new instance of the child collection by fetching the constructor from the provided namespace", function () {
            expect(subject.wheels() instanceof app.Wheels).toBe(true);
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

      describe("the association function", function () {
        describe("when the model is initialized without the association's key", function () {
          beforeEach(function () {
            subject = new app.Car({id: 1});
          });

          it("should return a new instance of the child model by fetching the constructor from the provided namespace", function () {
            expect(subject.engine() instanceof app.Engine).toBe(true);
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
});
