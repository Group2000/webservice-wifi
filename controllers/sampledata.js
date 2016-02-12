
var esClient = require('../config/elasticsearch').esClient;
var config = require('../config/config');
var logger = require('../utils/logger');
var crypto = require('crypto');

var sampleCount=10;

var defaultsample=
	{
		bssid:'DE:AD:BE:EF:00:',
		ssid:'test Wifi Network',
		frequency:2462000000,
		mode:'Master',
		encryption:true,
		encryptiontype:'WPA2',
		authenticationtype:'PSK',
		quality:'28/70',
		signal:-80,
		channel:11,
		hdop:0,
		sattellites:0,
		altitude:0,
		source:'Sample Provider',
		location:[5.9220568,52.6792915],
		timestamp:new Date().getTime(),
		measurement:true
	}



function getRandomDate(from, to) {
    if (!from) {
        from = new Date(2015, 5, 1).getTime();
    } else {
        from = from.getTime();
    }
    if (!to) {
        to = new Date().getTime();
    } else {
        to = to.getTime();
    }
    return new Date(from + Math.random() * (to - from));
}

Array.prototype.randomElement=function(){
  return this[Math.floor(Math.random()*this.length)];
};


function createSampleData(){
  	
    //Cwifi
  	for(var i = 0 ;i <= sampleCount; i++){
    
	    var sample=JSON.parse(JSON.stringify(defaultsample));
	    var rndHex=parseInt(255*Math.random()).toString(16).toUpperCase();
	    sample.bssid=sample.bssid + rndHex;
	    sample.ssid=sample.ssid +  rndHex;
	    sample.channel=parseInt(13*Math.random());
	    sample.location=[(5+Math.random()),(52+Math.random())];
	    sample.timestamp=Math.round(getRandomDate().getTime());
	    sample.signal=parseInt(100*Math.random())*-1;
	    var md5sum=crypto.createHash('md5');
	    var id=sample.bssid.toString()+sample.ssid.toString()+sample.location[1].toString()+sample.timestamp.toString();
	    id=md5sum.update(id).digest("hex");
	    esClient.index({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
	    	id:id,
	    	body:sample,
	    },function(err,response){
          	if(err)
            	console.log(err);
			
	    });
    
  	}


  	logger.log('info','Sample Dataset created');
}

createSampleData();