#!/usr/bin/env rake
ENV['JASMINE_SPEC_FORMAT'] = 'Fuubar'
begin
  require 'bundler/setup'
rescue LoadError
  puts 'You must `gem install bundler` and `bundle install` to run rake tasks'
end

require 'yajl/json_gem'
Bundler::GemHelper.install_tasks

require 'jshint/tasks'

begin
  require 'jasmine'
  load 'jasmine/tasks/jasmine.rake'
rescue LoadError
  task :jasmine do
    abort 'Jasmine is not available. In order to run jasmine, you must: (sudo) gem install jasmine'
  end
end

JSHint.config_path = 'config/jshint.yml'
task :default => [:jshint, :'jasmine:ci']

