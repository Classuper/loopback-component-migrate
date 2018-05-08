var debug = require('debug')('loopback-component-migrate');

module.exports = function autoupdate(ds) {
  const models = ['Migration'];

  return new Promise(function(resolve, reject) {
    debug('checking if database changes are required');

    ds.isActual(models, function(err, isActual) {
      if (err) return reject(err);
      if (isActual) {
        debug('data source and database is in sync');
        return resolve();
      }

      debug('syncing data source and database');

      if (ds.connected) {
        ds.autoupdate(models).then(resolve).catch(reject);
      } else {
        ds.once('connected', () => {
          ds.autoupdate(models).then(resolve).catch(reject);
        });
      }
    });
  });
};
