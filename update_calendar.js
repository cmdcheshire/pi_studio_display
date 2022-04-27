/// CALENDAR UPDATE LOOP, RUNS EVERY 15 SECONDS

const https = require("https");
const ical = require('node-ical');
const fs = require('fs');
const request = require('request');
const IcalExpander = require('ical-expander');



var calURL = 'https://outlook.office365.com/owa/calendar/1ab3bbb901af444ea3250ea200edf6f8@foxsports.net/82dd488aa3e64886b0f9be2dee6371016084290547206369715/calendar.ics'

// Update calendar from outlook loop
setInterval(function() {
    // Check for internet before updating file
    require('dns').resolve('www.google.com', function(err) {
        if (err) {
           console.log("No connection");
        } else {
            console.log("Internet connection verified");
            //Deletes old calendar file
            var calendarExists = fs.existsSync('data/calendar.ics');
            console.log('calendar file exists? ' + calendarExists);

            if (calendarExists) {
                fs.unlink('data/calendar.ics',function(err){
                    if(err) return console.log(err);
                    console.log('file deleted successfully');
                });
            };
            console.log('t')
            //Download the current calendar and write to a json
            download(calURL, 'data/calendar.ics', function (){

                if (fs.existsSync('data/calendar.ics')) {
                    console.log('file verified, converting...')
                    // use the sync function parseFile() to parse this ics file
                    var events = ical.sync.parseFile('data/calendar.ics');
                    
                    //fix for the broken ical library, adds EXDATE parameter to JSON
                    console.log("Looking for exceptions to recurring events...");
                    eventsKeys = Object.keys(events);
                    //Remove calendar header data from key list
                    eventsKeys.splice(0, 2);
                    var icsString = fs.readFileSync('data/calendar.ics', {"encoding":"utf8"});
                    icsString = icsString.replace(/\s+/g, '');                                  // Removes whitespace from ICS
                    icsString = icsString.replace(/(\r\n|\n|\r)/gm, '');                      // Replaces line breaks with whitespace
                    fs.writeFile('data/calendar_clean.txt', icsString, (err) => {
                        if (err) {
                            throw err;
                        }
                        console.log("Clean calendar string saved.");
                    });
                    //Finds UIDs of events with RRULE and adds them to an array
                    var lastKey = "";
                    eventsKeys.forEach((key) => {
                        if (`${events[key].rrule}` === 'undefined') {} else {
                            // console.log('Preceding key is: '+`${events[lastKey].summary}`);
                            // console.log(lastKey);
                            console.log('Recurring show is: '+`${events[key].summary}`);
                            //console.log(key);
                            var masterUID = `${key}`;
                            //console.log(masterUID);
                            var matchStr = eval("/UID:"+lastKey+"([\\s\\S]*)UID:"+masterUID+"(?=SUMMARY)/gmi"); //Matches the string between the recurring event UID and the preceding UID
                            //console.log(matchStr);
                            var subStr = icsString.match(matchStr);
                            subStr = subStr[0].toString();
                            matchStr = /(?<=EXDATE;)[\s\S]*(?=UID:)/;
                            subStr = subStr.match(matchStr);
                            if (subStr) { 
                                subStr = subStr[0].toString() 
                                console.log('EXDATES are:' + subStr);
                                events[key].exdates = subStr;
                            } else {
                                console.log('No EXDATES found');
                            };
                            
                        };
                        lastKey = key;
                        
                    });

                    //Expands recurrences to JSON object
                    const ics = fs.readFileSync('data/calendar.ics', 'utf-8');

                    //Maps dates for the next week
                    const icalExpander = new IcalExpander({ ics, maxIterations: 1000 });
                    var today = new Date();
                    var yesterday = new Date();
                    var plusOneWeek = new Date();
                    yesterday = yesterday.setDate(today.getDate() - 1);
                    plusOneWeek = plusOneWeek.setDate(today.getDate() + 7);
                    //console.log(yesterday);
                    //console.log(plusOneWeek);

                    const expanderEvents = icalExpander.between(new Date(yesterday), new Date(plusOneWeek));

                    const mappedEvents = expanderEvents.events.map(e => ({ startDate: e.startDate, endDate: e.endDate, summary: e.summary }));
                    const mappedOccurrences = expanderEvents.occurrences.map(o => ({ startDate: o.startDate, endDate: o.endDate, summary: o.item.summary }));
                    //console.log(mappedOccurrences);
                    const allEvents = [].concat(mappedEvents, mappedOccurrences);
                    
                    // convert object to JSON string
                    const eventsJSON = JSON.stringify(events);
                    // saves data to file
                    fs.writeFile('data/calendar.json', eventsJSON, (err) => {
                        if (err) {
                            throw err;
                        }
                        console.log("JSON data is saved.");
                    });

                    // convert recurrences to JSON string
                    const allEventsJSON = JSON.stringify(allEvents);
                    // saves data to file
                    fs.writeFile('data/calendar_recurrences.json', allEventsJSON, (err) => {
                        if (err) {
                            throw err;
                        };
                        console.log("Recurrences data is saved.");
                    });

                } else {
                    console.log('file could not be verified');
                };
            });
        };
      });
}, 60000); //Calendar data updates every 60 seconds

// Function definitions ===================================================================================

//***will delete previous file */
function download(url, dest, cb) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest, { flags: "wx" });
        const request = https.get(url, response => {
            if (response.statusCode === 200) {
                response.pipe(file);
            } else {
                file.close();
                fs.unlink(dest, () => {}); // Delete temp file
                reject(`Server responded with ${response.statusCode} ${response.statusMessage}`);
            }
        });

        request.on("error", err => {
            file.close();
            fs.unlink(dest, () => {}); // Delete temp file
            reject(err.message);
        });

        file.on("finish", () => {
            console.log('new calendar downloaded');
            resolve();
            file.close(cb);
        });

        file.on("error", err => {
            file.close();

            if (err.code === "EEXIST") {
                reject("File already exists");
            } else {
                fs.unlink(dest, () => {}); // Delete temp file
                reject(err.message);
            }
        });

    }).catch(err => console.error("Promise rejected. " + err));
};