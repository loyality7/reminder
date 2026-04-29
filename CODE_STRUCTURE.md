# Code Structure

## Directory Layout

```
src/
├── main.js                      # Electron main process entry point
├── renderer.js                  # Renderer process entry point
├── index.html                   # UI layout
│
├── services/                    # Business logic services
│   ├── notificationService.js   # Handles all notifications
│   ├── dataProcessor.js         # Processes and categorizes data
│   └── configService.js         # Manages app configuration
│
├── utils/                       # Utility functions
│   ├── dateParser.js            # Date parsing and formatting
│   └── excelValidator.js        # Excel file validation
│
└── ui/                          # UI management
    ├── uiManager.js             # Main dashboard UI
    └── jobsManager.js           # Job applications UI
```

## Module Responsibilities

### **main.js**
- Electron app initialization
- Window management
- IPC communication
- Excel file loading orchestration

### **services/notificationService.js**
- Send OS notifications
- Check reminders (birthdays, EMIs, jobs, AWS bills)
- Manage notification state (enabled/snoozed)
- Respect active hours (5 AM - 9 PM)

### **services/dataProcessor.js**
- Categorize student data by urgency
- Process job applications
- Calculate days until events
- Prepare data for UI display

### **services/configService.js**
- Load/save app configuration
- Persist notification settings
- Store last Excel file path

### **utils/dateParser.js**
- Parse full dates (DD-MM-YYYY, Excel serials)
- Parse birthdays (month-day only)
- Format dates for display
- Calculate days until birthday

### **utils/excelValidator.js**
- Validate Excel structure
- Check required sheets and columns
- Generate warnings for missing data

### **ui/uiManager.js**
- Render dashboard sections
- Create student/EMI/birthday cards
- Show in-app notifications
- Update notification status UI

### **ui/jobsManager.js**
- Manage job applications table
- Handle search and filters
- Pagination
- Update stats

### **renderer.js**
- Initialize UI managers
- Handle IPC events
- Coordinate between main process and UI

## Data Flow

```
Excel File
    ↓
main.js (loadStudentData)
    ↓
excelValidator.js (validate)
    ↓
dataProcessor.js (categorize)
    ↓
renderer.js (IPC: file-loaded)
    ↓
uiManager.js (updateDashboard)
    ↓
UI Display
```

## Notification Flow

```
Timer (hourly)
    ↓
notificationService.js (checkReminders)
    ↓
dateParser.js (parse dates)
    ↓
notificationService.js (send)
    ↓
OS Notification + In-app Alert
```
