$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "backbone_extensions/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = 'backbone_extensions'
  s.version     = BackboneExtensions::VERSION
  s.authors     = ['Ryan Dy']
  s.email       = ['ryan.dy@gmail.com']
  s.homepage    = 'http://github.com/rdy/underscore_extensions'
  s.summary     = "TODO: Summary of BackboneExtensions."
  s.description = "TODO: Description of BackboneExtensions."

  s.files = Dir["{app,config,db,lib}/**/*"] + ["MIT-LICENSE", "Rakefile", "README.rdoc"]

  s.add_development_dependency 'fuubar'
  s.add_development_dependency 'jasmine', ">= 1.2.1"
  s.add_development_dependency 'jshint_on_rails'
  s.add_development_dependency 'thin'
  s.add_runtime_dependency 'rails', '>= 3.1'
end
