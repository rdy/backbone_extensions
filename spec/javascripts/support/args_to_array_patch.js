(function(jasmine) {
  jasmine.util.argsToArray = function(args) {
    var arrayOfArgs = [];
    for (var i = 0; i < args.length; i++) arrayOfArgs.push(_(args[i]).clone());
    return arrayOfArgs;
  };
}).call(this, jasmine);

