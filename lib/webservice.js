/* webservice.js - Marak Squires 2010 */

var webservice = exports,
sys = require('sys'),
meryl = require('meryl'),
http = require('http');

exports.createServer = function( modules ){
  
  meryl.x('responseFormat', 'html')
       .x('returnValue', 2)
  
  meryl.p('*', function(chain) {
    if (matchEnd(this.params.pathname, '.json')) {
      this.responseFormat = 'json';
      this.params.pathname = removeEnd(this.params.pathname, '.json')
    }
    if (matchEnd(this.params.pathname, '.html')) {
      this.responseFormat = 'html';
      this.params.pathname = removeEnd(this.params.pathname, '.html')
    }
    if (matchEnd(this.params.pathname, '.txt')) {
      this.responseFormat = 'txt';
      this.params.pathname = removeEnd(this.params.pathname, '.txt')
    }
    chain();
  });
  
  // establish a default route at the root level that will create links
  meryl.h('GET /', function() {
    var html = '';
    for(var module in modules){
      html += renderDocs(module, modules[module].module);
    }
    this.send(html);
  });
     
  /*
      map.get('/version').bind(function (res) {
          res.send(200, {'Content-Type': 'text/html'}, { version: journey.version.join('.') });
      });
    */  
      // iterate through each module
  for(var module in modules){

    // create a a home page / documentation page for each module
    (function(module){
      meryl.h('GET /' + module, function() { 
        var html = '';
        html += '<h1><a href = "/">/home</a></h1>';
        html += renderDocs(module, modules[module].module);
        this.send(html);
      }); 
    })(module);
    
    // iterate through each top-level method in the module and created a route for it in journey
    for(var m in modules[module].module){
      var mm = modules[module].module;
      (function(m, mm, module){
        meryl.h('GET /' + module + '/' + m + '(/<resource>)?', function () {
          var self = this;
          
          var async = (typeof modules[module].async != 'undefined') ? modules[module].async : true,
              args = [],
              resource = [];

          if (this.params.resource) {
            resource = this.params.resource.split('/');
          }
          
          if (typeof modules[module].sync != 'undefined') async = !modules[module].sync;
          
          var arg = '';
          while(arg = resource.shift()) {
            if (arg === 'async') {
              async = true;
            } 
            else if (arg === 'sync') {
              async = false;
            }
            else if (arg === 'format') {
              this.responseFormat = resource.shift()
            }
            else if (arg === 'return') {
              this.returnValue = resource.shift()
            }            
            else {
              args.push(decodeURIComponent(arg));
            }
          }
        
          // lets check if the last argument is a function (as a string)
          // if it is, lets coherse it into a function and assume its a callback!
          
          /*try{
            var e = 'var fn = ' + args[args.length-1] + ';';
            eval(e); // this could be done better
            if(typeof fn == 'function'){
              args[args.length-1] = res;
              args.push(fn);
              async = true;
            }
          }
          catch(err){
          }*/

          if(async){

            args.push(function() {
              var returned = Array.prototype.slice.call(arguments);
              modules[module].views[self.responseFormat](args, returned[self.returnValue - 1], function(type, body) {
                self.headers['Content-Type'] = type;
                self.send(body);
              })
            })

            // invoke the api method
            mm[m].apply(this, args);
            
          }
          else {

            modules[module].views[self.responseFormat](args, mm[m].apply(this, args), function(type, body) {
              self.send(body);
            })
           
          }

        });
      })(m, mm, module);
    }
  }

  var server = http.createServer(
    meryl.cgi({debug:true})
  )

  console.log(' > json webservice started on port 8080');  
  return server;
};

function matchEnd( string, match ) {
  var stringLength = string.length,
      matchLength = match.length;
      
  if (stringLength >= matchLength) {
    var end = string.substr(stringLength - matchLength);
    if (end === match) return true
  }
  
  return false
}

function removeEnd( string, match ) {
  var stringLength = string.length,
      matchLength = match.length;
      
  if (stringLength >= matchLength) {
    var end = string.substr(stringLength - matchLength);
    if (end === match) return string.substr(0, stringLength - matchLength)
  }
  
  return string
}

function renderDocs( name, module ) {
  
  var html = '';
  
  html += '<h2><a href="/'+name+'">/' + name + '</a></h2>';
  html += ('<ul>');

  // iterate through each top-level method in the module and created a link
  for(var method in module){
    html += ('<li><a href="'+name+'/'+ method +'">' + '/' + method + '</a></li>');
  }

  html += ('</ul>');

  return html;

}