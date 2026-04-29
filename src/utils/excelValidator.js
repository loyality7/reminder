/**
 * Validate Excel workbook structure
 */
function validateExcelStructure(workbook) {
    const errors = [];
    const warnings = [];

    // Check Students sheet
    if (!workbook.Sheets["Students"]) {
        errors.push("Missing 'Students' sheet. Available sheets: " + Object.keys(workbook.Sheets).join(', '));
        return { errors, warnings };
    }

    const xlsx = require('xlsx');
    const studentsData = xlsx.utils.sheet_to_json(workbook.Sheets["Students"]);
    
    if (studentsData.length === 0) {
        errors.push("Students sheet is empty");
        return { errors, warnings };
    }

    // Check required columns
    const requiredColumns = ['ID', 'Name', 'BatchName', 'BatchTiming'];
    const studentColumns = Object.keys(studentsData[0]);
    const missingColumns = requiredColumns.filter(col => !studentColumns.includes(col));

    if (missingColumns.length > 0) {
        errors.push(`Missing required columns in Students sheet: ${missingColumns.join(', ')}`);
    }

    // Check optional columns
    const optionalColumns = ['DateOfBirth', 'TotalEMIs', 'CompletedEMIs', 'EMIDueDate', 'AWSBillDate'];
    const missingOptional = optionalColumns.filter(col => !studentColumns.includes(col));

    if (missingOptional.length > 0) {
        warnings.push(`Missing optional columns in Students sheet: ${missingOptional.join(', ')}`);
    }

    // Check Job Applications sheet
    if (workbook.Sheets["Job Applications"]) {
        const jobsData = xlsx.utils.sheet_to_json(workbook.Sheets["Job Applications"]);
        if (jobsData.length > 0) {
            const requiredJobColumns = ['StudentID', 'CompanyName', 'Role'];
            const jobColumns = Object.keys(jobsData[0]);
            const missingJobColumns = requiredJobColumns.filter(col => !jobColumns.includes(col));

            if (missingJobColumns.length > 0) {
                warnings.push(`Missing columns in Job Applications sheet: ${missingJobColumns.join(', ')}`);
            }
        }
    } else {
        warnings.push("Job Applications sheet not found - job features will be disabled");
    }

    return { errors, warnings };
}

module.exports = { validateExcelStructure };
