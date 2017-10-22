// import PouchDB from 'pouchdb-browser';
const electron = require('electron');
var PouchDB = require('pouchdb');
const url = require('url');
const path = require('path');
var db = new PouchDB('database');
const fs = require('fs');
const {app, BrowserWindow, Menu, ipcMain} = electron;
let mainWindow;
let addWindow;
let searchWindow;
// Listen for the app to be ready

app.on('ready', function(){
    // Create new window
    mainWindow = new BrowserWindow({});
    // Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Quit app when closed

    mainWindow.on('closed', function(){
        app.quit();
    });

    // Build menu from template

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

    // Insert menu
    Menu.setApplicationMenu(mainMenu);
});

// Handle create add window

function createAddWindow(){
    // Create new window
    addWindow = new BrowserWindow({
        width: 400,
        height: 300,
        title: 'Add new image to database'
    });

    // Load html into window

    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Garbage cleaning

    addWindow.on('close', function(){
        addWindow = null;
    });
}

// Handle create search window

function createSearchWindow(){
    // Create new window
    searchWindow = new BrowserWindow({
        width: 800,
        height: 500,
        title: "Search image in database"
    });

    // Load html into window

    searchWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'searchWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Garbage cleaning

    searchWindow.on('close', function(){
        searchWindow = null;
    });

}

// Catch image add
ipcMain.on('image:add', function(e, data){
    console.log(data);
    //reading the image data to add to the database
    fs.readFile(data.file, function(err, imageData){
        if(err) throw err;
        db.put({
            _id: data.description,
            _attachments: {
                "image": {
                    data: imageData
                }
            }
        });
    });
    addWindow.close();
});

// Catch image search

ipcMain.on('image:search', function(e, description){
    // db.get(description, {attachments: true}).then(function(found){
    //     // console.log(found._attachments.image.data);
    //     toSend = {
    //         imageData: found._attachments.image.data
    //     };
    //     //Send the image found to the searchWindow to be displayed
    //     searchWindow.webContents.send('image:found', toSend);
    // });
    db.getAttachment(description, 'image').then(function(blob){
        searchWindow.send('image:found', blob);
    });
});

// Create menu template

const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Add image',
                click(){
                    createAddWindow();
                }
            },
            {
                label: 'Search image',
                click(){
                    createSearchWindow();
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    }
];

// If mac add empty object to the menu

if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({});
}

// Add developer tools item if not in production

if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle Dev Tools',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    });
}