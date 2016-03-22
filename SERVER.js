/*
    First, setup any special values you want for this server to recognize and respect. Treat the CONFIG variable/object as the golden 
    rule of this server... 
*/
var CONFIG = {
    PATHS: {
        WEB: __dirname + '/www/html',
        UPLOADS: __dirname + '/www/html/uploads'
    },
    TCP_PORT: 4000 //Change this to another TCP/IP Port if you like...
};



/*
    Bring in the required libraries we plan on using in the scope of this source file....
*/
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');





/*
    This is your actual web server. Based on the request it will 
    send out a response... :-)
*/
function WebService(Request, Response) {

    var url_parts = url.parse(Request.url, true);

    //Path is part of the routing...
    var pathname = url_parts.pathname;

    //We use headers for routing and discovering...
    var headders = Request.headers;


    // Just in case you need some extra information about the route..
    var query = url_parts.query;



    /*
        We use the route variable of the header to figure out what the client 
        really wants to do. An easy switch statement lets us branch off the 
        reactions the server has to the choices the client made....
    */
    switch (headders.route) {
        case "remove":
            /*
                The user wants to remove a file on the server. We assume ,if they 
                use this application at all, then they are privileged enough to 
                tell the server to delete a file in our predetermined upload 
                folder...
            */
            fs.unlink(CONFIG.PATHS.UPLOADS + pathname, function(err, files) {
                if (err) {
                    debugger;
                }
                else {

                    Response.writeHead(200, {
                        "Content-Type": "application/json"
                    });

                    Response.end(JSON.stringify({
                        errmsg: '' //No error means no problems...
                    }));

                }
            });
            // fs.readdir(CONFIG.PATHS.UPLOADS,x);
            break
        case "list":
            /*
                The user needs a complete list of files we have in our upload 
                folder. We just use file names for now. Later we can include stats 
                like file datetime or size....
            */
            fs.readdir(CONFIG.PATHS.UPLOADS, function(err, files) {
                if (err) {
                    debugger;
                }
                else {
                    Response.writeHead(200, {
                        "Content-Type": "application/json"
                    });
                    Response.end(JSON.stringify(files));
                }
            });
            break
        case "upload":
            /*
                The user is sending raw binary data so just stuff it in the 
                file. No need to try and process or analyze anything here. 
                Basic read and write is all we need...
            */
            Request.on('data', function(data) {
                //Date in goes right to the file...
                fs.appendFile(CONFIG.PATHS.UPLOADS + pathname, new Buffer(data), 'binary', function(err) {
                    if (err) {
                        //Yikes... check permissions...
                        debugger;
                    }
                });
            });
            Request.on('end', function() {
                Response.writeHead(200, {
                    "Content-Type": "application/json"
                });
                Response.end(JSON.stringify({
                    errmsg: '' //No error means no problems...
                }));
            });
            break;


        default:
            /*
                So the user did not supply a header value to let us know how to 
                route. Therefore we simply do a basic file read and write based 
                on the content type. Nothing dynamic: just file in and out. 
                The only exception is if there is no path name. Then we 
                substitute the index.html file as an assumption.... 
            */
            if ((pathname == '') | (pathname == '/')) {
                pathname = '/index.html'
            }



            //Make sure the client is not trying to do the hacky thing...
            var path2file = CONFIG.PATHS.WEB + path.normalize(pathname);
            var typeOfFile = GetFileTypeByFilePath(pathname);



            if (typeOfFile == 'video/mp4') {
                var range = headders.range;
                if (!range) {
                    // send file as is...
                    var stat = fs.statSync(path2file);

                    Response.writeHead(200, {
                        'Content-Type': 'video/mp4',
                        'Content-Length': stat.size
                    });

                    var readStream = fs.createReadStream(path2file);
                    readStream.pipe(Response);


                }
                else {

                    var positions = range.replace(/bytes=/, "").split("-");
                    var start = parseInt(positions[0], 10);

                    fs.stat(path2file, function(err, stats) {
                        var total = stats.size;
                        var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
                        var chunksize = (end - start) + 1;

                        Response.writeHead(206, {
                            "Content-Range": "bytes " + start + "-" + end + "/" + total,
                            "Accept-Ranges": "bytes",
                            "Content-Length": chunksize,
                            "Content-Type": "video/mp4"
                        });

                        var stream = fs.createReadStream(path2file, {
                                start: start,
                                end: end
                            })
                            .on("open", function() {
                                stream.pipe(Response);
                            }).on("error", function(err) {
                                Response.end(err);
                            });
                    });


                }
            }
            else {
                //Serve up the static files...
                fs.readFile(path2file, function(err, data) {
                    if (err) {
                        Response.writeHead(404, {
                            "Content-Type": "text/html"
                        });

                        Response.end('I could not find what you where looking for!');
                    }
                    else {
                        Response.writeHead(200, {
                            "Content-Type": GetFileTypeByFilePath(pathname)
                        });

                        Response.end(data);
                    }
                });

            }


    }
}






//Simple lookup to get the extension of a file and figure out which MIME type to use for out bound files using HTTP...
function GetFileTypeByFilePath(FilePath) {
    var DEFAULT_MIME = 'application/octet-stream';
    var index = FilePath.lastIndexOf(".");
    var returnValue = '';

    var Known_File_Types = {
        ".css": "text/css",
        ".crx": "application/x-chrome-extension", //CHROME extension stuff...
        ".htm": "text/html",
        ".html": "text/html",
        ".ico": "image/vnd.microsoft.icon",
        ".mp3": "audio/mpeg",
        ".mp4": "video/mp4",
        ".mp4v": "video/mp4",
        ".mpeg": "video/mpeg",
        ".mpg": "video/mpeg",
          
    };


    returnValue = Known_File_Types[FilePath.substring(index).toLowerCase()];
    if (!returnValue) {
        return DEFAULT_MIME;
    }
    else {
        return returnValue;
    }

}






try {


    // Configure our HTTP server to respond to network requests...
    var server = http.createServer(WebService).listen(CONFIG.TCP_PORT);

    // Put a friendly message on the terminal...
    console.log('Node Version  ...' + process.version);
    console.log('HHH  ...' + require('os').hostname());
    // console.log("Server running on port:" + CONFIG.TCP_PORT);

    require('dns').lookup(require('os').hostname(), function(err, add, fam) {
        console.log('addr: ' + add);
    })

    // console.log("Server :" + JSON.stringify(serverAddyInfo));


} //Ok done with trying... catch any errors that might happen and kick it to the console...
catch (ERROR) {
    console.log("\r\n ****************************************************** \r\n\r\n");
    console.log("Error running server!");
    console.log('Error Type:' + ERROR.type + '\t' + ERROR.message);
    console.log("\r\n ****************************************************** \r\n\r\n");

}
