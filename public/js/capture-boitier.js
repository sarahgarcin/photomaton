var boitierExterne = (function() {
  return {
    init : function() {
  	  // switch mode if code == 115 (next mode, Z) or 122 (prev mode, S)
  	  // can't overflow past first or last mode buttons
      $("body").keypress(function(e){
        debugger;
        var key = e.key;
        // capture
        if( key === 'a' || key === 'q') {
          if( imageMode.isRunning())      imageMode.captureButtonPress();
         
        }
      });


    },
  }

})();

