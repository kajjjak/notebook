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

  return app;
}();

function setDocument(id, obj, success, failure){
	var db = nano.db.use('notebook');
    db.get(id, function(err, doc){
        if(err){failure(err);
        }else{
            for (var key in obj) { doc[key] = obj[key]; }
            db.insert(doc, id, function(err, changed_doc){
            	if(err){failure(err);}
            	else{success(changed_doc);}
            });
        }
        
    });	
}