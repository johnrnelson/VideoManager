/*
    This is the browser code that setups up events and features that this 
    browser can handle. 
*/

var WebApp = {
    //Set the active file after dragging or file dialog...
    ActiveFile: null,
    Elements: {
        //We keep track of the major UI elements so we don't spend too much time
        //looking them up everytime they are used... :-)
    },
    ReadFile: function(FileObject) {
        /*
            Read the file and wrap a record around it so we can keep all the 
            information about a file in one place...
        */
        // debugger;

        var FileRecord = {
            name: FileObject.name,
            ext: FileObject.name.split('.').pop().toLowerCase(),
            file: FileObject,
            element: fileElement
        };



        //Rather than read the file to make sure it's video, we just use the file extension...
        if (FileRecord.ext != 'mp4') {
            // debugger;
            alert('We are only doing MP4 files for now.');
            return;
        }

        // console.log('FileObject', FileObject);
        WebApp.Elements.MovieDisplay.innerHTML = '';

        if (!WebApp.Elements.FileListDisplay.files) {
            WebApp.Elements.FileListDisplay.files = {};
        }

        var fileElement = document.createElement('div');
        FileRecord.element = fileElement;

        var fileInfo = document.createElement('div');
        var fileIconUpload = document.createElement('i');
        var fileIconClose = document.createElement('i');


        var fileVideo = document.createElement('video');

        fileVideo.setAttribute('controls', 'true');
        // // fileVideo.style.height='100%';
        // fileVideo.style.height = '150px';
        // fileVideo.style.width = '100%';


        fileElement.className = "LocalFileDisplay";
        fileInfo.className = "LocalFileDisplayInfo";
        fileVideo.className = "LocalFileDisplayVideo";


        fileElement.FileIconUpload = fileElement.appendChild(fileIconUpload);
        fileElement.FileIconClose = fileElement.appendChild(fileIconClose);
        fileElement.FileInfo = fileElement.appendChild(fileInfo);
        fileElement.FileVideo = fileElement.appendChild(fileVideo);





        fileIconUpload.className = "commands fa fa-cloud-upload  fa-2x";
        fileIconUpload.filename = FileRecord.name;
        fileIconUpload.title = 'Click me to upload this file';
        fileIconUpload.onclick = function() {
            var FileRecord = WebApp.Elements.FileListDisplay.files[this.filename];
            WebApp.UploadFile(FileRecord);
        }


        fileIconClose.className = "commands fa fa-times-circle fa-2x";
        fileIconClose.filename = FileRecord.name;
        fileIconClose.title = 'Click to remove this file';
        fileIconClose.onclick = function() {
            var FileRecord = WebApp.Elements.FileListDisplay.files[this.filename];

            // once it's uploaded we do not need it anymore!
            WebApp.Elements.FileListDisplay.removeChild(FileRecord.element);
            delete WebApp.Elements.FileListDisplay.files[FileRecord.name]
        }


        fileInfo.innerHTML = FileRecord.name;

        //Keep track of the files we are using by doing a memory map...
        WebApp.Elements.FileListDisplay.files[FileObject.name] = FileRecord;


        //Tell the UI we have a brand spanking new HTML element for it to display..
        WebApp.Elements.FileListDisplay.appendChild(FileRecord.element);


        // WebApp.ActiveFile = FileObject;

        var fileReader = new FileReader();
        fileReader.FileRecord = FileRecord;
        fileReader.onload = function(event) {
            FileRecord.element.FileVideo.setAttribute("src", event.target.result);
        };
        fileReader.readAsDataURL(FileObject);
    },
    UploadFile: function(FileRecord) {

        // debugger;
        /*
            Upload the active file by converting into an array and sending 
            it out a new connection to the server...
        */
        var oReq = new XMLHttpRequest();
        var reader = new FileReader();
        reader.onload = function(e) {
            oReq.open("POST", '/' + FileRecord.name, true);
            //We use headers to tell the server what to do. This way we don't mess up the body...
            oReq.setRequestHeader("route", "upload");

            oReq.onload = function(oEvent) {
                var resMSG = JSON.parse(oReq.responseText);
                if (resMSG.errmsg != "") {
                    alert(resMSG.errmsg);
                }
                else {


                    // once it's uploaded we do not need it anymore!
                    WebApp.Elements.FileListDisplay.removeChild(FileRecord.element);
                    delete WebApp.Elements.FileListDisplay.files[FileRecord.name]

                    WebApp.GetList();

                }
            };

            var uInt8Array = new Uint8Array(e.target.result);
            oReq.send(uInt8Array.buffer);
        };
        reader.onerror = function(e) {
            debugger;
            console.error(e);
        };
        reader.readAsArrayBuffer(FileRecord.file);

    },
    GetList: function() {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", '/', true);
        //We use headers to tell the server what to do. This way we don't mess up the body...
        oReq.setRequestHeader("route", "list");

        WebApp.Elements.MovieListDisplay.innerHTML = ""; //clear out any old elements...

        oReq.onload = function(oEvent) {
            var files = JSON.parse(oReq.responseText);

            for (var f = files.length; f--;) {
                var file = files[f];
                var fileElement = document.createElement('div');
                var fileElementName = document.createElement('span');
                var fileElementCloseButton = document.createElement('i');
                var fileElementPlayButton = document.createElement('i');

                fileElement.FileName = file;

                fileElementName.innerHTML = fileElement.FileName;


                fileElement.className = "RemoteFileDisplay";

                fileElementCloseButton.className = "commands fa fa-times-circle";
                fileElementPlayButton.className = "commands fa fa-play-circle";

                fileElementCloseButton.onclick = function(e) {
                    WebApp.RemoveFile(this.parentElement.FileName);
                }

                fileElementPlayButton.onclick = function(e) {
                    WebApp.Elements.MovieDisplay.innerHTML = 'Playing ' + this.parentElement.FileName + ' from the server.';
                    WebApp.Elements.MovieElement.style.display = '';
                    WebApp.Elements.MovieElement.setAttribute('src', '/uploads/' + this.parentElement.FileName);
                }


                fileElement.appendChild(fileElementCloseButton);
                fileElement.appendChild(fileElementPlayButton);
                fileElement.appendChild(fileElementName);
                WebApp.Elements.MovieListDisplay.appendChild(fileElement);
            }
        };

        oReq.send();
    },
    RemoveFile: function(FileName) {

        // debugger;
        /*
            Tell the server to remove a file.
        */
        var oReq = new XMLHttpRequest();
        oReq.open("POST", '/' + FileName, true);
        //We use headers to tell the server what to do. This way we don't mess up the body...
        oReq.setRequestHeader("route", "remove");

        oReq.onload = function(oEvent) {
            var resMSG = JSON.parse(oReq.responseText);
            if (resMSG.errmsg != "") {
                alert(resMSG.errmsg);
            }
            else {
                WebApp.GetList();
            }
        };

        oReq.send();


    },
};



