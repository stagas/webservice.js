/* webservice.js - Marak Squires 2010 */

var webservice = exports,
sys = require('sys'),
eyes = require('eyes'),
journey = require('journey'),
http = require('http');

exports.createServer = function( modules ){
  
  // Create a Router object with an associated routing table
  var router = new(journey.Router)(function (map) {

    // establish a default route at the root level that will create links
    map.root.bind(function (res) { 
      var html = '';
      for(var module in modules){
        html += renderDocs(module, modules[module].module);
      }
      res.send(200, {'Content-Type': 'text/html'}, html);
    }); 

    map.get('/version').bind(function (res) {
        res.send(200, {'Content-Type': 'text/html'}, { version: journey.version.join('.') });
    });
    
    // iterate through each module
    for(var module in modules){

      // create a a home page / documentation page for each module
      (function(module){
        map.get('/' + module).bind(function (res, data) { 
          var html = '';
          html += '<h1><a href = "/">/home</a></h1>';
          html += renderDocs(module, modules[module].module);
          res.send(200, {'Content-Type': 'text/html'}, html);
        }); 
      })(module);
      
      // iterate through each top-level method in the module and created a route for it in journey
      for(var m in modules[module].module){
        var mm = modules[module].module;
        (function(m, mm, module){
          //console.log('/' + module + '/' + m);
          map.get('/' + module + '/' + m).bind(function (res, resource, method, id, params) {
            //console.log(sys.inspect(res))
            var async = (typeof modules[module].async != 'undefined') ? modules[module].async : true,
                responseFormat = 'html',
                args = [];

            if (typeof modules[module].sync != 'undefined') async = !modules[module].sync;
            
            for(var p in resource){
              if (p === 'async') {
                async = (resource[p] === 'true') ? true : false;
              } 
              else if (p === 'sync') {
                async = (resource[p] === 'false') ? true : false;
              }
              else if (p === 'format') {  
                switch (resource[p]) {
                  case 'json':
                    responseFormat = 'json';
                    break;
                  default:
                    responseFormat = 'html';
                }
              }
              else {
                args.push(resource[p]);
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

              args.push(function(err, result) {
                modules[module].views[responseFormat](resource, result, function(type, body) {
                  res.send(200, type, body)
                })
              })

              // invoke the api method
              mm[m].apply(this, args);
              
            }
            else {

              modules[module].views[responseFormat](resource, mm[m].apply(this, args), function(type, body) {
                res.send(200, type, body)
              })
             
            }

          });
        })(m, mm, module);
      }
    }

  }, { strict: false });
  
  
  var server = http.createServer(function (request, response) {
    var body = "";
    request.addListener('data', function (chunk) { 
      body += chunk 
    });

    request.addListener('end', function () {

      router.route(request, body, function (result) {

        var contentType;
        if (request.headers && typeof request.headers.accept === 'string' 
            && request.headers.accept.search('text/html') > -1) {
          contentType = "text/html";            
        }
        else {
          contentType = "application/json";            
        }

        response.writeHead(result.status, {'Content-Type': contentType}, result.headers);
        response.end(result.body);
      });
    });
  });
  console.log(' > json webservice started on port 8080');  
  return server;

  
};

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