// demo module
exports.hello = function(){
  console.log('hello world');
  return 'hello world';
};

exports.asyncHello = function(){
  var args = Array.prototype.slice.call(arguments),
      callback = args.pop();
    
  setTimeout(function(){
    console.log('hello world');
    if(typeof callback == 'function'){
      // callback is going to return a value. if we wanted to continue the chain here, we could pass res
      callback(null, 'hello world');
    }
  }, 1000);
}