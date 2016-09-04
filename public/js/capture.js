

/* VARIABLES */
var socket = io.connect();

/* sockets */
function onSocketConnect() {
	sessionId = socket.io.engine.id;
	console.log('Connected ' + sessionId);
};

function onSocketError(reason) {
	console.log('Unable to connect to server', reason);
};

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);
socket.on('mediaCreated', onMediaCreated);
socket.on('displayPageEvents', onDisplayPage);
// socket.on('stopMotionDirectoryCreated', function(d) { stopMotionMode.onStopMotionDirectoryCreated( d); });
// socket.on('newStopmotionImage', function(d) { stopMotionMode.onNewStopmotionImage( d); });

jQuery(document).ready(function($) {

	$(document).foundation();
	init();
});

function init(){

  /******************************************************/
  // boitierExterne.init();
  // // photoDisplay();
  // currentStream.init()
  //   .then( function() {
  //     $('.js--modeSelector[data-mediatype="photo"]').trigger( 'click');
  //   }, function(err) {
  //     console.log("failed to init : " + err);
  //   });

  // // delete file
  // $('body').on('click', '.js--delete-media-capture', function(){
  //   var mediaToDelete =
  //   {
  //     "mediaName" : $(document).data('lastCapturedMediaName'),
  //     "mediaFolderPath" : $(document).data('lastCapturedMediaFolderPath'),
  //   }
  //   sendData.deleteMedia( mediaToDelete);
  // });

  // fullscreen();

}

var sendData = {

  createNewMedia : function( mediaData) {
    socket.emit( 'newMedia', mediaData);
  },
  editMedia : function( mediaData) {
    socket.emit( 'editMediaMeta', mediaData);
  },

  deleteMedia : function( mediaData) {
    socket.emit( 'deleteMedia', mediaData);
  },

}

function photoDisplay(){
  $(document)
    .data('currentMode', 'photo')

  $(".preview_image").show();

  $('.photo-capture').fadeIn(1000);

  $('#video').show();
  $("body").attr("data-mode", "photo");

  currentStream.startCameraFeed().then( function() {
    imageMode.init();

  }, function(err) {
    console.log( "Failed to start camera feed for photo : " + err);
  });
}

var currentStream = (function(context) {

  var videoElement = document.querySelector('#video');
  var videoStream;

  function errorCallback(error) {
    console.log('navigator.getUserMedia error: ', error);
  }

  function gotDevices(sourceInfos) {
    // socket.emit('test', sourceInfos[3].label);
    if(sourceInfos[3].label == 'camera 0, facing back'){
      return sourceInfos[3].deviceId;
    }
    else{
      return sourceInfos[0].deviceId;
    }
  }

  function getCameraFeed() {
    return new Promise(function(resolve, reject) {
      console.log( "Getting camera feed");
      navigator.mediaDevices.enumerateDevices()
      .then(function(deviceInfos) {
        return gotDevices(deviceInfos);
      }).then(function(videoSource){
        console.log(videoSource);
        navigator.getUserMedia(
          {
            video: {
              optional: [ videoSource ? {sourceId: videoSource} : undefined],
              mandatory: {
                minWidth: 1280,
                minHeight: 720
              }
            },
            audio: false
          },
          function (stream) {
            resolve( stream);
          },
          function(err) {
            alert('\n\n error: ' + JSON.stringify(err));
          }
        );
      });
    });
  }

  

  // déclaration des fonctions accessibles de l'extérieur ici
  return {

    init : function() {
      return new Promise(function(resolve, reject) {
        navigator.mediaDevices.enumerateDevices()
          .then(function(deviceInfos) {
            gotDevices(deviceInfos);
            resolve();
          }, function(err) {
            reject("Failed to init stream : " + err);
          });
      });
    },

    getVideoFrame : function() {
      return videoElement;
    },

    stopAllFeeds : function() {
      if( !videoElement.paused)
        videoElement.pause();

      imageMode.stop();
    },

    startCameraFeed : function() {
      return new Promise(function(resolve, reject) {
        currentStream.stopAllFeeds();
        getCameraFeed()
          .then( function( stream) {
            videoStream = stream;
            if (navigator.mozGetUserMedia) {
              videoElement.mozSrcObject = stream;
            } else {
              var vendorURL = window.URL || window.webkitURL;
              videoElement.src = vendorURL.createObjectURL(stream);

            }
            videoElement.play();
            resolve();
          }, function(err) {
            console.log( " failed to start camera feed: " + err);
            reject();
          });
      });
    },

  }

})();

