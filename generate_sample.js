const XLSX = require('xlsx');
const moment = require('moment');

// Helper function to convert moment date to Excel serial number
function momentToExcelDate(momentDate) {
    // Excel epoch is December 30, 1899
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = momentDate.toDate();
    const daysSinceEpoch = (jsDate - excelEpoch) / (1000 * 60 * 60 * 24);
    return daysSinceEpoch;
}

// Sample student data with NEW Month-Day format for birthdays
// NOTE: DateOfBirth is now PLAIN TEXT - easy to edit in Excel!
const students = [
    {
        "ID": "STD352",
        "Name": "G.Mani Kanth Reddy",
        "BatchName": "JavaFullStack",
        "BatchTiming": "Morning",
        "DateOfBirth": "Dec 5", // Plain text - edit this to TODAY's date!
        "TotalEMIs": 3,
        "CompletedEMIs": 2,
        "EMIDueDate": momentToExcelDate(moment()) // TODAY's EMI due as Excel date
    },
    {
        "ID": "STD359",
        "Name": "M. Vidhya",
        "BatchName": "JavaFullStack",
        "BatchTiming": "Morning",
        "DateOfBirth": "Dec 6", // Plain text - edit this to TOMORROW's date!
        "TotalEMIs": 4,
        "CompletedEMIs": 1,
        "EMIDueDate": momentToExcelDate(moment().add(1, 'day')) // TOMORROW's EMI due
    },
    {
        "ID": "STD360",
        "Name": "Rahul Kumar",
        "BatchName": "Python-2024-A",
        "BatchTiming": "Morning",
        "DateOfBirth": "May 15", // Plain text - easy to edit!
        "TotalEMIs": 9,
        "CompletedEMIs": 3,
        "EMIDueDate": momentToExcelDate(moment().add(2, 'days')) // 2 days from now
    },
    {
        "ID": "STD361",
        "Name": "Priya Sharma",
        "BatchName": "MERN-2024-B",
        "BatchTiming": "Evening",
        "DateOfBirth": "25 December", // Plain text - easy to edit!
        "TotalEMIs": 12,
        "CompletedEMIs": 6,
        "EMIDueDate": momentToExcelDate(moment().add(3, 'days')) // 3 days from now
    },
    {
        "ID": "STD362",
        "Name": "Amit Singh",
        "BatchName": "ReactJS-2024",
        "BatchTiming": "Evening",
        "DateOfBirth": "aug 10", // Plain text - case insensitive test
        "TotalEMIs": 8,
        "CompletedEMIs": 4,
        "EMIDueDate": momentToExcelDate(moment().add(1, 'day')) // TOMORROW's EMI due
    }
];

// Company AWS Bills - simple tracking with just dates
const awsBills = [
    {
        "BillName": "AWS Monthly Bill - July 2025",
        "BillDate": momentToExcelDate(moment('2025-07-31')) // End of July as Excel date
    },
    {
        "BillName": "AWS Monthly Bill - August 2025",
        "BillDate": momentToExcelDate(moment('2025-08-31')) // End of August as Excel date
    },
    {
        "BillName": "AWS Monthly Bill - September 2025",
        "BillDate": momentToExcelDate(moment('2025-09-30')) // End of September as Excel date
    },
    {
        "BillName": "AWS Monthly Bill - October 2025",
        "BillDate": momentToExcelDate(moment('2025-10-31')) // End of October as Excel date
    },
    {
        "BillName": "AWS Monthly Bill - November 2025",
        "BillDate": momentToExcelDate(moment('2025-11-30')) // End of November as Excel date
    }
];

// Sample job applications with Excel date format
const jobApplications = [
    {
        "StudentID": "STD352",
        "StudentName": "G.Mani Kanth Reddy",
        "BatchName": "JavaFullStack",
        "CompanyName": "TechCorp Solutions",
        "StartDate": momentToExcelDate(moment()),
        "EndDate": momentToExcelDate(moment().add(2, 'days')), // 2 days remaining
        "Role": "Java Full Stack Developer",
        "Duration": "2 hours"
    },
    {
        "StudentID": "STD359",
        "StudentName": "M. Vidhya",
        "BatchName": "JavaFullStack",
        "CompanyName": "WebTech Innovations",
        "StartDate": momentToExcelDate(moment().subtract(5, 'days')),
        "EndDate": momentToExcelDate(moment().add(1, 'days')), // 1 day remaining
        "Role": "Java Backend Developer",
        "Duration": "2.5 hours"
    },
    {
        "StudentID": "STD360",
        "StudentName": "Rahul Kumar",
        "BatchName": "Python-2024-A",
        "CompanyName": "TechCorp Solutions",
        "StartDate": momentToExcelDate(moment()),
        "EndDate": momentToExcelDate(moment().add(2, 'days')), // 2 days remaining
        "Role": "Junior Python Developer",
        "Duration": "2 hours"
    },
    {
        "StudentID": "STD361",
        "StudentName": "Priya Sharma",
        "BatchName": "MERN-2024-B",
        "CompanyName": "WebTech Innovations",
        "StartDate": momentToExcelDate(moment().subtract(5, 'days')),
        "EndDate": momentToExcelDate(moment().add(1, 'days')), // 1 day remaining
        "Role": "Frontend Developer",
        "Duration": "2.5 hours"
    },
    {
        "StudentID": "STD362",
        "StudentName": "Amit Singh",
        "BatchName": "ReactJS-2024",
        "CompanyName": "Digital Solutions",
        "StartDate": momentToExcelDate(moment()),
        "EndDate": momentToExcelDate(moment().add(3, 'days')), // 3 days remaining
        "Role": "React Developer",
        "Duration": "1 hour"
    },
    {
        "StudentID": "STD352",
        "StudentName": "G.Mani Kanth Reddy",
        "BatchName": "JavaFullStack",
        "CompanyName": "DataTech Systems",
        "StartDate": momentToExcelDate(moment()),
        "EndDate": momentToExcelDate(moment()), // Ends today
        "Role": "Java Backend Developer",
        "Duration": "1.5 hours"
    }
];

