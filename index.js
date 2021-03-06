#!/usr/bin/env node
'use strict';

var Shrinkwrap = require('shrinkwrap')
  , licenses = require('licenses')
  , argh = require('argh').argv
  , path = require('path')
  , fs = require('fs');

argh.package = argh.package || path.join(process.cwd(), 'package.json');
argh.registry = argh.registry || 'http://registry.npmjs.org/';

//
// Invalid arguments, output help
//
if (!fs.existsSync(argh.package) && !argh.name || argh.help) {
  console.log();
  console.log('  licensing [flags]');
  console.log();
  console.log('  --package [dir]    : The location of the package.json to use');
  console.log('  --registry [url]   : The registry we should use to resolve packages');
  console.log('  --name [name]      : Discover the footprint of a module instead');
  console.log('  --devDependencies  : Also include all devDependencies');
  console.log('  --help             : Display this message');
  console.log('');
  console.log('example:');
  console.log('  licensing --name primus');
  console.log();
  process.exit(1);
}

//
// Setup our shrinkwrap module so we can spider all dependencies.
//
var shrinkwrap = new Shrinkwrap({
  registry: argh.registry,
  production: !argh.devDependencies
});

console.log('');
console.log('Resolving dependencies, this might take a while');
console.log('');

if (argh.name) licenses(argh.name, function (err, licenses) {
  if (err) {
    console.log('');
    console.log('Failed to correctly resolve the licensing information');
    console.log('Received the following error:');
    console.log('');
    console.log('  ', err.message);
    console.log('');
    return process.exit(1);
  }

  console.log(argh.name, 'is licensed as:', (licenses || []).join(','));
  console.log('');

  shrinkwrap.get(argh.name, next);
}); else shrinkwrap.resolve(require(argh.package), next);

/**
 * Output the results.
 *
 * @param {Error} err A critical error has occured, we couldn't continue
 * @param {Object} dependend all the sub dependencies.
 * @api private
 */
function next(err, dependend) {
  if (err) {
    console.log('Failed to correctly resolve the licensing information');
    console.log('Received the following error:');
    console.log('');
    console.log('  ', err.message);
    console.log('');
    return process.exit(1);
  }

  var keys = Object.keys(dependend);

  if (keys.length) {
    console.log('Licenses information:');
    console.log('');
  }

  //
  // Output licensing information.
  //
  keys.forEach(function each(key) {
    var pkg = dependend[key]
      , padding = (new Array(50)).join(' ').slice(key.length);

    console.log(key + padding +': '+ (
      dependend[key].licenses
      ?  dependend[key].licenses.join(', ')
      : 'No license detected'
    ));
  });

  console.log('');
  console.log('Found a module that is incorrectly or not detected at all but does');
  console.log('have a valid license? Please report this at:');
  console.log('');
  console.log('https://github.com/3rd-Eden/licenses/issues/new');
  console.log('');
  console.log('Which is the library that does the actual parsing and detection of');
  console.log('the license so we can improve it\'s parsing algorithm and yield');
  console.log('better results.');
  console.log('');
}
