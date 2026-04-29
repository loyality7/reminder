const moment = require('moment');
const { parseDate, parseBirthday, daysUntilBirthday } = require('../utils/dateParser');

/**
 * Process and categorize student data
 */
function categorizeStudentData(studentData, awsData) {
    const today = moment().startOf('day');
    
    const categorized = {
        today: {
            birthdays: [],
            tomorrowBirthdays: [],
            emiDue: []
        },
        future: {
            upcoming: []
        },
        all: {
            students: studentData,
            birthdays: [],
            emis: [],
            awsBills: []
        }
    };

    // Process students
    studentData.forEach(student => {
        // Process birthdays
        if (student.DateOfBirth) {
            const dob = parseBirthday(student.DateOfBirth);
            if (dob) {
                const daysUntil = daysUntilBirthday(dob);
                
                if (daysUntil !== null && daysUntil >= 0 && daysUntil <= 3) {
                    const birthdayMoment = moment()
                        .year(moment().year())
                        .month(dob.month)
                        .date(dob.day);
                    
                    categorized.all.birthdays.push({
                        ...student,
                        birthdayDate: birthdayMoment.format('MMMM D'),
                        daysUntilBirthday: daysUntil,
                        isToday: daysUntil === 0,
                        isTomorrow: daysUntil === 1,
                        isWithin3Days: true
                    });

                    if (daysUntil === 0) {
                        categorized.today.birthdays.push(student);
                    } else if (daysUntil === 1) {
                        categorized.today.tomorrowBirthdays.push(student);
                    }
                }
            }
        }

        // Process EMIs
        if (student.EMIDueDate) {
            const dueDate = parseDate(student.EMIDueDate);
            if (dueDate) {
                const daysUntilDue = dueDate.startOf('day').diff(today, 'days');

                categorized.all.emis.push({
                    ...student,
                    emiDueDate: dueDate.format('DD-MM-YYYY'),
                    daysUntilDue: daysUntilDue,
                    isToday: daysUntilDue === 0,
                    isTomorrow: daysUntilDue === 1,
                    isUpcoming: daysUntilDue > 1 && daysUntilDue <= 7
                });

                if (daysUntilDue === 0) {
                    categorized.today.emiDue.push(student);
                } else if (daysUntilDue > 0 && daysUntilDue <= 3) {
                    categorized.future.upcoming.push(student);
                }
            }
        }
    });

    // Process AWS Bills
    if (awsData && awsData.length > 0) {
        awsData.forEach(awsBill => {
            if (awsBill.BillDate) {
                const billDate = parseDate(awsBill.BillDate);
                if (billDate) {
                    const daysUntilBill = billDate.startOf('day').diff(today, 'days');

                    categorized.all.awsBills.push({
                        BillName: awsBill.BillName,
                        BillDate: awsBill.BillDate,
                        awsBillDate: billDate.format('DD-MM-YYYY'),
                        daysUntilBill: daysUntilBill,
                        isToday: daysUntilBill === 0,
                        isTomorrow: daysUntilBill === 1,
                        isUpcoming: daysUntilBill > 1 && daysUntilBill <= 5
                    });
                }
            }
        });
    }

    return categorized;
}

/**
 * Process job applications data
 */
function processJobApplications(studentData, jobsData) {
    // Group jobs by student ID
    const jobsByStudent = jobsData.reduce((acc, job) => {
        if (!acc[job.StudentID]) {
            acc[job.StudentID] = [];
        }
        const { StudentID, StudentName, BatchName, ...jobDetails } = job;
        acc[job.StudentID].push(jobDetails);
        return acc;
    }, {});

    // Combine students with their job applications
    const studentsWithJobs = studentData.map(student => ({
        ...student,
        JobApplications: jobsByStudent[student.ID] || []
    }));

    return studentsWithJobs;
}

module.exports = {
    categorizeStudentData,
    processJobApplications
};
