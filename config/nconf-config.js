var path = require('path');
var configFile = path.join(__dirname, 'config.json');

function initNConf() {
  var nconf = require('nconf');

  nconf.add('file', { type: 'file', file: configFile });

  return nconf;
}

module.exports = initNConf();