/*
 */

var server_url = "http://54.249.245.7/childnotebook";

function enableComments(){
    // onclick event handler (for comments)
    $('.comment_tr').click(function () {
        $(this).toggleClass('disabled');
        $(this).parent().parent().parent().find('form').slideToggle(250, function () {
            $('.main_container').masonry();
        });
    });         
}

function displayBoard(self){
    fetchBoard(self.id);
}

function fetchBoard(stream_key){
    var url = server_url + "/_design/list/_view/stream?key=%22"+stream_key+"%22";
    $.getJSON(url, renderBoard, function(){
        alert("could not connect to server");
    });
}

function renderBoard(doc){
    for (var i in doc.rows){
        renderCard(doc.rows[i].value);
    }
    enableComments();
}
function getDoubleDigits(f){
    var s = f+"";
    if (s.length == 1){return "0"+s;}
    return s;
}
function renderDate(d){
    return d.getFullYear() + "." + getDoubleDigits(d.getMonth()) + "." + getDoubleDigits(d.getDate()) + " " + getDoubleDigits(d.getHours()) + ":" + getDoubleDigits(d.getMinutes());
}

function renderCard(item){
    var pin_id = item.id;
    var pictures = "";
    for (var i in item.files){
        pictures = pictures + '<img src="' + item.files[i].url + '"> ';
    }
    if (!pictures.length){ pictures = ""; }

    var pin_element = ' \
    <!-- pin element 1 --> \
    <div class="pin"> \
        <!-- div class="holder"> \
            <div class="actions" pin_id="'+pin_id+'"> \
                <a href="#" class="button">Repin</a> \
                <a href="#" class="button">Like</a> \
                <a href="#" class="button disabled comment_tr">Comment</a> \
            </div> \
            <a class="image ajax" href="#" title="Photo number 1" pin_id="'+pin_id+'"> \
                ' + pictures + '\
            </a> \
        </div --> \
        <p class="desc">' + item.subject + '<br>' + item.note + '</p> \
        <p class="info"> \
            ' + renderDate(new Date(item.date)) + ' <i style="float:right;">' + item.source + '</i> \
        </p> \
        <!-- form class="comment" method="post" action="" style="display: none"> \
            <input type="hidden" name="id" value="'+pin_id+'" /> \
            <textarea placeholder="Add a comment..." maxlength="1000"></textarea> \
            <button type="button" class="button">Comment</button> \
        </form --> \
    </div>';
    m.append(pin_element).masonry('reload');

}

function updateBoardsMenu(){
    var user_id = "229af7a2495bedb3c8253ac57881d040";
    var url = server_url + "/"+user_id;
    $("#board_menu").html("");
    $.getJSON(url, function(item){
        var menu = "";
        for (var i in item.feeds){
            var feed = item.feeds[i];
            menu = menu + '<li><a id="'+i+'" href="#" onclick="displayBoard(this)">' + feed.name + '</a></li>';
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