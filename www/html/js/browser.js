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
        // console.log('FileObject', FileObject);
        
        WebApp.Elements.MovieDisplay.innerHTML = '';
        
        
        var extension = FileObject.name.split('.').pop().toLowerCase();
        
        //Rather than read the file to make sure it's video, we just use the file extension...
        if(extension!='mp4'){
            // debugger;
            alert('We are only doing MP4 files for now.');
            return;
        }

        WebApp.ActiveFile = FileObject;

        var fileReader = new FileReader();
        fileReader.onload = function(event) {
            WebApp.Elements.MovieElement.setAttribute("src", event.target.result);
        };
        fileReader.readAsDataURL(FileObject);
    },
    UploadFile: function() {
        /*
            Upload the active file by converting into an array and sending 
            it out a new connection to the server...
        */
        if (WebApp.ActiveFile == null) {
            WebApp.Elements.MovieDisplay.innerHTML = 'Select a file using the Folder Open icon or drag a file into this window.';
        }
        else {
            var oReq = new XMLHttpRequest();
            var reader = new FileReader();
            reader.onload = function(e) {
                oReq.open("POST", '/' + WebApp.ActiveFile.name, true);
                //We use headers to tell the server what to do. This way we don't mess up the body...
                oReq.setRequestHeader("route", "upload");

                oReq.onload = function(oEvent) {
                    // Uploaded.
                    debugger;
                    var resMSG = JSON.parse(oReq.responseText);
                    if(resMSG.errmsg!=""){
                        alert(resMSG.errmsg)
                    }else{
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
            reader.readAsArrayBuffer(WebApp.ActiveFile);
        }
    },
    GetList: function() {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", '/', true);
        //We use headers to tell the server what to do. This way we don't mess up the body...
        oReq.setRequestHeader("route", "list");
        
        WebApp.Elements.MovieListDisplay.innerHTML = ""; //clear out any old elements...

        oReq.onload = function(oEvent) {
            var files = JSON.parse(oReq.responseText);
            
            for (var f = files.length; f--; ) {
                var file = files[f];
                var fileElement = document.createElement('div');
                fileElement.FileName = file;
                fileElement.innerHTML = fileElement.FileName;
                fileElement.onclick = function(e){
                    WebApp.Elements.MovieElement.setAttribute('src','/uploads/'+this.FileName);
                }
                WebApp.Elements.MovieListDisplay.appendChild(fileElement);
            }
            // debugger;
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