function initNConf() {
  var nconf = require('nconf');

  nconf.use('file', { file: './config.json' });
  nconf.load();

  return nconf;
}

module.exports = initNConf();