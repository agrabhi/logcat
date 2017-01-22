// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
const os = require('os');
var fs = require('fs');
var path = require('path');
const spawn = require('child_process').spawn;
var adbExists = false;
var adbChecked = false;
var adbcmd = null;
var filterString = null;
var filterArray = null;
var findstr = null;
var folderLocation = null
var activeEditor = null;

function doesExist(path) {
    try {
        fs.accessSync(path, fs.F_OK);
        return true;
    } catch (e) {
        return false;
    }
}

// return whether adb exists in Path variable and if not informs the user
function checkAdbAndInformUser(showDeviceList) {
    console.log('value of adbExists ' + adbExists);

    if (adbExists && !showDeviceList)
        return true;

    var childProcess = require('child_process');

    const exePath = "adb";

    try {
        const output = childProcess.execFileSync(exePath, ["devices"]);
        adbExists = true;

        if (showDeviceList)
            appendText(output);
        return true;
    }
    catch (ex) {
        vscode.window.showErrorMessage("Problem in running adb. Please install adb, add to system path and restart VSCode. If it exists already, please do \"adb kill-server\" from any command prompt.");
        console.log(ex);
        return false;
    }

}

function showStatusMessage(msg) {
    vscode.window.setStatusBarMessage(msg);
}

function createPositon(line, char) {
    return new vscode.Position(line, char);
}

function appendText(data) {
    if (activeEditor == null) {
        console.log("appendText called with null activeEditor value");
        return;
    }
    activeEditor.edit(
        function (editBuilder) {
            const newPos = createPositon(activeEditor.document.lineCount + 1, 0);
            editBuilder.insert(newPos, data + os.EOL);
            
            var endPos = createPositon(newPos.line + 1, 0);
            scroll(newPos, endPos);
        }
    );
}

function scroll(startPos, endPos) {
    var range = new vscode.Range(startPos, endPos);
    activeEditor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
}

// function getUntiledURI(filepath) {
//     var path = require('path');
//     var untitledUri = vscode.Uri.parse('untitled:' + path.sep + path.sep + filepath);
//     return untitledUri;
// }

function createFileAndReturnPath(filePath)
{
    if (!doesExist(folderLocation))
    {
        fs.mkdirSync(folderLocation);
    }

    // create file
    fs.appendFileSync(filePath, '');
    return filePath;
}

function loadConfiguration() {
    try {
        var config = vscode.workspace.getConfiguration('logcat');
        folderLocation = config.get('directory', null);
    }
    catch (ex) {
        console.log(ex);
    }
    console.log('folder location loaded from config is ' + folderLocation);
}

function startCapture() {
    if (!checkAdbAndInformUser())
        return;
    
    loadConfiguration();

    if (activeEditor != null) {
        vscode.window.showErrorMessage('Logcat is already being captured. Please stop the current session first and then retry');
        return;
    }


    if (!filterString) {
        vscode.window.showInputBox(
            { placeHolder: 'Please enter semicolon delimited search string or leave empty to get entire logcat.' }
        ).then(startCaptureUtil);

    }
    else {
        vscode.window.showInputBox(
            { value: filterString }
        ).then(startCaptureUtil);
    }
}

function getCurrentDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "_" + month + "_" + day + "_" + hour + "_" + min + "_" + sec;

}
// create new file and return the handle to the document
function getNewFilePath() {
    //choose a name
    var fileName = getCurrentDateTime() + ".txt";
    
    if (!folderLocation) {
        folderLocation = os.tmpdir();
        folderLocation = path.join(folderLocation, 'vslogcat');
    }

    var filePath = path.join(folderLocation, fileName);
    console.log("File path is " + filePath);
    return filePath;

}

function startCaptureUtil(userInput) {

    filterString = userInput;

    var postDocOpenFn = function (editor) {
        // show devices attached to the user
        activeEditor = editor;
        checkAdbAndInformUser(true);
        if (!filterString) {
            runNonFilteredLogcat();
        } else {
            runFilteredLogcat();
        }
        showStatusMessage('LOGCAT: Started capturing!');
    }

    try {
        var filePath = createFileAndReturnPath(getNewFilePath());
        vscode.workspace.openTextDocument(filePath).then(doc => {
            vscode.window.showTextDocument(doc).then(
                postDocOpenFn
                , reason => { console.log(reason); }
            );
        }, reason => { console.log(reason); }
        );
    }
    catch (ex) {
        console.log(ex);
    }
}

function runFilteredLogcat() {

    var tokens = filterString.split(';');
    filterArray = [];

    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i])
            filterArray.push(tokens[i]);
    }

    adbcmd = spawn('adb', ['logcat', '-v', 'threadtime']);

    var isWin = (os.type() == 'Windows_NT');
    if (isWin)
        runFilteredLogcatWindows();
    else
        runFilteredLogcatNonWindows();

    adbcmd.stdout.on('data', (data) => {
        //  console.log(`adbcmd stdout: ${data}`);
        findstr.stdin.write(data);
    });

    adbcmd.stderr.on('data', (data) => {
        appendText(data);
    });

    adbcmd.on('close', (code) => {
        if (code !== 0) {
            console.log(`adbcmd process exited with code ${code}`);
        }
        appendText("adb process exiting.");
        findstr.stdin.end();
    });

    findstr.stdout.on('data', (data) => {
        //console.log(`findstr stdout: ${data}`);
        appendText(data);
    });

    findstr.stderr.on('data', (data) => {
        //console.log(`findstr stderr: ${data}`);
        appendText(data);
    });

    findstr.on('close', (code) => {
        if (code !== 0) {
            console.log(`findstr process exited with code ${code}`);
        }
    });
}

function runFilteredLogcatWindows() {
    filterArray = filterArray.map(function (val) { return '/c:' + val; });
    console.log(filterArray);

    filterArray.push('/snipr');

    findstr = spawn('findstr', filterArray);

}

function runFilteredLogcatNonWindows() {

    var arg = '';
    for (var i = 0; i < filterArray.length; i++) {
        if (i > 0) {
            arg = arg + '|';
        }

        arg = arg + filterArray[i];
    }

    filterArray = ['-i', arg];
    console.log(filterArray);

    findstr = spawn('egrep', filterArray);
}

function runNonFilteredLogcat() {
    adbcmd = spawn('adb', ['logcat', '-v', 'threadtime']);

    adbcmd.stdout.on('data', (data) => {
        appendText(data);
    });

    adbcmd.stderr.on('data', (data) => {
        appendText(data);
    });

    adbcmd.on('close', (code) => {
        if (code !== 0) {
            console.log(`adbcmd process exited with code ${code}`);
        }
        appendText("adb process exiting.");
    });


}


function endCapture() {
    if (!checkAdbAndInformUser())
        return;

    if (adbcmd == null) {
        showStatusMessage('LOGCAT:  Was not running!');
    }
    else {
        adbcmd.kill();
        if (findstr)
                findstr.kill();
        activeEditor = null;
        showStatusMessage('LOGCAT: Stopped!');
    }

}

function clear() {
    if (!checkAdbAndInformUser())
        return;

    adbclear = spawn('adb', ['logcat', '-c']);

    showStatusMessage('LOGCAT: History cleared');
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "logcat" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json

    var disposable = vscode.commands.registerCommand('logcat.startCapture', startCapture);
    context.subscriptions.push(disposable);

    var disposable1 = vscode.commands.registerCommand('logcat.endCapture', endCapture);
    context.subscriptions.push(disposable1);

    var disposable2 = vscode.commands.registerCommand('logcat.clear', clear);
    context.subscriptions.push(disposable2);

}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;