window.onload = function() {



    /*
        We are going to assume the designers have HTML elements that let the user 
        control the main parts of the app.
    */
    WebApp.Elements.DropFileDisplay = document.getElementById('DropFileDisplay');
    WebApp.Elements.MainDisplay = document.getElementById('MainDisplay');
    WebApp.Elements.MovieDisplay = document.getElementById('MovieDisplay');
    WebApp.Elements.FileElement = document.getElementById('FileElement');
    WebApp.Elements.MovieElement = document.getElementById('MovieElement');
    WebApp.Elements.FileListDisplay = document.getElementById('FileListDisplay');


    WebApp.Elements.MovieListDisplay = document.getElementById('MovieListDisplay');



    WebApp.GetList();
    // return;

    //Provides the open file dialog...
    WebApp.Elements.FileElement.addEventListener('change', function(e) {
        WebApp.ReadFile(e.target.files[0]);
    }, false);


    document.body.oncontextmenu = function() {
        return false;
    };
    document.body.onselectstart = function() {
        return false;
    };



    /*
        Setup the window events to handle someone dragging a file. We like lazy! :-)
    */
    window.addEventListener('dragenter', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();

    }, false);

    window.addEventListener('dragover', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }, false);

    window.addEventListener('drop', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        WebApp.ReadFile(evt.dataTransfer.files[0]);
    }, false);
};