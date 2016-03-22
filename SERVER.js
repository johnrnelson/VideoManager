/*


*/
var CONFIG = {
    PATHS: {
        WEB: __dirname + '/www/html',
        UPLOADS: __dirname + '/www/html/uploads'
    },
    TCP_PORT: 4000
};

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

    switch (headders.route) {

        case "remove":
            fs.unlink(CONFIG.PATHS.UPLOADS + pathname,  function(err, files) {
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
           

            Request.on('data', function(data) { 
                // chunk is the Uint8Array object
                fs.appendFile(CONFIG.PATHS.UPLOADS + pathname, new Buffer(data), 'binary', function(err) {
                    if (err) {
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
            //if all else fails then we fall back on this bad boy...
            switch (pathname) {
                case "/":
                    pathname = '/index.html';
                    break; 
                default:
                    if ((pathname == '') | (pathname == '/')) {
                        pathname = 'HTML/index.html'
                    }
                    break;
            }

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
        ".appcache": "text/cache-manifest",
        ".3gp": "video/3gpp",
        ".a": "application/octet-stream",
        ".ai": "application/postscript",
        ".aif": "audio/x-aiff",
        ".aiff": "audio/x-aiff",
        ".asc": "application/pgp-signature",
        ".asf": "video/x-ms-asf",
        ".asm": "text/x-asm",
        ".asx": "video/x-ms-asf",
        ".atom": "application/atom+xml",
        ".au": "audio/basic",
        ".avi": "video/x-msvideo",
        ".bat": "application/x-msdownload",
        ".bin": "application/octet-stream",
        ".bmp": "image/bmp",
        ".bz2": "application/x-bzip2",
        ".c": "text/x-c",
        ".cab": "application/vnd.ms-cab-compressed",
        ".cc": "text/x-c",
        ".chm": "application/vnd.ms-htmlhelp",
        ".class": "application/octet-stream",
        ".com": "application/x-msdownload",
        ".conf": "text/plain",
        ".cpp": "text/x-c",
        ".crt": "application/x-x509-ca-cert",


        ".crx": "application/x-chrome-extension", //CHROME extension stuff...


        ".css": "text/css",
        ".csv": "text/csv",
        ".cxx": "text/x-c",
        ".deb": "application/x-debian-package",
        ".der": "application/x-x509-ca-cert",
        ".diff": "text/x-diff",
        ".djv": "image/vnd.djvu",
        ".djvu": "image/vnd.djvu",
        ".dll": "application/x-msdownload",
        ".dmg": "application/octet-stream",
        ".doc": "application/msword",
        ".dot": "application/msword",
        ".dtd": "application/xml-dtd",
        ".dvi": "application/x-dvi",
        ".ear": "application/java-archive",
        ".eml": "message/rfc822",
        ".eps": "application/postscript",
        ".exe": "application/x-msdownload",
        ".f": "text/x-fortran",
        ".f77": "text/x-fortran",
        ".f90": "text/x-fortran",
        ".flv": "video/x-flv",
        ".for": "text/x-fortran",
        ".gem": "application/octet-stream",
        ".gemspec": "text/x-script.ruby",
        ".gif": "image/gif",
        ".gz": "application/x-gzip",
        ".h": "text/x-c",
        ".hh": "text/x-c",
        ".htm": "text/html",
        ".html": "text/html",
        ".ico": "image/vnd.microsoft.icon",
        ".ics": "text/calendar",
        ".ifb": "text/calendar",
        ".iso": "application/octet-stream",
        ".jar": "application/java-archive",
        ".java": "text/x-java-source",
        ".jnlp": "application/x-java-jnlp-file",
        ".jpeg": "image/jpeg",
        ".jpg": "image/jpeg",
        ".js": "application/javascript",
        ".json": "application/json",
        ".log": "text/plain",
        ".m3u": "audio/x-mpegurl",
        ".m4v": "video/mp4",
        ".man": "text/troff",
        ".mathml": "application/mathml+xml",
        ".mbox": "application/mbox",
        ".mdoc": "text/troff",
        ".me": "text/troff",
        ".mid": "audio/midi",
        ".midi": "audio/midi",
        ".mime": "message/rfc822",
        ".mml": "application/mathml+xml",
        ".mng": "video/x-mng",
        ".mov": "video/quicktime",
        ".mp3": "audio/mpeg",
        ".mp4": "video/mp4",
        ".mp4v": "video/mp4",
        ".mpeg": "video/mpeg",
        ".mpg": "video/mpeg",
        ".ms": "text/troff",
        ".msi": "application/x-msdownload",
        ".odp": "application/vnd.oasis.opendocument.presentation",
        ".ods": "application/vnd.oasis.opendocument.spreadsheet",
        ".odt": "application/vnd.oasis.opendocument.text",
        ".ogg": "application/ogg",
        ".p": "text/x-pascal",
        ".pas": "text/x-pascal",
        ".pbm": "image/x-portable-bitmap",
        ".pdf": "application/pdf",
        ".pem": "application/x-x509-ca-cert",
        ".pgm": "image/x-portable-graymap",
        ".pgp": "application/pgp-encrypted",
        ".pkg": "application/octet-stream",
        ".pl": "text/x-script.perl",
        ".pm": "text/x-script.perl-module",
        ".png": "image/png",
        ".pnm": "image/x-portable-anymap",
        ".ppm": "image/x-portable-pixmap",
        ".pps": "application/vnd.ms-powerpoint",
        ".ppt": "application/vnd.ms-powerpoint",
        ".ps": "application/postscript",
        ".psd": "image/vnd.adobe.photoshop",
        ".py": "text/x-script.python",
        ".qt": "video/quicktime",
        ".ra": "audio/x-pn-realaudio",
        ".rake": "text/x-script.ruby",
        ".ram": "audio/x-pn-realaudio",
        ".rar": "application/x-rar-compressed",
        ".rb": "text/x-script.ruby",
        ".rdf": "application/rdf+xml",
        ".roff": "text/troff",
        ".rpm": "application/x-redhat-package-manager",
        ".rss": "application/rss+xml",
        ".rtf": "application/rtf",
        ".ru": "text/x-script.ruby",
        ".s": "text/x-asm",
        ".sgm": "text/sgml",
        ".sgml": "text/sgml",
        ".sh": "application/x-sh",
        ".sig": "application/pgp-signature",
        ".snd": "audio/basic",
        ".so": "application/octet-stream",
        ".svg": "image/svg+xml",
        ".svgz": "image/svg+xml",
        ".swf": "application/x-shockwave-flash",
        ".t": "text/troff",
        ".tar": "application/x-tar",
        ".tbz": "application/x-bzip-compressed-tar",
        ".tci": "application/x-topcloud",
        ".tcl": "application/x-tcl",
        ".tex": "application/x-tex",
        ".texi": "application/x-texinfo",
        ".texinfo": "application/x-texinfo",
        ".text": "text/plain",
        ".tif": "image/tiff",
        ".tiff": "image/tiff",
        ".torrent": "application/x-bittorrent",
        ".tr": "text/troff",
        ".ttf": "application/x-font-ttf",
        ".txt": "text/plain",
        ".vcf": "text/x-vcard",
        ".vcs": "text/x-vcalendar",
        ".vrml": "model/vrml",
        ".war": "application/java-archive",
        ".wav": "audio/x-wav",
        ".wma": "audio/x-ms-wma",
        ".wmv": "video/x-ms-wmv",
        ".wmx": "video/x-ms-wmx",
        ".wrl": "model/vrml",
        ".wsdl": "application/wsdl+xml",
        ".xbm": "image/x-xbitmap",
        ".xhtml": "application/xhtml+xml",
        ".xls": "application/vnd.ms-excel",
        ".xml": "application/xml",
        ".xpm": "image/x-xpixmap",
        ".xsl": "application/xml",
        ".xslt": "application/xslt+xml",
        ".yaml": "text/yaml",
        ".yml": "text/yaml",
        ".zip": "application/zip"
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
    console.log("Server running on port:" + CONFIG.TCP_PORT + '\r\nNode Version  ...' + process.version);


} //Ok done with trying... catch any errors that might happen and kick it to the console...
catch (ERROR) {
    console.log("\r\n ****************************************************** \r\n\r\n");
    console.log("Error running server!");
    console.log('Error Type:' + ERROR.type + '\t' + ERROR.message);
    console.log("\r\n ****************************************************** \r\n\r\n");

}
