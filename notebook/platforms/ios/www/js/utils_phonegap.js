function fixDeviceHeaders(){
  //FIX BUTTON AND HEADER
  $(".fix_button").css("padding","4px");
  $(".fix_button").css("border-radius","10px");
  $(".fix_button").css("border-color","darkgray");
  $(".fix_header").css("padding-bottom","8px");

  if (window.device){
    if (parseFloat(window.device.version) >= 7.0) {
      $(".fix_header").css("padding-top", "20px");
      $(".fix_button").css("margin-top", "20px");
    }
  }
}

function isNumber(value) {
    if ((undefined === value) || (null === value)) {
        return false;
    }
    if (typeof value == 'number') {
        return true;
    }
    return !isNaN(value - 0);
}