# Student Reminder App

A desktop application that helps track student EMIs and birthdays by sending timely reminders.

## Features

- Import student data from Excel/CSV files
- Track EMI due dates and completion status
- Automatic birthday reminders
- EMI payment due date reminders (3 days, 2 days, 1 day before and on due date)
- Job application deadline tracking
- Desktop notifications
- Simple and intuitive interface

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed on your computer
2. Clone or download this repository
3. Open a terminal in the project folder
4. Install dependencies:
   ```
   npm install
   ```
5. Start the application:
   ```
   npm start
   ```

## Excel/CSV File Format

Your Excel or CSV file should have three sheets:

### Students Sheet
Required columns:
- ID: Unique identifier for each student
- Name: Student's full name
- BatchName: Name of the student's batch
- BatchTiming: Timing of the batch (Morning/Evening)
- DateOfBirth: Student's date of birth (format: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, or DD,MM,YYYY)
- TotalEMIs: Total number of EMIs
- CompletedEMIs: Number of EMIs completed
- EMIDueDate: Next EMI due date (format: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, or DD,MM,YYYY)

### Job Applications Sheet
Required columns:
- StudentID: ID matching the student's ID from Students sheet
- StudentName: Name matching the student's name
- BatchName: Student's batch name
- CompanyName: Name of the company
- Role: Job role/position
- StartDate: Application start date (format: DD-MM-YYYY)
- EndDate: Application end date (format: DD-MM-YYYY)
- Duration: Interview/test duration

### AWS Bills Sheet
Required columns:
- BillName: Description of the AWS bill
- BillDate: Bill due date (format: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, or DD,MM,YYYY)

## Usage

1. Launch the application
2. Click "Select Excel/CSV File" to load your student data
3. The application will:
   - Show loaded student data in organized sections
   - Display upcoming EMI due dates
   - Track job application deadlines
   - Track AWS bill due dates
   - Check for birthdays daily
   - Send notifications for:
     - Upcoming EMI payments (3 days in advance)
     - EMIs due today
     - Overdue EMIs
     - Job application deadlines
     - AWS bill due dates
     - Student birthdays

## Building for Distribution

To create an installable Windows executable:

```
npm run build
```

The built application will be available in the `dist` folder. 