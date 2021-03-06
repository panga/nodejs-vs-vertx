//loading vertx
var vertx = require('vertx.js');
var container = require('vertx/container');

//getting EventBus handler
var eb = vertx.eventBus;

//setting up MongoDB persistor
var mongo = 'vertx.mongopersistor';

container.deployModule('io.vertx~mod-mongo-persistor~2.1.0', function(err, deployId) {
  if (!err) {
    //clearing database
    eb.send(mongo, {
      action: 'delete',
      collection: 'vertx',
      matcher: {}
    });
  } else {
    err.printStackTrace();
  }
});

//setting up server
var server = vertx.createHttpServer();
var routeMatcher = new vertx.RouteMatcher();

//post route handler
routeMatcher.get('/post', function(req, res) {
  // database access
  eb.send(mongo, {
      action: 'save',
      collection: 'vertx',
      document: {
        author: randomString(16),
        date: new Date(),
        content: randomString(160)
      }
    },
    function(reply) {
      if (reply.status === 'ok') {
        eb.send(mongo, {
            action: 'find',
            collection: 'vertx',
            limit: 100,
            matcher: {}
          },
          function(reply) {
            if (reply.status === 'ok') {
              addHeaders(req.response);
              req.response.end(JSON.stringify(reply.results));
            } else {
              addHeaders(req.response);
              req.response.statusCode(500).end();
            }
          });
      } else {
        addHeaders(req.response);
        req.response.statusCode(500).end();
      }
    });
});

//hello route handler
routeMatcher.get('/hello', function(req, res) {
  addHeaders(req.response);
  req.response.end(JSON.stringify({
    message: 'hello'
  }));
});

//concat route handler
routeMatcher.get('/concat', function(req, res) {
  var response = randomString(10000);

  addHeaders(req.response);
  req.response.end(JSON.stringify({
    concat: response
  }));
});

// fibonacci route handler
routeMatcher.get('/fibonacci', function(req, res) {
  fibonacci(30);

  addHeaders(req.response);
  req.response.end(JSON.stringify({
    fibonacci: 'calculated'
  }));
});

server.requestHandler(routeMatcher).listen(1337);

//helper http headers function
var addHeaders = function(response) {
  response.putHeader('Content-Type', 'application/json').putHeader('Date', new Date().toString()).putHeader('Connection', 'close');
};

//helper function for random string generation
var randomString = function(_len) {
  var alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  var len = _len || 160;
  var result = '';
  var rand;

  for (var i = 0; i < len; i++) {
    rand = Math.floor(Math.random() * (alphabet.length));
    result += alphabet.substring(rand, rand + 1);
  }

  return result;
};

//helper Fibonacci function
var fibonacci = function(n) {
  if (n <= 1) return n;
  return fibonacci(n - 2) + fibonacci(n - 1);
};