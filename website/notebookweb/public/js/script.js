/*
 */

var server_url = "http://54.249.245.7/notebook";
var cards = {};

function enableComments(){
    // onclick event handler (for comments)
    $('.comment_tr').click(function () {
        $(this).toggleClass('disabled');
        $(this).parent().parent().parent().find('form').slideToggle(250, function () {
            $('.main_container').masonry();
        });
    });         
}

function displayBoard(board_id, hide){
    if(hide == undefined){ //toggle mode
        hide = !hide_boards[board_id];
    }
    if(hide){
        for (var i in cards){
            var card = cards[i];
            if(card.stream == board_id){
                m.masonry('remove', $("#"+i));
            }
        }
        m.masonry( 'reload' );
    }else{
        fetchBoard(board_id);
    }
    $("#"+board_id).attr('class', getGUIBoardMenuItemStyle(hide));
    hide_boards[board_id] = hide;
    localStorage.setItem("hide_boards", JSON.stringify(hide_boards));
}

function fetchBoard(stream_key){
    var url = server_url + "/_design/list/_view/stream?key=%22"+stream_key+"%22";
    $.getJSON(url, renderBoard, function(){
        alert("could not connect to server");
    });
}

/*copy*/
function renderBoard(doc){
    for (var i in doc.rows){
        renderCard(doc.rows[i].value);
        cards[doc.rows[i].value._id] = doc.rows[i].value;
    }
    m.masonry('reload');
    enableComments();
}

/*copy*/
function getDoubleDigits(f){
    var s = f+"";
    if (s.length == 1){return "0"+s;}
    return s;
}
/*copy*/
function renderDate(d){
    return d.getFullYear() + "." + getDoubleDigits(d.getMonth()) + "." + getDoubleDigits(d.getDate()) + " " + getDoubleDigits(d.getHours()) + ":" + getDoubleDigits(d.getMinutes());
}
/*copy*/
function renderMedia(item_file){
    var pictures = "";
    if (item_file.type.indexOf("image") === 0){
        pictures = '<img src="' + item_file.url + '"> ';
    }else{
        pictures = '<video src="'+item_file.url+'" controls width="192px"></video>';
    }    
    return pictures;
}

function deleteCard(self){
    var item_id = self.id.replace("delete_", "");
    $.getJSON("/api/card/"+item_id+"/delete/", function(){
        m.masonry('remove', $("#"+item_id));
        m.masonry('reload');
        location.href="#close";
    });
}

function updateCard(self){
    var item_id = self.id.replace("update_", "");
    var text = $("#view_card_info_note").val();
    $("#"+item_id+"_note").html(text);
    $.getJSON("/api/card/"+item_id+"/update/"+text, function(){
        m.masonry('reload');
        location.href="#close";
    });

}

function displayCard(self){
    var item = cards[self.id];
    var pictures = "";
    for (var f in item.files){
        pictures = pictures + "<span class='view_card_media'>" + renderMedia(item.files[f]) + "</span>";
    }
    var heading = "";
    //heading = heading + "<p class='view_card_info_subject'>"+item.subject+"</p>";
    heading = heading + "<p class='view_card_info_source'>"+item.source+"</p>";
    heading = heading + "<p class='view_card_info_date'>"+renderDate(new Date(item.date))+"</p>";
    heading = heading + "<center><br><br><input id='view_card_info_note' type='text' value='"+item.note+"' /><br><br>";
    $("#view_card_title").html(item.note || item.subject || "Card");
    var menu = "";
    menu = menu + "<button id='update_"+item._id+"' onclick='updateCard(this)'>update</button><br><br>";
    menu = menu + "<button id='delete_"+item._id+"' onclick='deleteCard(this)'>delete</button><br><br>";
    $("#view_card_content").html(heading + pictures +"<br><br>"+ menu+"</center>");
    setTimeout(function(){location.href="#card";}, 100);
}

function renderCard(item){
    var pin_id = item._id;
    var pictures = "";
    if($("#"+pin_id).length){ return; }
    if(item.destroyed) { return; }
    for (var f in item.files){
        pictures = pictures + renderMedia(item.files[f]);
    }
    if (!pictures.length){ pictures = ""; }
    var pin_element = ' \
    <!-- pin element 1 --> \
    <div class="pin" id="'+pin_id+'" onclick="displayCard(this)"> \
        <div class="holder"> \
            <!-- div class="actions" pin_id="'+pin_id+'"> \
                <a href="#" class="button">Repin</a> \
                <a href="#" class="button">Like</a> \
                <a href="#" class="button disabled comment_tr">Comment</a> \
            </div --> \
            <a class="image ajax" href="#" title="Photo number 1" pin_id="'+pin_id+'"> \
                ' + pictures + '\
            </a> \
        </div> \
        <p class="desc">' + item.subject + '</p> \
        <p class="desc" id="'+pin_id+'_note">' + item.note + '</p> \
        <p class="info"> \
            ' + renderDate(new Date(item.date)) + ' <i style="float:right;">' + item.source + '</i> \
        </p> \
        <!-- form class="comment" method="post" action="" style="display: none"> \
            <input type="hidden" name="id" value="'+pin_id+'" /> \
            <textarea placeholder="Add a comment..." maxlength="1000"></textarea> \
            <button type="button" class="button">Comment</button> \
        </form --> \
    </div>';
    m.prepend(pin_element);

}
function getGUIBoardMenuItemStyle(b){
    var menu_style = "menu_board_item_visible";
    if(!b){
        menu_style = "menu_board_item_hidden";
    }
    return menu_style;
}
function updateBoardsMenu(){
    var user_id = $("#user_id").val() || "e50d0be05bf25a909ef1d96a0f62800d"; //FIXME
    var url = server_url + "/"+user_id;
    window.hide_boards = JSON.parse(localStorage.getItem("hide_boards") || "{}");
    $("#board_menu").html("");    
    $.getJSON(url, function(item){
        var menu = "";
        item.feeds[user_id] = {name: "General"};
        for (var i in item.feeds){
            var feed = item.feeds[i];
            displayBoard(i, hide_boards[i]);
            menu = menu + '<li><a id="'+i+'" href="#" onclick="displayBoard(this.id)" class="'+getGUIBoardMenuItemStyle(hide_boards[i])+'">' + feed.name + '</a></li>';
        }
        $("#board_menu").append(menu);
    });
}

$(document).ready(function(){

    // masonry initialization
    window.m = $('.main_container').masonry({
        // options
        itemSelector : '.pin',
        isAnimated: true,
        isFitWidth: true
    });

    updateBoardsMenu();

});