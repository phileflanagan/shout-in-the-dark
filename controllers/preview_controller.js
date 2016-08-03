var express = require('express');
var router = express.Router();

var fs = require('fs');

var appRoot = process.cwd();

var config = require(appRoot + '/config.js');

var getImages = require(appRoot + '/helpers/get_images.js');
var memify = require(appRoot + '/helpers/memify.js');

router.get('/', function(req, res){
	var id = new Date().valueOf().toString();
	var fileName = id + '.png';
	var tempFilePath = appRoot + '/public/img/temp/' + fileName;
	var imagesData = {};
	getImages(req.query.q, parseResponse);
	
	function parseResponse(err, data) {
		if (err) {
			console.error('Error: ' + err);
			return res.status(500).send({Error: err});
		}
		imagesData = data;
		var readStream = fs.createReadStream(config.default_transparency_path);
		var writeStream = fs.createWriteStream(tempFilePath);
		readStream.pipe(writeStream);
		writeStream.on('close', generateAndSendResponse);					
	}

	function generateAndSendResponse(err) {
		if (err) {
			console.error('Error: ' + err);
			return res.status(500).send({Error: err});
		}
		memify(tempFilePath, req.query.q, sendResponse);	
	}

	function sendResponse(err) {
		if (err) {
			console.error('Error: ' + err);
			return res.status(500).send({Error: err});
		}
		var response = {
			transparency: '/img/temp/' + fileName,
			images: []
		};
		imagesData.forEach(function(item){
			response.images.push({
				thumb: item.thumbnail.url,
				full: item.url
			});
		});
		res.json(response);
		deleteFileTimer(tempFilePath, 5000, function(err){
			if (err) {
				return console.error(err);
			}
		});
	}

	function deleteFileTimer(path, delay, callback) {
		setTimeout(function(){
			fs.unlink(path, function(err){
				if (err) {
					callback(err)
				} else {
					callback(null)
				}
			});
		}, delay)
	}	
});

module.exports = router;