View Adroid Logcat in VSCode  
=============

> The extension enables you to view (filtered) logcat from android devices in VSCode.

> It shows the output of **adb logcat -v threadtime** command in a 'new document' in VScode. The name of document is current timestamp.

> The new docuemnt is created in a folder of your choice or %temp%\vslogcat folder. 

> If filter string has been specified **adb logcat | findstr (egrep on linux)** is executed.

> Automatic support for _regular expressions_.

#Usage

##Available Commands and shortcuts
> - **Logcat Start (ctrl+l ctrl+s)**: Start capturing the logcat
> - **Logcat End (ctrl+l ctrl+e)**: Stop capturing the logcat
> - **Logcat Clear (ctrl+l ctrl+c)**: Clear the existing logcat buffer in system. 

##How To Use
1. Press _F1_ and type command **Logcat Start (ctrl+l ctrl+s)** .
2. You will see an input box. Type the semicolon delimited filter string there eg "fatal;exception" 
3. You can also use regular expressions.
4. Press escape or enter and the logcat will strat streaming in the current document.
5. To stop press _F1_ and type command **Logcat End (ctrl+l ctrl+e)**.
6. You can also save the logcat.  

##Available Settings 
1. "logcat.directory" : Specifies the folder path where logcat files will be created intially. If you don't specify this, the files will be created in %temp%\vslogcat folder. 

##Tips
> - The command status is shown in status bar messages.

> - Its a good practice to clear the logcat first using _Logcat Clear_ command and then run the scenario. It will make sure you don't get unnecessary spew in your logcat.   

> - The file is already created on system, you can just press save anytime to save logcat and retrieve it later. 

## Prerequisite 
> - adb should be installed on your system.

> - adb should be added in _PATH_ environment variable. 

> - You can find plenty of information on how to do above on the internet.   


##Feedback and Bugs
> Please log issues at https://github.com/agrabhi/logcat/issues

> Please dont forget to __Rate__ this extension. 


##How to update 
>Launch the VS Code Command Pallete - Ctrl+P - and type the command  __ext update logcat__ 

>For more info visit https://code.visualstudio.com/Docs/editor/extension-gallery#_update-an-extension


## My other extensions:
https://marketplace.visualstudio.com/search?term=publisher%3A%22abhiagr%22&target=VSCode&sortBy=Relevance



##Changelog
**Version 0.0.6**
- Improved auto scrolling and bug fixes.

**Version 0.0.5**
- The document created will have a name of current timestamp.
- The document will be created in a folder of your choice or %temp%\vslogcat folder if none specified.
- bug fixes.

**Version 0.0.4**
- Now you can filter the incoming logcat stream using semicolon delimited keywords.
- AutoScroll implemented
 
**Version 0.0.2**
- Changed the command to include threadtime in logcat
- Now display the list of devices as well before capturing the logcat.

**Version 0.0.1**
- Inital Release