// Create Excel file
const wb = XLSX.utils.book_new();

// Add Students sheet
const wsStudents = XLSX.utils.json_to_sheet(students);

// Format date columns as dates in Students sheet (only EMIDueDate now - DateOfBirth is text!)
const dateColumns = ['H']; // EMIDueDate (H)
const studentRange = XLSX.utils.decode_range(wsStudents['!ref']);
for (let R = studentRange.s.r + 1; R <= studentRange.e.r; ++R) {
    dateColumns.forEach(col => {
        const cellAddress = col + (R + 1);
        if (wsStudents[cellAddress]) {
            wsStudents[cellAddress].z = 'dd-mm-yyyy'; // Set Excel number format to DD-MM-YYYY
            wsStudents[cellAddress].t = 'n'; // Ensure it's treated as number (date)
        }
    });
}

// Add Job Applications sheet  
const wsJobs = XLSX.utils.json_to_sheet(jobApplications);

// Format date columns as dates in Jobs sheet
const jobDateColumns = ['E', 'F']; // StartDate (E), EndDate (F)
const jobRange = XLSX.utils.decode_range(wsJobs['!ref']);
for (let R = jobRange.s.r + 1; R <= jobRange.e.r; ++R) {
    jobDateColumns.forEach(col => {
        const cellAddress = col + (R + 1);
        if (wsJobs[cellAddress]) {
            wsJobs[cellAddress].z = 'dd-mm-yyyy'; // Set Excel number format to DD-MM-YYYY
            wsJobs[cellAddress].t = 'n'; // Ensure it's treated as number (date)
        }
    });
}

// Create AWS Bills sheet
const wsAWS = XLSX.utils.json_to_sheet(awsBills);

// Format date column as date in AWS Bills sheet
const awsDateColumn = 'B'; // BillDate (B)
const awsRange = XLSX.utils.decode_range(wsAWS['!ref']);
for (let R = awsRange.s.r + 1; R <= awsRange.e.r; ++R) {
    const cellAddress = awsDateColumn + (R + 1);
    if (wsAWS[cellAddress]) {
        wsAWS[cellAddress].z = 'dd-mm-yyyy'; // Set Excel number format to DD-MM-YYYY
        wsAWS[cellAddress].t = 'n'; // Ensure it's treated as number (date)
    }
}

// Adjust column widths for Students sheet
const studentColWidths = {
    'A': 8,   // ID
    'B': 20,  // Name
    'C': 18,  // BatchName
    'D': 12,  // BatchTiming
    'E': 12,  // DateOfBirth
    'F': 10,  // TotalEMIs
    'G': 12,  // CompletedEMIs
    'H': 12   // EMIDueDate
};

// Adjust column widths for Jobs sheet
const jobColWidths = {
    'A': 10,  // StudentID
    'B': 20,  // StudentName
    'C': 18,  // BatchName
    'D': 25,  // CompanyName
    'E': 12,  // StartDate
    'F': 12,  // EndDate
    'G': 25,  // Role
    'H': 10   // Duration
};

// Adjust column widths for AWS Bills sheet
const awsColWidths = {
    'A': 30,  // BillName
    'B': 12   // BillDate
};

wsStudents['!cols'] = Object.keys(studentColWidths).map(key => ({ wch: studentColWidths[key] }));
wsJobs['!cols'] = Object.keys(jobColWidths).map(key => ({ wch: jobColWidths[key] }));
wsAWS['!cols'] = Object.keys(awsColWidths).map(key => ({ wch: awsColWidths[key] }));

XLSX.utils.book_append_sheet(wb, wsStudents, "Students");
XLSX.utils.book_append_sheet(wb, wsJobs, "Job Applications");
XLSX.utils.book_append_sheet(wb, wsAWS, "AWS Bills");

// Save the workbook
XLSX.writeFile(wb, "sample_students_mixed_dates.xlsx");

console.log("✅ Sample Excel file 'sample_students_mixed_dates.xlsx' created successfully!");
console.log("\n📋 This file contains:");
console.log("  - Students with Month-Day format birthdays (PLAIN TEXT - easy to edit!)");
console.log("  - EMI dates as Excel serial numbers (formatted as DD-MM-YYYY)");
console.log("  - Job applications with Excel dates");
console.log("  - AWS bills with Excel dates");
console.log("\n⚠️  IMPORTANT - Birthday Format:");
console.log("  - Birthdays are PLAIN TEXT in 'Month Day' format");
console.log("  - Examples: 'Jan 12', 'dec 5', '15 March', 'aug 10'");
console.log("  - Case insensitive - 'Jan', 'jan', 'JAN' all work!");
console.log("  - You can edit them directly in Excel - just type the month and day!");