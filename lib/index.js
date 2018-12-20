var debug = require('debug')('loopback-component-migrate');
var loopback = require('loopback');
var migrationDef = require('./models/migration.json');

// Remove proerties that will confuse LB
function getSettings(def) {
  var settings = {};
  for (var s in def) {
    if (s === 'name' || s === 'properties') {
      continue;
    } else {
      settings[s] = def[s];
    }
  }
  return settings;
}

/**
 * @param {Object} app The app instance
 * @param {Object} options The options object
 */
module.exports = function(app, options) {
  var loopback = app.loopback;
  options = options || {};

  var dataSource = options.dataSource || 'db';
  if (typeof dataSource === 'string') {
    dataSource = app.dataSources[dataSource];
  }

  var migrationModelSettings = getSettings(migrationDef);

  if (typeof options.acls !== 'object') {
    migrationModelSettings.acls = [];
  } else {
    migrationModelSettings.acls = options.acls;
  }

  // Support for loopback 2.x.
  if (app.loopback.version.startsWith(2)) {
    Object.keys(migrationModelSettings.methods).forEach(key => {
      migrationModelSettings.methods[key].isStatic = true;
    });
  }

  debug('Creating Migration model using settings: %o', migrationModelSettings);
  var MigrationModel = dataSource.createModel(
    migrationDef.name,
    migrationDef.properties,
    migrationModelSettings);

  var Migration = require('./models/migration')(MigrationModel, options);

  app.model(Migration);

  var methods = [];
  if (options.enableRest === false) {
    methods = Migration.sharedClass.methods().map(x => `${x.isStatic ? '' : 'prototype.'}${x.name}`);
  } else if (Array.isArray(options.enableRest)) {
    methods = Migration.sharedClass.methods().map(x => x.name).filter(x => options.enableRest.indexOf(x) === -1);
  }

  debug('Disable remote methods: %o', methods);

  methods.forEach(methodName => {
    if (Migration.disableRemoteMethodByName) {
      // Loopback 3.x+
      Migration.disableRemoteMethodByName(methodName);
    } else {
      // Loopback 2.x
      Migration.disableRemoteMethod(methodName, !methodName.startsWith('prototype.'));
    }
  });
};
