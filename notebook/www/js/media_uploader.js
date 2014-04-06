/*

Media receaver .../upload.php?id=1231231231

<?php
function image_fix_orientation($filename) {
    $exif = exif_read_data($filename);
    $degrees = 0;
    $orient = true;
    if (!empty($exif['Orientation'])) {
        switch ($exif['Orientation']) {
            case 3:
                $degrees = 180;
                break;
            case 6:
                $degrees = -90;
                $orient = false;
                break;
            case 8:
                $degrees = 90;
                $orient = false;
                break;
        }
    }
    $source = imagecreatefromjpeg($filename);
    $rotate = imagerotate($source, $degrees, 0);
    $size = getimagesize($filename);
    $ratio = $size[0]/$size[1]; // width/height
    if( $ratio > 1) {
         $width = 500;
         $height = 500/$ratio;
    } else {
         $width = 500*$ratio;
         $height = 500;
    }
    if($orient){
        $rotate = imagescale($rotate, $width, $height, IMG_BICUBIC_FIXED);
    }else{
        $rotate = imagescale($rotate, $height, $width, IMG_BICUBIC_FIXED);
    }
    imagejpeg($rotate, $filename);
    // Free the memory
    imagedestroy($source);
    imagedestroy($rotate);
}

$uploads_dir = '../media/childnotebook_files';
$file_src = $_GET["id"];
$filepath = "$uploads_dir/$file_src";
if(move_uploaded_file($_FILES["file"]["tmp_name"], $filepath)){
 chmod($filepath, 0755);
 image_fix_orientation($filepath);
 image_fix_scale($filenpath);
}
?>


*/
MEDIA_SERVER_URL = "http://media.agamecompany.com/childnotebook_files/";
// A button will call this function
//
function captureUploadVideo(callback_success, options){
    function captureSuccess(mediaFiles) {
        var i, len;
        var file_name = "" + new Date().getTime() + ".mov";
        navigator.upload_attempt = 0;
        if(mediaFiles.length) {
            uploadMovie(mediaFiles[0], file_name, callback_success);
        }
        mediaFiles[0].file_name = file_name;
        mediaFiles[0].url = MEDIA_SERVER_URL + file_name;
        if(callback_success){callback_success(1, mediaFiles[0]);}
    }
    function captureError(error) {
        var msg = 'An error occurred during capture: ' + error.code;
        navigator.notification.alert(msg, null, 'Uh oh!');
    }
    $.extend(options, {limit: 1});
    navigator.device.capture.captureVideo(captureSuccess, captureError, {limit: 1});
}

function captureUploadPicture(callback_success, options){
    function onSuccess(imageURI){
        navigator.upload_attempt = 0;
        var file_name = "" + new Date().getTime() + ".jpeg";
        uploadPhoto(imageURI, file_name, callback_success);
        if(callback_success){callback_success(1, {url:MEDIA_SERVER_URL + file_name, file_name:file_name, uri:imageURI, type:"image/jpeg"});}
    }
    function onFail(error) {
        var msg = 'An error occurred while capturing picture: ' + error.code;
        navigator.notification.alert(msg, null, 'Uh oh!');
    }
    $.extend(options, {
        quality: 50,
        sourceType: Camera.PictureSourceType.CAMERA,
        encodingType: Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        destinationType: Camera.DestinationType.FILE_URI });
    navigator.camera.getPicture(onSuccess, onFail, {
                                quality: 50,
                                sourceType: Camera.PictureSourceType.CAMERA,
                                encodingType: Camera.EncodingType.JPEG,
                                mediaType: Camera.MediaType.PICTURE,
                                destinationType: Camera.DestinationType.FILE_URI });
}

function uploadPhoto(imageURI, alias, callback_success) {
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
    options.mimeType="image/jpeg";
    var params = {};
    params.value1 = "id";
    params.value2 = alias;
    options.params = params;
    var ft = new FileTransfer();
    ft.upload(
        imageURI,
        encodeURI("http://simplr.agamecompany.com/upload.php?id="+alias),
        function(result){
            //console.log('Upload photo success: ' + result.responseCode);
            //console.log(result.bytesSent + ' bytes sent');
            if(callback_success){callback_success(2, options);}
        },
        function(error){
            if (navigator.upload_attempt === 0){
                navigator.upload_attempt = 1;
                //console.log('Some error occurd. Lets try uploading file again with ' + path + ': ' + error.code);
                uploadPhoto(mediaFile, alias, callback_success);
                if(callback_success){callback_success(2, options);}
            }else{
                console.log('Error uploading file ' + path + ': ' + error.code);
            }
        },
        options
    );
}

// Upload files to server
function uploadMovie(mediaFile, alias, callback_success) {
    //http://gonzalo123.com/2013/10/28/taking-photos-with-a-phonegapcordova-application-and-uploading-them-to-the-server/
    var ft = new FileTransfer(),
        path = mediaFile.fullPath,
        name = mediaFile.name;
    //console.log("Uploading file " + JSON.stringify(mediaFile));
    ft.upload(path,
        "http://simplr.agamecompany.com/upload.php?id="+alias,
        function(result) {
            //console.log('Upload success: ' + result.responseCode);
            //console.log(result.bytesSent + ' bytes sent');
            if(callback_success){callback_success(2, result);}
        },
        function(error) {
            if (navigator.upload_attempt === 0){
                navigator.upload_attempt = 1;
                //console.log('Some error occurd. Lets try uploading file again with ' + path + ': ' + error.code);
                uploadMovie(mediaFile, alias, callback_success);
            }else{
                console.log('Error uploading file ' + path + ': ' + error.code);
            }
        },
        { fileName: name }
    );
}