const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');

// Services
const NotificationService = require('./services/notificationService');
const ConfigService = require('./services/configService');
const { categorizeStudentData, processJobApplications } = require('./services/dataProcessor');
const { validateExcelStructure } = require('./utils/excelValidator');

// Global state
let mainWindow;
let studentData = [];
let checkInterval;
let lastLoadedFile = null;
let notificationService;
let configService;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.webContents.on('did-finish-load', () => {
        const config = configService.load();
        
        // Initialize notification service
        notificationService.setEnabled(config.notificationsEnabled);
        if (config.snoozedUntil) {
            notificationService.snoozedUntil = require('moment')(config.snoozedUntil);
        }

        // Send notification status to renderer
        mainWindow.webContents.send('notification-status', notificationService.getStatus());
        
        // Request Excel path from renderer's localStorage
        mainWindow.webContents.send('request-excel-path');
    });
}

app.whenReady().then(() => {
    configService = new ConfigService();
    notificationService = new NotificationService(mainWindow);
    createWindow();
});

// Auto-launch on startup
app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
    args: []
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers
ipcMain.on('load-excel-from-localstorage', (event, filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        lastLoadedFile = filePath;
        loadStudentData(filePath);
    }
});

ipcMain.on('load-excel-file', (event, filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        lastLoadedFile = filePath;
        loadStudentData(filePath);
    }
});

ipcMain.on('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] }
        ]
    });

    if (!result.canceled) {
        const filePath = result.filePaths[0];
        mainWindow.webContents.send('excel-file-selected', filePath);
    }
});

ipcMain.on('snooze-notifications', () => {
    notificationService.snooze(1);
    configService.update(notificationService.getStatus());
    mainWindow.webContents.send('notification-status', notificationService.getStatus());
});

ipcMain.on('stop-notifications', () => {
    notificationService.setEnabled(false);
    configService.update(notificationService.getStatus());
    mainWindow.webContents.send('notification-status', notificationService.getStatus());
});

ipcMain.on('restart-notifications', () => {
    notificationService.restart();
    configService.update(notificationService.getStatus());
    mainWindow.webContents.send('notification-status', notificationService.getStatus());
});

ipcMain.on('get-notification-status', () => {
    mainWindow.webContents.send('notification-status', notificationService.getStatus());
});

function loadStudentData(filePath) {
    try {
        console.log('Loading Excel file from:', filePath);

        studentData = [];

        const workbook = xlsx.readFile(filePath);
        console.log('Available sheets:', Object.keys(workbook.Sheets));

        // Validate structure
        const validation = validateExcelStructure(workbook);
        if (validation.errors.length > 0) {
            throw new Error(validation.errors.join('\n'));
        }

        if (validation.warnings.length > 0) {
            console.warn('Excel structure warnings:', validation.warnings);
        }

        // Load sheets
        const studentsSheet = workbook.Sheets["Students"];
        const studentsData = xlsx.utils.sheet_to_json(studentsSheet);
        console.log('Students data loaded:', studentsData.length, 'records');

        const jobsSheet = workbook.Sheets["Job Applications"];
        const jobsData = jobsSheet ? xlsx.utils.sheet_to_json(jobsSheet) : [];
        console.log('Job applications data loaded:', jobsData.length, 'records');

        const awsSheet = workbook.Sheets["AWS Bills"];
        const awsData = awsSheet ? xlsx.utils.sheet_to_json(awsSheet) : [];
        console.log('AWS bills data loaded:', awsData.length, 'records');

        // Process data
        studentData = processJobApplications(studentsData, jobsData);
        global.awsBillsData = awsData;

        lastLoadedFile = filePath;

        // Categorize data
        const categorizedData = categorizeStudentData(studentData, awsData);

        // Send to renderer
        if (mainWindow) {
            mainWindow.webContents.send('file-loaded', {
                allData: studentData,
                categorized: categorizedData,
                allJobApplications: jobsData
            });
        }

        // Start reminder checks
        startReminderCheck();

        // Save config
        configService.update({ lastFilePath: filePath });

    } catch (error) {
        console.error('Error loading student data:', error);

        let errorMessage = `Failed to load the student data from: ${filePath}\n\nError: ${error.message}`;

        if (error.message.includes('Students sheet not found')) {
            errorMessage += '\n\nPlease ensure your Excel file has a sheet named "Students" with the correct data structure.';
        }

        dialog.showErrorBox('Error Loading Data', errorMessage);

        if (mainWindow) {
            mainWindow.webContents.send('file-load-error', {
                error: error.message,
                filePath: filePath
            });
        }
    }
}

function startReminderCheck() {
    if (checkInterval) {
        clearInterval(checkInterval);
    }
    checkInterval = setInterval(() => {
        notificationService.checkReminders(studentData, global.awsBillsData);
    }, 3600000); // Every hour
    
    // Check immediately
    notificationService.checkReminders(studentData, global.awsBillsData);
}
