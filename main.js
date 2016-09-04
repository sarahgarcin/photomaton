var fs = require('fs-extra'),
	glob = require("glob"),
	path = require("path"),
	moment = require('moment');
	var exec = require('child_process').exec;
	var easyimg = require('easyimage');
	var phantom = require('phantom');
	var _ph, _page, _outObj;

module.exports = function(app, io){

	console.log("main module initialized");

	io.on("connection", function(socket){
		// DODOC part
		socket.on("newMedia", onNewMedia);
		socket.on("deleteMedia", onDeleteMedia);

		// generate PDF
		socket.on('generate', generatePdf);

		// display Page to save everything
		displayPage(socket);

	});


// ------------- F U N C T I O N S -------------------
	
		// save data in json file
	function displayPage(socket){
		var jsonFile = "content/data.json";

		var jsonObject = {
			images: []
		}

		if (! fs.existsSync(jsonFile)){
			console.log("File does not exist!");
			var dataToWrite = JSON.stringify(jsonObject, null, 4);//,null,4);
			try {
			  fs.writeFileSync(jsonFile, dataToWrite);
			  console.log("JSON saved to " + jsonFile);
			} 
			catch (err) {
			  return console.log(err);
			}
		}
		else{
			var obj = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
			socket.emit('displayPageEvents', obj);
		}
	}

// Generate PDF
	function generatePdf(html){	

		var date = getCurrentDate();

		var sitepage = null;
		var phInstance = null;
		phantom.create()
		    .then(instance => {
		        phInstance = instance;
		        return instance.createPage();
		    })
		    .then(page => {
		        sitepage = page;
		        return page.open('https://localhost:8080/');
		    })
		    .then(status => {
		        console.log(status);
		        return sitepage.property('content');
		    })
		    .then(content => {
		        console.log(content);
		        sitepage.close();
		        phInstance.exit();
		    })
		    .catch(error => {
		        console.log(error);
		        phInstance.exit();
		    });

		// phantom.create([
	 //  '--ignore-ssl-errors=yes',
	 //  '--ssl-protocol=any', 
	 //  '--load-images=yes',
	 //  '--local-to-remote-url-access=yes'
		// ]).then(function(ph) {
		//   ph.createPage().then(function(page) {
		//   	page.open('https://localhost:8080/')
		//   	.then(function(){
		//   		console.log(page.property('content'));
		//   		page.property('viewportSize', {width: 1280, height: 800});
		//   		// page.property('paperSize', {format: 'A4', orientation: 'landscape'})
		//   		page.property('paperSize', {width: 795, height: 1125})
		//   		.then(function() {

		// 	  		return page.property('content')
		// 	    	.then(function() {
		// 		      setTimeout(function(){
		// 			      page.render('content/pdf/'+date+'.pdf').then(function() {
		// 			      	console.log('success');
		// 			      	page.close();
		// 				    	ph.exit();
		// 			      });
		// 		     	}, 2000)
		// 		    });
		// 		  });
		//     });
		//   });
		// });
	}

// ------------- D O D O C -------------------
	function onNewMedia( mediaData) {
		// console.log(mediaData)
		var newFileName = getCurrentDate();
		var pathToFile = '';
		var fileExtension;

		var mediaPath = 'content/images';
    pathToFile = mediaPath + '/' + newFileName;

    fileExtension = '.jpg';
    var imageBuffer = decodeBase64Image(mediaData.mediaData);

    fs.writeFile( pathToFile + fileExtension, imageBuffer.data, function(err) {
      if (err) reject( err);
      console.log("Image added at path " + pathToFile);
      sendEventWithContent( 'mediaCreated', {'path':pathToFile, 'file':newFileName});
    });

    // write element into json
    var obj = JSON.parse(fs.readFileSync('content/data.json', 'utf8'));
		obj.images.push(newFileName);

		fs.writeFileSync('content/data.json', JSON.stringify(obj,null, 4));
	}

	function onDeleteMedia( mediaData) {
		console.log(mediaData);

		var mediaName = mediaData.mediaName;
		var pathToMediaFolder = 'content/images';
		var filesInMediaFolder = fs.readdirSync( pathToMediaFolder);
		var delDir = pathToMediaFolder+'/deleted';

    if (!fs.existsSync(delDir)){
		  fs.mkdirSync(delDir);
		}
    
    filesInMediaFolder.forEach( function( filename) {
      var fileNameWithoutExtension = new RegExp( "(.+?)(\\.[^.]*$|$)", 'i').exec( filename)[1];
      if( fileNameWithoutExtension === mediaName) {
        var filePath = pathToMediaFolder + '/' + filename;
        var newFilePath = pathToMediaFolder + '/deleted/' + filename;
        fs.renameSync( filePath, newFilePath);
        console.log( "A file will be deleted (actually, renamed but hidden from dodoc) : \n - " + filePath + "\n - " + newFilePath);
      }
    });
	}

	function sendEventWithContent( sendEvent, objectContent, socket) {
    io.sockets.emit( sendEvent,objectContent);
  }

	function getCurrentDate() {
    return moment().format("YYYYMMDD_HHmmss");
  }

  // Décode les images en base64
	// http://stackoverflow.com/a/20272545
	function decodeBase64Image(dataString) {

  	console.log("Decoding base 64 image");

		var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
		response = {};

		if (matches.length !== 3) {
			return new Error('Invalid input string');
		}

		response.type = matches[1];
		response.data = new Buffer(matches[2], 'base64');

		return response;
	}



// - - - END FUNCTIONS - - - 
};
