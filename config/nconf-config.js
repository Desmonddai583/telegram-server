var path = require('path');
var configFile = path.join(__dirname, 'config.json');

function initNConf() {
  var nconf = require('nconf');

  nconf.use('file', { file: configFile });
  nconf.load();

  return nconf;
}

module.exports = initNConf();