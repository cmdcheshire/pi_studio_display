var currentCalendar = {};
var calendarKeys = [];
var currentEvent = {};
var nextEvent = {};
var inUseUpdated = false;
var upNextUpdated = false;
var recurringEvents = [];

setInterval(function(){
  readTextFile("data/calendar.json", function(text){
    var currentTime = Date.now();
    //console.log(currentTime);
    currentCalendar = JSON.parse(text);
    //console.log(currentCalendar);
    calendarKeys = Object.keys(currentCalendar);

    //Remove calendar header data
    calendarKeys.splice(0, 2);

    //Resets next event loop triggers
    inUseUpdated = false;
    upNextUpdated = false;

    // Find current event, if any
    calendarKeys.forEach((key) => {
      //console.log(`${currentCalendar[key].summary}`);
      if ((`${currentCalendar[key].summary}`).includes("5th Fl") | (`${currentCalendar[key].summary}`).includes("5A")) { //////////// DEFINES KEYWORDS FOR DISPLAYING EVENTS
        //console.log(`${currentCalendar[key].summary}`)
        //Finds times of selected event
        var eventTime = Date.parse(`${currentCalendar[key].start}`);
        //console.log('cur ' + currentTime + ' event ' + eventTime);
        var endTime = Date.parse(`${currentCalendar[key].end}`);
        //Sets current event if in progress
        if (endTime > currentTime && eventTime < currentTime && inUseUpdated === false) {
          console.log('Current event detected, updating...')
          currentEvent = {
            key:`${key}`,
            name:`${currentCalendar[key].summary}`,
            start:`${currentCalendar[key].start}`,
            rawStart:Date.parse(`${currentCalendar[key].start}`),
            end:`${currentCalendar[key].end}`,
            rawEnd:Date.parse(`${currentCalendar[key].end}`),
            recurrence:false
          };
          //Stops looking for current event
          inUseUpdated = true;
        } else if (typeof currentCalendar[key].recurrences !== "undefined"){
          // CHECKS FOR RECURRING EVENTS IN EVENT LIST
          //console.log('Checking for recurring instances of '+`${currentCalendar[key].summary}`+'...');
          //console.log(currentCalendar[key].recurrences)
          var recurrences = currentCalendar[key].recurrences;
          var recurrencesKeys = Object.keys(recurrences);
          for (var k = 0; k < recurrencesKeys.length; k++) {
            //console.log(k);
            var newRecurrence = {
              key: recurrences[recurrencesKeys[k]].uid,
              name: recurrences[recurrencesKeys[k]].summary,
              start: recurrences[recurrencesKeys[k]].start,
              rawStart: Date.parse(recurrences[recurrencesKeys[k]].start),
              end: recurrences[recurrencesKeys[k]].end,
              rawEnd: Date.parse(recurrences[recurrencesKeys[k]].end),
              recurrence:true
            };
            //console.log(newRecurrence);
            recurringEvents.push(newRecurrence);
          };
        } else {
          //console.log('No current event detected from individual listings...');
        };        
      };
    });

    //Sorts recurring events by time
    recurringEvents.sort((a, b) => a.rawStart - b.rawStart);
    //console.log(recurringEvents);

    //Checks recurring list for missed current events
    for (var k = 0; k < recurringEvents.length; k++) {
      //console.log(recurringEvents[k].name);
      if (recurringEvents[k].name.includes("5th Fl") | recurringEvents[k].name.includes("5A")) {
        if (recurringEvents[k].rawEnd > currentTime && recurringEvents[k].rawStart < currentTime && inUseUpdated === false) {
          console.log('Current event detected, updating...')
          currentEvent = recurringEvents[k];
          //Stops looking for current event
          inUseUpdated = true;
        };
      };
    };

    // Finds next event
    calendarKeys.forEach((key, index) => {
      //console.log(`${currentCalendar[key].summary}`);
      if ((`${currentCalendar[key].summary}`).includes("5th Fl") | (`${currentCalendar[key].summary}`).includes("5A")) { //////////// DEFINES KEYWORDS FOR DISPLAYING EVENTS
        //Finds times of selected event
        var eventTime = Date.parse(`${currentCalendar[key].start}`);
        var endTime = Date.parse(`${currentCalendar[key].end}`);
        //Sets next event, if not yet set
        //console.log(currentTime);
        if (eventTime > currentTime && upNextUpdated === false) {
          //console.log(`${currentCalendar[key].summary}`);
          nextEvent = {
            key:`${key}`,
            name:`${currentCalendar[key].summary}`,
            start:Date.parse(`${currentCalendar[key].start}`),
            end:`${currentCalendar[key].end}`
          };
          //Stops looking for next event
          upNextUpdated = true;
        };
        
      };
      
    });

    //Checks recurring list for missed next events
    for (var k = 0; k < recurringEvents.length; k++) {
      //console.log(recurringEvents[k].name);
      if (recurringEvents[k].name.includes("5th Fl") | recurringEvents[k].name.includes("5A")) {
        if (recurringEvents[k].rawStart > currentTime) {
          //Checks if there's already a next event and compares start times
          if (typeof nextEvent.start != "undefined" && recurringEvents[k].rawStart < nextEvent.start){
          console.log('Next event detected, updating...')
          nextEvent = recurringEvents[k];
          };
          //If there is no next event, this is next event
          if (typeof nextEvent.start === "undefined") {
          console.log('Next event detected, updating...')
          nextEvent = recurringEvents[k];
          };
          //Stops looking for current event
          upNextUpdated = true;
        };
      };
    };

    //Updates UI to reflect current event status
    if (currentEvent.key) {
      console.log('Current Event:');
      console.log(currentEvent);
      //Convert event time to local 12hr format
      var startTime = new Date(currentEvent.start);
      var simpleStartTime = startTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
      var endTime = new Date(currentEvent.end);
      var simpleEndTime = endTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
      //Update current event metadata
      document.getElementById('current-show-name').innerHTML = currentEvent.name;
      document.getElementById('current-start-time').innerHTML = simpleStartTime;
      document.getElementById('current-end-time').innerHTML = simpleEndTime;
      //Switch to current event graphic
      document.getElementById('in-use-wrapper').style.display = "block";
      document.getElementById('open-wrapper').style.display = "none";
      document.getElementById('body-wrapper').style.border = "10px solid red";
    } else {
      console.log('No current event detected.');
      //Switch to studio open graphic
      document.getElementById('in-use-wrapper').style.display = "none";
      document.getElementById('open-wrapper').style.display = "block";
      document.getElementById('body-wrapper').style.border = "10px solid limegreen";
    };

    if (nextEvent.key) {
      console.log('Next Event:');
      console.log(nextEvent);
      //Convert event time to local 12hr format
      var startTime = new Date(nextEvent.start);
      var simpleStartTime = startTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
      var endTime = new Date(nextEvent.end);
      var simpleEndTime = endTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
      //Update next event metadata
      document.getElementById('next-show-name').innerHTML = nextEvent.name;
      document.getElementById('next-start-time').innerHTML = simpleStartTime;
      document.getElementById('next-end-time').innerHTML = simpleEndTime;
    } else {
      //Change to studio open
    };
    
  });

}, 10000); // Refresh Time, (1000 = 1 second)

startTime();

// ********************************** FUNCTION DEFINITIONS **********************************************

function readTextFile(file, callback) {
  var rawFile = new XMLHttpRequest();
  rawFile.overrideMimeType("application/json");
  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = function() {
      if (rawFile.readyState === 4 && rawFile.status == "200") {
          callback(rawFile.responseText);
      }
  }
  rawFile.send(null);
};

// Makes clock run
function startTime() {
  var time = new Date();
  var simpleTime = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  console.log(simpleTime);
  document.getElementById('clock').innerHTML =  simpleTime;
  setTimeout(startTime, 1000);
};
  
function checkTime(i) {
  if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
  return i;
};