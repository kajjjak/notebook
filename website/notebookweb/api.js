var nano = require('nano')('http://54.249.245.7/');

module.exports = function(){
  var express = require('express');
  var app = express();

  app.get('/board/:id', function(req, res){
    var db = nano.db.use('notebook');
    db.get(req.params.id, function(err, doc){
    	var response = "null";
        if(err){
            response = JSON.stringify(err);
        }else{
            response = doc;
        }
        res.send(response);
    });
  });

  app.get('/card/:id/update/:note', function(req, res){
  	setDocument(req.params.id, {note: req.params.note}, function(doc){
    	res.send(doc);
    }, function(err){
    	res.send(err);
    });
  });

  app.get('/card/:id/delete/', function(req, res){ 
    setDocument(req.params.id, {destroyed: new Date().getTime()}, function(doc){
      res.send(doc);
    }, function(err){
      res.send(err);
    });
  });

  app.get('/invite/:user_id/stream/:stream_id/notify/', function(req, res){
    var stream_id = req.params.stream_id;
    var user_id = req.params.user_id;
    //console.info("--------- " + user_id + " " + stream_id);
    var updoc = {"invites": {}};
    updoc["invites"][stream_id] = 0;
    setDocument(user_id, updoc, function(doc){
      res.send(doc);
    }, function(err){
      res.send(err);
    });
  });

  app.get('/invite/:user_id/stream/:stream_id/accept/:stream_name', function(req, res){
    var stream_name = req.params.stream_name;
    var stream_id = req.params.stream_id;
    var user_id = req.params.user_id;
    //console.info("--------- " + user_id + " " + stream_id);
    var accept = 1;
    if (stream_name == "null" || stream_name == "undefined"){accept = -1;}
    var updoc = {"eats": {}, "invites": {}};
    updoc["eats"][stream_id] = {"name": stream_name, "accept": accept};
    updoc["invites"][stream_id] = accept;
    setDocument(user_id, updoc, function(doc){
      res.send(doc);
    }, function(err){
      res.send(err);
    });
  });

  return app;
}();

function setDocument(id, obj, success, failure){
	var db = nano.db.use('notebook');
    db.get(id, function(err, doc){
        if(err){failure(err);
        }else{
            for (var key in obj) {
              if (typeof(obj[key]) == "object"){
                if(!doc[key]){ doc[key] = {}; }
                for (var key2 in obj[key]) {
                  doc[key][key2] = obj[key][key2];
                }
              }else{
                doc[key] = obj[key];
              }
            }
            db.insert(doc, id, function(err, changed_doc){
            	if(err){failure(err);}
            	else{success(changed_doc);}
            });
        }
        
    });	
}