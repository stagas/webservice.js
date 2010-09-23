var webservice = require('./lib/webservice'),
    demoModule = require('./demoModule'),
    fs         = require('fs'),
    sys        = require('sys'),
    asciimo    = require('asciimo').Figlet,  
    assert     = require('assert');

var common = {
  'json': function(args, input, callback) {
    callback( { 'Content-Type': 'application/json' }, JSON.stringify(input))
  },
  'txt': function(args, input, callback) {
    callback( { 'Content-Type': 'text/plain' }, ( ( typeof input === 'string' ) ? input : sys.inspect(input) ) )
  },  
  'html': function(args, input, callback) {
    callback( { 'Content-Type': 'text/html' }, 
      '<html><body><h1>Output:</h1><pre>'
      + ( ( typeof input === 'string' ) ? input : sys.inspect(input) )
      + '</pre></body></html>'
    )
  }
}

webservice.createServer({
  'demoModule': {
    module: demoModule,
    views: common,
    async: true
  },
  'asciimo': {
    module: asciimo,
    views: common
  },
  'fs': {
    module: fs,
    views: common
    // async is default
  },
  'sys': {
    module: sys,
    views: common,
    sync: true
  }
}).listen(8080);


