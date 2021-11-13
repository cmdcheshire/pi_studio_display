/// CALENDAR UPDATE LOOP, RUNS EVERY 15 SECONDS

const https = require("https");
const ical = require('node-ical');
const fs = require('fs');
const request = require('request');

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
                console.log('new calendar downloaded');
                if (fs.existsSync('data/calendar.ics')) {
                    console.log('file verified, converting...')
                    // use the sync function parseFile() to parse this ics file
                    const events = ical.sync.parseFile('data/calendar.ics');
                    // convert object to JSON string
                    const eventsJSON = JSON.stringify(events);
                    // saves data to file
                    fs.writeFile('data/calendar.json', eventsJSON, (err) => {
                        if (err) {
                            throw err;
                        }
                        console.log("JSON data is saved.");
                    });
                } else {
                    console.log('file could not be verified');
                };
            });
        };
      });
}, 15000); //Calendar data updates every 10 seconds

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
                reject(`Server responded with ${response.statusCode}: ${response.statusMessage}`);
            }
        });

        request.on("error", err => {
            file.close();
            fs.unlink(dest, () => {}); // Delete temp file
            reject(err.message);
        });

        file.on("finish", () => {
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
    });
}