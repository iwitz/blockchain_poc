var winston = require('winston');
// enable timestamps when logging
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp':true});
winston.add(winston.transports.File, {
  name: 'all_log',
  filename:  'info.log',
  timestamp: true,
  json: false
});


module.exports = function(){
  this.log = function(error, level="info"){
    winston.log(level, error);
  }
  return this;
}
