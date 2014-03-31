/*
 
 http://54.249.245.7/_utils/database.html?childnotebook
 http://documentation.mailgun.com/
 http://docs.phonegap.com/en/1.3.0/phonegap_file_file.md.html#FileReader
 http://mobile.tutsplus.com/tutorials/phonegap/phonegap-from-scratch-camera-exporting/



{
   "_id": "_design/list",
   "language": "javascript",
   "views": {
       "stream": {
           "map": "function(doc) {\n  emit(doc.stream, doc);\n}"
       }
   }
}


[Error] TypeError: 'undefined' is not an object (evaluating 'app.client_doc.feeds[$("#target").val()].name')
    saveForm (index.js, line 398)
    onclick (index.html, line 215)


http://forums.realmacsoftware.com/discussion/56056/images-taken-in-landscape-orientation-from-iphone-is-rotated-90-degrees-in-blog
http://iphonephotographyschool.com/iphone-photos-upside-down/
http://stackoverflow.com/questions/7489742/php-read-exif-data-and-adjust-orientation
 */

var app = {
    // Application Constructor
    client_lst: {},
    media_files: [],
    server_url: "http://54.249.245.7/childnotebook",
    initialize: function() {
        $.couch.urlPrefix = "http://54.249.245.7/";
        app.client_doc_default = {feeds:{}, image_width: 128};
        app.media_files = []; //additional data store for stream (camera data)
        app.receivedEvent('deviceready');
    },
        // deviceready Event Handler
        //
        // The scope of 'this' is the event. In order to call the 'receivedEvent'
        // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {app.receivedEvent('deviceready');},
    onDeviceOnline: function() {app.receivedEvent('deviceonline');},
        // Update DOM on a Received Event
    receivedEvent: function(id) {
        if (id == 'deviceready'){
            fixDeviceHeaders();
            app.loadConfigCache();
            app.registerButtons();
            app.loadDatabase();
            app.loadListCache();
            app.loadList();
            app.loadStreams();
            //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){app.fs = fs;}, function(){$("#log").html("FS NO");});
        }
        if (id == 'deviceonline'){
            app.syncTimer();
        }
    },
    registerButtons: function(){
        $("#authentication_login").click(function(){
            app.client_doc.username = $("#authentication_username").val();
            app.client_doc.email = $("#authentication_email").val();
            app.client_uid = app.client_doc.hash = CryptoJS.MD5(app.client_doc.username + "-" + $("#authentication_password").val()) + "";
            $.mobile.changePage("#main");
            app.fetchConfig(null, function(){
                $.mobile.changePage("#register");    
            }); //should exist
        });
        $("#authentication_register_form").click(function(){
            $.mobile.changePage("#register");
        });
        $(".button_mainlist").click(function(){
            $.mobile.changePage("#main");
        });        
        $("#authentication_register").click(function(){
            if($("#authentication_password").val() == $("#authentication_password_again").val()){
                console.info("Sending email to " + $("#authentication_email").val());
                app.client_doc.username = $("#authentication_username").val();
                app.client_doc.email = $("#authentication_email").val();
                app.client_uid = app.client_doc.hash = CryptoJS.MD5(app.client_doc.username + "-" + $("#authentication_password").val()) + "";
                app.saveClientInfo();
                $.mobile.changePage("#record");
            }
        });
        $("#button_refreshlist").click(function(){
            $("#items_message").html("Refreshing ...");
            $("#items").html("");            
            app.loadList();
        });
        $("#authentication_username").val(app.client_doc.username);
        $("#authentication_email").val(app.client_doc.email);
    },
    loadConfigCache: function(){
        app.client_doc = JSON.parse(localStorage.getItem("config") || "null");
        if(!app.client_doc){
            app.client_doc = app.client_doc_default; 
            $.mobile.changePage("#login");
            return false;
        }else{
            return true;   
        }
    },
    saveConfigCache: function(doc){
        doc = doc || app.client_doc;
        localStorage.setItem("config", JSON.stringify(doc));
    },
    loadList: function(){
        //checks for username and password hash
        app.fetchConfig();
        app.buildList();        
    },
    loadListCache: function(){
        app.client_lst = JSON.parse(localStorage.getItem("items") || "{}");
        app.renderList(app.client_lst);
    },
    saveStreams: function(){
        var doc = app.client_doc;
        app.saveData(doc, true);
    },
    fetchConfig: function(callback_success, callback_failure){
        if(!app.client_uid){ return; }
        app.db.openDoc(app.client_uid, {
            success: function(doc){
                app.loadStreams(doc);
                if (callback_success){callback_success(doc);}
            },
            error: function(){
                app.loadStreams(app.client_doc);
                if(callback_failure){callback_failure();}
            }
        });
    },
    loadStreams: function(doc){
        app.saveConfigCache(doc);
        app.showStreamFeeds();
        app.showStreamFeedsSelection();
    },
    getItem: function(item_id){
        var items = JSON.parse(localStorage.getItem("items") || "[]");
        return items[item_id];
    },
    loadItem: function(self){
        var item = app.getItem(self.id);
        if(!item){return;}
        $("#item_detail_date").html("" + app.renderDate(new Date(item.date)));
        $("#item_detail_images").html(app.renderMedia(item, 'width="100%"', "controls"));
        $("#item_detail_notes").html("notes " + item.note);
        $.mobile.changePage("#item");
    },
    buildList: function(){
        $("#items_message").html("");
        $("#items").html("");
        app.client_lst = {};
        app.feeds = [app.client_uid];
        for (var i in app.client_doc.feeds){ app.feeds.push(i); }
        app.mergeList(0);
    },
    mergeList: function(feed_index){
        if(app.feeds.length <= feed_index){ return; }
        stream_id = app.feeds[feed_index];
        this.fetchList (function(result){
            for (var i in result.rows){
                var item = result.rows[i].value;
                app.client_lst[item._id] = item;
            }
            localStorage.setItem("items", JSON.stringify(app.client_lst));
            app.renderList(app.client_lst);
            app.mergeList(feed_index+1);
        }, function(){
            var items = localStorage.getItem("items");
            if(items){ app.renderList(JSON.parse(items)); }
            app.mergeList(feed_index+1);
        }, stream_id, true);
    },
    fetchList: function(callback_success, callback_failure, stream_key, force_update){
        var url = app.server_url + "/_design/list/_view/stream?key=%22"+stream_key+"%22";
        $.getJSON(url, callback_success, callback_failure);
    },
    renderMedia: function(item, size, controls, maxone){
      var images = '';
      size = size || 'height="80px"';
      controls = controls || "";
      for (var f in item.files){
        if (item.files[f].type.indexOf("image") === 0){
            images = images + '<img border="0" src="'+item.files[f].url+'" alt="" ' + size + ' />'; //'<img src="'+item.files[f].url+'" '+size+' />';
        }else{
            images = images + '<video src="'+item.files[f].url+'" ' + controls + ' ' + size + '></video>';
        }
        if (maxone) {return images;}
      }
      return images;
    },
    renderList: function(){
        for (var b in app.client_lst){
            var item = app.client_lst[b];
            var time, images = "";
            if ($("#"+item._id).length){ //check if rendered
            }else{
                time = app.renderDate(new Date(item.date));
                images = app.renderMedia(item, 'height="80px"', '', true);
                $("#items").append('<li><a class="page_areas_button" onclick="app.loadItem(this)" href="#" id="'+item._id+'"  ">'+images+'<p>'+ item.note + '</p><p><i>'+item.source+'</i></p><p class="ui-li-aside">'+time+'</p></a> </li>');
            }
        }
        $("#items").listview().listview("refresh");
    },
    renderDate: function(d){
        return d.getFullYear() + "." + app.getDoubleDigits(d.getMonth()) + "." + app.getDoubleDigits(d.getDate()) + "<br>" + app.getDoubleDigits(d.getHours()) + ":" + app.getDoubleDigits(d.getMinutes());
    },
    getDoubleDigits: function(f){
        var s = f+"";
        if (s.length == 1){return "0"+s;}
        return s;
    },
    loadDatabase: function(){
        //app.db = new PouchDB('childnotebook');
        app.db = $.couch.db("childnotebook");
    },
    syncTimer: function(){
        var online = true;
        if (online){
            app.sync();
            setTimeout(app.syncTimer, 1000*60*5); //every 5 minutes do a sync
        }
    },
    sync: function() {
        //syncDom.setAttribute('data-sync-state', 'syncing');
        var opts = {continuous: true, complete: function(e){
            app.alertMessage(JSON.stringify(e));
        }};
        app.db.replicate.to(app.server_url, opts);
        //app.db.replicate.from(remoteCouch, opts);
        var d = new Date();
        $("#panel_sync_time").html("Synchronized: " + d.getHours() + ":" + d.getMinutes());
    },
    b64toBlob:function(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;
        
        var byteCharacters = atob(b64Data);
        var byteArrays = [];
        
        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            
            var byteArray = new Uint8Array(byteNumbers);
            
            byteArrays.push(byteArray);
        }
        
        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    },
    clearForm: function(){
        app.media_files = [];
        $(".stream_field").each(function(i){
            $(this).val("");
        });
        $("#note_record").html("");
        $("#log").html("");
    },
    alertMessage: function(msg, level){
        console.info("--- " + level + " " + msg);
    },
        /*
    showStreams: function() {
        app.db.allDocs({
            include_docs: true,
            descending: true
        }, function(err, doc) {
            app.redrawStreamHistory(doc.rows);
        });
    },
    redrawStreamHistory: function(rows) {
        $("#stream_history").empty();
        for(var i in rows){
            var row = rows[i];
            var target = app.client_doc.feeds[row.doc.target];
            if (target){
                //var d = JSON.stringify(row);
                $('#stream_history').append('<li><a href="#">' + target.name + ' - ' + row.category + '</a></li>');
            }
        }
        $('#stream_history').listview('refresh');
    },
        */
    showStreamFeeds: function() {
        $("#stream_feeds").empty();
        for(var i in app.client_doc.feeds){
            var row = app.client_doc.feeds[i];
            var d = row.name;
            $('#stream_feeds').append('<li><a href="#stream_feed_details" onclick="app.showStreamFeedInfo(\'' + i + '\')">' + d + '</a></li>');
        }
        try{
            $('#stream_feeds').listview('refresh');
        }catch(e){}
    },
    showStreamFeedInfo: function(feed_id) {
        app.selected_feed = feed_id;
        var feed_info = app.client_doc.feeds[feed_id];
        if(!feed_info){
            $(".stream_feed_info").each(function(i){
                $(this).val("");
            });
            return;
        }else{
            $(".stream_feed_info#name").val(feed_info.name);
            $(".stream_feed_info#email").val(feed_info.email);
            $("#stream_feed_info_id").val(feed_id);
        }
    },
    showStreamFeedsSelection: function(){
        $(".stream_field#target").empty();
        $(".stream_field#target").append('<option value="*" selected>Every one</option>');
        for(var i in app.client_doc.feeds){
            var feed_info = app.client_doc.feeds[i];
            $(".stream_field#target").append('<option value="' + i + '">' + feed_info.name + '</option>');
        }
    },
    getRandomId: function(){
        return CryptoJS.MD5(new Date().getTime()+"")+"";
    },
    saveStreamFeedInfo: function() {
        if (!app.selected_feed){
            app.selected_feed = app.getRandomId();
            app.client_doc.feeds[app.selected_feed] = {};
        }
        $(".stream_feed_info").each(function(i){
            var attr = $(this).context.id;
            if(attr){
                if (attr == "email"){
                    app.client_doc.feeds[app.selected_feed][attr] = $(this).val().split(";");
                }else{
                    app.client_doc.feeds[app.selected_feed][attr] = $(this).val();
                }
            }
        });
        setTimeout(app.saveClientInfo, 800);
    },
    saveClientInfo: function(){
        app.client_doc._id = app.client_uid;
        app.saveData(app.client_doc, function(client_doc){
            if(client_doc.ok){
                app.client_doc._rev = client_doc.rev;
            }
        }, true);
        app.showStreamFeeds();
        app.showStreamFeedsSelection();
        app.saveConfigCache();
    },
    log: function(msg){
        //$("#log").html(msg);
    },
    saveData: function(doc, callback_success){
        console.info("Saving " + JSON.stringify(doc));
        /*
        app.db.put(doc, function callback(err, result) {
            if (err) {
               app.alertMessage('Failed posted a todo! ' + JSON.stringify(err), -1);
            }else{
               app.alertMessage('Successfully posted a todo!', 1);
               if(callback_success){callback_success(result);}
            }
        });
        app.sync();
        */
        app.db.saveDoc(doc, {
            success: function(result) {
                app.alertMessage('Successfully posted a todo!', 1);
                if(callback_success){
                    callback_success(result);
                }
            },
            error: function(status) {
                app.alertMessage('Failed posted a todo! ' + JSON.stringify(status), -1);
                if(callback_success === true){
                    delete doc._id;
                    delete doc._rev;
                    app.db.saveDoc(doc);
                }
            }
        });

    },
    saveForm: function(){
        var doc = {};
        $(".stream_field").each(function(i){
            var attr = $(this).context.id;
            if(attr){
                doc[attr] = $(this).val();
            }
        });
        doc.date = new Date().getTime();
        doc.stream = $("#target").val(); //the stream identifier + self
        if (doc.stream == "*"){ doc.stream = app.client_uid; }
        doc.owner = ""; //the stream owner (this should be a valid user id)
        doc.files = app.media_files;
        doc["subject"] = app.client_doc.feeds[$("#target").val()].name;
        doc["source"] = app.client_doc.username;

        app.saveData(doc, function(new_doc){
            app.log("Saved document " + JSON.stringify(doc));
        });
        app.clearForm();
    },
    updateNotePreviewRecord: function(){
        var imgs = "";
        var type = "";
        for (var i in app.media_files){
            type = app.media_files[i].type || app.media_files[i].content_type;
            if (type.indexOf("image") === 0){
                imgs = imgs + "<IMG STYLE='width:100px' SRC='" + app.media_files[i].uri + "'/>" ;
            }else{
                if(type == "video/quicktime"){
                    imgs = imgs + '<EMBED SRC="'+ app.media_files[i].fullPath +'" WIDTH=100 AUTOPLAY=false CONTROLLER=true LOOP=false PLUGINSPAGE=http://www.apple.com/quicktime/">';
                }
            }
        }
        $("#note_record").html(imgs);
    },
    captureMovie: function(){
        captureUploadVideo(function(index, file_data){
            if(index == 1){app.media_files.push(file_data);}
            app.updateNotePreviewRecord();
        });
    },
    capturePicture: function(){
        captureUploadPicture(function(index, file_data){
            if(index == 1){app.media_files.push(file_data);}
            app.updateNotePreviewRecord();
        }, {targetWidth:app.client_doc.image_width});
    },
    resendStreamInformation: function(){
        //https://github.com/shz/node-mailgun
        var stream_email = $(".stream_feed_info#email").val();
        var stream_id = $("#stream_feed_info_id").val();
        console.log("------- resend info to ", stream_email, stream_id);
    }
};

setTimeout(function(){
    app.initialize();
}, 1000);
/*

function uploadMedia(document_id, media_data){
    app.stream_tmp.media = media_data || image_data;
    app.db.get(document_id, function(err, client_doc) {
               var doc = app.b64toBlob(app.stream_tmp.media, "image/jpeg");
               app.db.putAttachment(client_doc._id, 'picture.jpg', client_doc._rev, doc, 'image/jpeg', function(err, res) {
                                    console.info("---- " + JSON.stringify(err) + " ---- " +  JSON.stringify(res));
                                    });
               });
}

*/


