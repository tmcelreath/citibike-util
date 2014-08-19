var request = require('request');
var mongoose = require('mongoose');
var schedule = require('node-schedule');
// var stationStatus = require('StationStatusDB');

mongoose.connect('mongodb://localhost/citibike');

var StationStatus = mongoose.model('StationStatus', { 
    'date': Date, 
    'id': Number, 
    'status':String,
    'bikes': Number, 
    'docks': Number, 
    'year':Number, 
    'month':Number, 
    'day':Number, 
    'weekday':Number,
    'hour':Number,
    'minute':Number
});

var options = {
    url: 'http://appservices.citibikenyc.com/data2/stations.php?updateOnly=true',
    json: true,
    headers: {
        'User-Agent': 'request'
    }
};

var station_status_job = schedule.scheduleJob('0,15,30,45 * * * *', function() {
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var lastupdate = body.lastUpdate;
            var results = body.results;
            var date = new Date(Number(lastupdate)*1000);
            
            var query = StationStatus.findOne({'year':date.getFullYear(),'month':date.getMonth(),'day':date.getDate(),'hour':date.getHours(),'minute':date.getMinutes()});
            query.exec(function(err, existing_record) {
                console.log('HAS EXISTING: ' + (existing_record != null)); 
                if(existing_record == null) { 
                    console.log('SAVING ' + results.length + 'records for ' + date);
                    results.forEach(function(result) {
                        var stationStatus = new StationStatus({
                            'date':date, 
                            'id':result.id, 
                            'status':result.status,
                            'bikes':result.availableBikes, 
                            'docks':result.availableDocks,
                            'year':date.getFullYear(),
                            'month':date.getMonth(),
                            'day':date.getDate(),
                            'weekday':date.getDay(),
                            'hour':date.getHours(),
                            'minute':date.getMinutes()
                        });
                        stationStatus.save(function(err) {
                            if(err) {
                                console.log('ERROR: ' + err);
                            } else {
                                console.log('SAVED: ' + stationStatus.id + '|' + stationStatus.bikes + '|' + stationStatus.docks);
                            }
                        });
                    });
                };
            });
        };
    });
});