function onMediaCreated( image){

  var cellIndex = $('.cell[data-status="en-cours"]').attr('data-index');
  var previewDiv = '<div class="flash preview preview_image"><img class="output"> <a href="#" title="Dodoc media" class="button-wrapper_deleteMediaCapture js--delete-media-capture"><div class="btn icon"><img src="../images/clear.svg"></div></a></div>';

  if($('.cell[data-status="en-cours"]').attr('data-index') == 4){
      $('.cell[data-index="4"]')
      .find('.video-view').remove()
      .end()
      .append(previewDiv);
        var $preview = $('.cell[data-index="4"]').find(".preview_image");
        $preview.find('.output').attr("src", 'images/'+image.file+'.jpg');
        $preview.find('.js--delete-media-capture').show();

      $('.generate-pdf').show();
      $('.generate-pdf #pdf').on('click', function(){
        var page = $('body').html();
        socket.emit('generate', page);
      });
  }
  else{
    $('.cell[data-status="en-cours"]')
    .attr('data-status', '')
    .clone().appendTo('.main')
    .attr('data-status', 'en-cours')
    .attr('data-index', (+cellIndex)+1);

    var cellIndex = $('.cell[data-status="en-cours"]').attr('data-index');
    var prevCell = (+cellIndex)-1;
    
    $('.cell[data-index="'+prevCell+'"]')
    .find('.video-view').remove()
    .end()
    .append(previewDiv);
      var $preview = $('.cell[data-index="'+prevCell+'"]').find(".preview_image");
      $preview.find('.output').attr("src", 'images/'+image.file+'.jpg');
      $preview.find('.js--delete-media-capture').show();
  }

  console.log(image);
  $(document)
    .data('lastCapturedMediaName', image.file)
    .data('lastCapturedMediaFolderPath', image.path)
    ;

  // imageMode.showImagePreview( 'images/'+image.file+'.jpg');
  // var $preview = $('.cell[data-index="'+prevCell+'"]').find(".preview_image");
  // $preview.find('.output').attr("src", 'images/'+image.file+'.jpg');
  // $preview.find('.js--delete-media-capture').show();

  // $('.main').append('<div class="cell new-cell"></div>');
  // $('.cell[data-status="cell-en-cours"] .video-view').clone().appendTo('.new-cell').show();
  // // $('.new-cell').removeClass('new-cell');
  // // var cellToAdd = '<div class="flash preview preview_image"><img class="output"> <a href="#" title="Dodoc media" class="button-wrapper_deleteMediaCapture js--delete-media-capture"><div class="btn icon"></div></a></div>'
  // $('.cell[data-status="cell-en-cours"]').clone().appendTo('.main').attr('data-status','').find('.video-view').show();
  // $('.cell[data-status="cell-en-cours"]')
  //   .find('.video-view').remove()
  //   .end()
  //   .find('.preview_image')
  //   .addClass('image-done')
  //   .removeClass('preview_image');
  // $(".image-done").show();
  photoDisplay();

}

function onDisplayPage(data){
  console.log(data.images);

  boitierExterne.init();
  photoDisplay();
  currentStream.init()
    .then( function() {
      $('.js--modeSelector[data-mediatype="photo"]').trigger( 'click');
    }, function(err) {
      console.log("failed to init : " + err);
    });

  // delete file
  $('body').on('click', '.js--delete-media-capture', function(){
    var mediaToDelete =
    {
      "mediaName" : $(document).data('lastCapturedMediaName'),
      "mediaFolderPath" : $(document).data('lastCapturedMediaFolderPath'),
    }
    sendData.deleteMedia( mediaToDelete);
  });

  var cellIndex = $('.cell[data-status="en-cours"]').attr('data-index');
  var previewDiv = '<div class="flash preview preview_image"><img class="output"> <a href="#" title="Dodoc media" class="button-wrapper_deleteMediaCapture js--delete-media-capture"><div class="btn icon"><img src="../images/clear.svg"></div></a></div>';
  for(var i=0; i < data.images.length; i++){
    $('.cell[data-status="en-cours"]')
    .attr('data-status', '')
    .clone().appendTo('.main')
    .attr('data-status', 'en-cours')
    .attr('data-index', (+cellIndex)+1);

    var cellIndex = $('.cell[data-status="en-cours"]').attr('data-index');
    var prevCell = (+cellIndex)-1;
    
    $('.cell[data-index="'+prevCell+'"]')
    .find('.video-view').remove()
    .end()
    .append(previewDiv);
      var $preview = $('.cell[data-index="'+prevCell+'"]').find(".preview_image");
      $preview.find('.output').attr("src", 'images/'+data.images[i]+'.jpg');
      $preview.find('.js--delete-media-capture').show();
  }

}


function justCaptured() {
  // passer le body en "data-justcaptured=yes" pendant un temps
  $('body').attr('data-justcaptured', 'yes');
  setTimeout( function() {
    $('body').attr('data-justcaptured', '');
  }, 400);
}

function mediaJustCaptured() {
  return $('body').attr('data-justcaptured') === 'yes';
}

