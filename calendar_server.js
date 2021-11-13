const http = require('http');
const fs = require('fs');

const port = 9090;

//Sets up server to host updated calendar
const server = http.createServer(function (req, res) {
    //Allows access from display http request on CORS
    res.writeHead(200, { 
        'Content-Type': 'application/json',  
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'PUT, POST, GET, DELETE, OPTIONS'
    });

    //USING JSON VARIABLE
    // res.write(currentCal, function (err) {
    //     if (err) {
    //         console.log(err);
    //         res.end;
    //     } else {
    //         res.end;
    //     }
    // });
    
    //USING ACUTAL JSON FILE
    fs.readFile('./data/calendar.json', function(error, data){
        if (error) {
            res.writeHead(404);
            res.write('Error: File not Found');
        } else {
            res.write(data);
            console.log("Data written back to server.");
            res.end();
        };
    });

    //TEST
    // res.write('test send', function (err) {
    //     if (err) {
    //         console.log(err);
    //         res.end;
    //     } else {
    //         console.log('test sent');
    //         res.end;
    //     };
    // });

});

server.listen(port, function (err) {
    if (err) {
        console.log('Something went wrong!', err);
    } else {
        console.log('Calendar data server is listening on port ' + port);
    };
});