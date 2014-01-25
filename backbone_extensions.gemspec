$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "backbone_extensions/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = 'backbone_extensions'
  s.version     = BackboneExtensions::VERSION
  s.authors     = ['Ryan Dy', 'Thomas Bukowski']
  s.email       = ['ryan.dy@gmail.com', 'me@neodude.net']
  s.homepage    = 'http://github.com/rdy/underscore_extensions'
  s.summary     = %q{Extensions to backbone javascript library as a rails engine}
  s.description = %q{Adds extensions to the backbone javascript library. It adds the javascript as a rails engine to be included in to a Rails 3+ project. To use it make sure require underscore, backbone and the extensions you need.}

  s.files = Dir["{app,config,db,lib}/**/*"] + ["MIT-LICENSE", "Rakefile", "README.markdown"]

  s.add_development_dependency 'fuubar'
  s.add_development_dependency 'jasmine', ">= 2.0.0"
  s.add_development_dependency 'jshint_on_rails'
  s.add_development_dependency 'thin'
  s.add_development_dependency 'yajl-ruby'
  s.add_runtime_dependency 'rails', '>= 3.1'
end
