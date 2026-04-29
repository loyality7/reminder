const { ipcRenderer } = require('electron');
const moment = require('moment');
const { parseDate, parseBirthday, formatDate, daysUntilBirthday } = require('./utils/dateParser');
const UIManager = require('./ui/uiManager');
const JobsManager = require('./ui/jobsManager');

// Initialize managers
const uiManager = new UIManager();
const jobsManager = new JobsManager();

// Initialize UI
document.getElementById('currentDate').textContent = moment().format('MMMM D, YYYY');

// Navigation
document.getElementById('todayNav').addEventListener('click', () => uiManager.switchSection('today'));
document.getElementById('futureNav').addEventListener('click', () => uiManager.switchSection('future'));
document.getElementById('jobsNav').addEventListener('click', () => uiManager.switchSection('jobs'));
document.getElementById('selectFile').addEventListener('click', () => {
    ipcRenderer.send('select-file');
});

// Notification controls
document.getElementById('snoozeBtn').addEventListener('click', () => {
    ipcRenderer.send('snooze-notifications');
});
document.getElementById('stopBtn').addEventListener('click', () => {
    ipcRenderer.send('stop-notifications');
});
document.getElementById('restartBtn').addEventListener('click', () => {
    ipcRenderer.send('restart-notifications');
});

// IPC Event Listeners
ipcRenderer.on('request-excel-path', () => {
    const lastExcelPath = localStorage.getItem('lastExcelPath');
    ipcRenderer.send('load-excel-from-localstorage', lastExcelPath);
});

ipcRenderer.on('excel-file-selected', (event, filePath) => {
    if (filePath) {
        localStorage.setItem('lastExcelPath', filePath);
        ipcRenderer.send('load-excel-file', filePath);
    }
});

ipcRenderer.on('file-loaded', (event, data) => {
    console.log('File loaded successfully:', data);
    
    // Process job applications
    jobsManager.setJobApplications(data.allJobApplications || []);
    
    // Update dashboard
    uiManager.updateDashboard(data);
});

ipcRenderer.on('file-load-error', (event, errorData) => {
    console.error('File load error:', errorData);
    uiManager.showError(errorData);
});

ipcRenderer.on('data-updated', (event, data) => {
    uiManager.updateDashboard(data);
});

ipcRenderer.on('show-alert', (event, data) => {
    uiManager.showNotification(data);
});

ipcRenderer.on('notification-status', (event, status) => {
    console.log('[Renderer] Received notification-status:', status);
    uiManager.updateNotificationUI(status);
});

// Request initial notification status
document.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.send('get-notification-status');
});
