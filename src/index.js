require('dotenv').load();

var http       = require('http')
  , AlexaSkill = require('./AlexaSkill')
  , APP_ID     = process.env.APP_ID
  , MTA_KEY    = process.env.MTA_KEY;

var url = function(stopId){
  return 'http://bustime.mta.info/api/siri/stop-monitoring.json?key=' + MTA_KEY + '&OperatorRef=MTA&MaximumStopVisits=1&MonitoringRef=' + stopId;
};

var getJsonFromMta = function(stopId, callback){
  http.get(url(stopId), function(res){
    var body = '';

    res.on('data', function(data){
      body += data;
    });

    res.on('end', function(){
      var result = JSON.parse(body);
      callback(result);
    });

  }).on('error', function(e){
    console.log('Error: ' + e);
  });
};

var handleNextBusRequest = function(intent, session, response){
  getJsonFromMta(intent.slots.bus.value, function(data){
    if(data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit){
      var text = data
                  .Siri
                  .ServiceDelivery
                  .StopMonitoringDelivery[0]
                  .MonitoredStopVisit[0]
                  .MonitoredVehicleJourney
                  .MonitoredCall
                  .Extensions
                  .Distances
                  .PresentableDistance;
      var cardText = 'The next bus is: ' + text;
    } else {
      var text = 'That bus stop does not exist.'
      var cardText = text;
    }

    var heading = 'Next bus for stop: ' + intent.slots.bus.value;
    response.tellWithCard(text, heading, cardText);
  });
};

var BusSchedule = function(){
  AlexaSkill.call(this, APP_ID);
};

BusSchedule.prototype = Object.create(AlexaSkill.prototype);
BusSchedule.prototype.constructor = BusSchedule;

BusSchedule.prototype.eventHandlers.onSessionStarted = function(sessionStartedRequest, session){
  // What happens when the session starts? Optional
  console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
      + ", sessionId: " + session.sessionId);
};

BusSchedule.prototype.eventHandlers.onLaunch = function(launchRequest, session, response){
  // This is when they launch the skill but don't specify what they want. Prompt
  // them for their bus stop
  var output = 'Welcome to Bus Schedule. ' +
    'Say the number of a bus stop to get how far the next bus is away.';

  var reprompt = 'Which bus stop do you want to find more about?';

  response.ask(output, reprompt);

  console.log("onLaunch requestId: " + launchRequest.requestId
      + ", sessionId: " + session.sessionId);
};

BusSchedule.prototype.intentHandlers = {
  GetNextBusIntent: function(intent, session, response){
    handleNextBusRequest(intent, session, response);
  },

  HelpIntent: function(intent, session, response){
    var speechOutput = 'Get the distance from arrival for any NYC bus stop ID. ' +
      'Which bus stop would you like?';
    response.ask(speechOutput);
  }
};

exports.handler = function(event, context) {
    var skill = new BusSchedule();
    skill.execute(event, context);
};
