const { Notification } = require('electron');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const { parseDate, parseBirthday } = require('../utils/dateParser');

class NotificationService {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.enabled = true;
        this.snoozedUntil = null;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    snooze(hours = 1) {
        this.snoozedUntil = moment().add(hours, 'hours');
        this.enabled = true;
    }

    restart() {
        this.enabled = true;
        this.snoozedUntil = null;
    }

    canSendNotification() {
        if (!this.enabled) return false;
        
        if (this.snoozedUntil && moment().isBefore(this.snoozedUntil)) {
            return false;
        }

        // Clear snooze if expired
        if (this.snoozedUntil && moment().isAfter(this.snoozedUntil)) {
            this.snoozedUntil = null;
        }

        // Only send between 5 AM and 9 PM
        const currentHour = moment().hour();
        if (currentHour < 5 || currentHour >= 21) return false;

        return true;
    }

    send(title, message, type = 'default') {
        if (!this.canSendNotification()) return;

        let iconPath;
        try {
            const possibleIconPaths = [
                path.join(__dirname, '../../assets/icon.ico'),
                path.join(process.resourcesPath, 'assets/icon.ico'),
                path.join(require('electron').app.getAppPath(), 'assets/icon.ico')
            ];

            for (const possiblePath of possibleIconPaths) {
                if (fs.existsSync(possiblePath)) {
                    iconPath = possiblePath;
                    break;
                }
            }
        } catch (error) {
            console.error('Error finding icon:', error);
        }

        const colorMap = {
            'birthday': '#3B82F6',
            'upcoming': '#10B981',
            'today': '#F59E0B',
            'default': '#6B7280'
        };

        try {
            const notification = new Notification({
                title: title,
                body: message,
                icon: iconPath,
                timeoutType: 'never',
                urgency: type === 'today' ? 'critical' : 'normal',
                silent: false
            });

            notification.show();

            setTimeout(() => notification.close(), 20000);

            // Send to renderer for visual indicator
            if (this.mainWindow) {
                this.mainWindow.webContents.send('show-alert', {
                    title: title,
                    message: message,
                    type: type,
                    color: colorMap[type] || colorMap['default']
                });
            }
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    checkReminders(studentData, awsBillsData) {
        if (!this.canSendNotification()) return;

        const today = moment().startOf('day');
        const tomorrow = moment().add(1, 'day').startOf('day');

        // Check student reminders
        studentData.forEach(student => {
            this.checkBirthdayReminders(student, today, tomorrow);
            this.checkEMIReminders(student, today);
            this.checkJobApplicationReminders(student, today);
        });

        // Check AWS bill reminders
        this.checkAWSBillReminders(awsBillsData, today);
    }

    checkBirthdayReminders(student, today, tomorrow) {
        if (!student.DateOfBirth) return;

        const dob = parseBirthday(student.DateOfBirth);
        if (!dob) return;

        const todayMonth = today.month();
        const todayDay = today.date();
        const tomorrowMonth = tomorrow.month();
        const tomorrowDay = tomorrow.date();

        if (todayMonth === dob.month && todayDay === dob.day) {
            this.send(
                'Birthday Today',
                `Today is ${student.Name}'s birthday! 🎉`,
                'birthday'
            );
        } else if (tomorrowMonth === dob.month && tomorrowDay === dob.day) {
            this.send(
                'Birthday Tomorrow',
                `Tomorrow is ${student.Name}'s birthday! 🎂`,
                'birthday'
            );
        }
    }

    checkEMIReminders(student, today) {
        if (!student.EMIDueDate) return;

        const dueDate = parseDate(student.EMIDueDate);
        if (!dueDate) return;

        const daysUntilDue = dueDate.startOf('day').diff(today, 'days');

        if (daysUntilDue === 0) {
            this.send(
                'EMI Due Today',
                `EMI payment for ${student.Name} is due today.\nCompleted: ${student.CompletedEMIs}/${student.TotalEMIs} EMIs`,
                'today'
            );
        } else if (daysUntilDue === 1) {
            this.send(
                'EMI Due Tomorrow',
                `EMI payment for ${student.Name} is due tomorrow.\nCompleted: ${student.CompletedEMIs}/${student.TotalEMIs} EMIs`,
                'upcoming'
            );
        }
    }

    checkJobApplicationReminders(student, today) {
        if (!student.JobApplications || student.JobApplications.length === 0) return;

        student.JobApplications.forEach(application => {
            if (!application.EndDate) return;

            const endDate = parseDate(application.EndDate);
            if (!endDate) return;

            const daysUntilEnd = endDate.startOf('day').diff(today, 'days');

            const messages = {
                3: `${student.Name}'s application for ${application.Role} at ${application.CompanyName} ends in 3 days.`,
                2: `${student.Name}'s application for ${application.Role} at ${application.CompanyName} ends in 2 days.`,
                1: `${student.Name}'s application for ${application.Role} at ${application.CompanyName} ends tomorrow.`,
                0: `${student.Name}'s application for ${application.Role} at ${application.CompanyName} ends today!`
            };

            if (messages[daysUntilEnd]) {
                const title = daysUntilEnd === 0 ? 'Job Application Ends Today' : 'Job Application Deadline';
                const type = daysUntilEnd === 0 ? 'today' : 'upcoming';
                this.send(title, messages[daysUntilEnd], type);
            }
        });
    }

    checkAWSBillReminders(awsBillsData, today) {
        if (!awsBillsData || awsBillsData.length === 0) return;

        awsBillsData.forEach(awsBill => {
            if (!awsBill.BillDate) return;

            const billDate = parseDate(awsBill.BillDate);
            if (!billDate) return;

            const daysUntilBill = billDate.startOf('day').diff(today, 'days');

            if (daysUntilBill >= 0 && daysUntilBill <= 5) {
                const messages = {
                    5: `AWS Bill "${awsBill.BillName}" is due in 5 days. ☁️`,
                    4: `AWS Bill "${awsBill.BillName}" is due in 4 days. ☁️`,
                    3: `AWS Bill "${awsBill.BillName}" is due in 3 days. ☁️⚠️`,
                    2: `AWS Bill "${awsBill.BillName}" is due in 2 days. ☁️⚠️`,
                    1: `AWS Bill "${awsBill.BillName}" is due tomorrow! ☁️⏰`,
                    0: `AWS Bill "${awsBill.BillName}" is due today! ☁️🚨`
                };

                const title = daysUntilBill === 0 ? 'AWS Bill Due Today' :
                             daysUntilBill === 1 ? 'AWS Bill Due Tomorrow' :
                             'AWS Bill Reminder';

                this.send(title, messages[daysUntilBill], daysUntilBill === 0 ? 'today' : 'upcoming');
            }
        });
    }

    getStatus() {
        return {
            enabled: this.enabled,
            snoozedUntil: this.snoozedUntil ? this.snoozedUntil.format() : null
        };
    }
}

module.exports = NotificationService;
