const moment = require('moment');
const { parseDate, parseBirthday, formatDate, daysUntilBirthday } = require('../utils/dateParser');

class UIManager {
    constructor() {
        this.notificationQueue = [];
        this.activeNotifications = 0;
        this.MAX_NOTIFICATIONS = 2;
        this.notificationStatus = { enabled: true, snoozedUntil: null };
    }

    switchSection(section) {
        const sections = {
            today: document.getElementById('todaySection'),
            future: document.getElementById('futureSection'),
            jobs: document.getElementById('jobsSection')
        };

        const navItems = {
            today: document.getElementById('todayNav'),
            future: document.getElementById('futureNav'),
            jobs: document.getElementById('jobsNav')
        };

        // Hide all sections
        Object.values(sections).forEach(sec => {
            sec.classList.add('hidden-section');
            sec.classList.remove('active-section');
        });

        // Remove active state from all nav items
        Object.values(navItems).forEach(nav => {
            nav.classList.remove('bg-indigo-800');
        });

        // Show selected section
        if (sections[section]) {
            sections[section].classList.remove('hidden-section');
            sections[section].classList.add('active-section');
            navItems[section].classList.add('bg-indigo-800');
        }
    }

    updateDashboard(data) {
        console.log('Dashboard data:', data);

        // Update counts
        const todayBirthdays = data.categorized.all ? 
            data.categorized.all.birthdays.filter(b => b.isToday || b.isTomorrow).length : 0;
        const todayEMIs = data.categorized.all ? 
            data.categorized.all.emis.filter(e => e.isToday).length : 
            data.categorized.today.emiDue.length;

        document.getElementById('birthdayCount').textContent = todayBirthdays;
        document.getElementById('emiDueCount').textContent = todayEMIs;

        // Update notification bar
        this.updateNotificationBarCounts(data);

        // Clear existing lists
        ['birthdayList', 'emiDueList', 'tomorrowList', 'upcomingList', 'awsBillsList'].forEach(id => {
            document.getElementById(id).innerHTML = '';
        });

        // Render birthdays
        this.renderBirthdays(data);

        // Render EMIs
        this.renderEMIs(data);

        // Render AWS Bills
        this.renderAWSBills(data);
    }

    renderBirthdays(data) {
        const birthdayList = document.getElementById('birthdayList');

        if (data.categorized.all && data.categorized.all.birthdays) {
            const sortedBirthdays = [...data.categorized.all.birthdays].sort((a, b) =>
                (a.daysUntilBirthday || 999) - (b.daysUntilBirthday || 999)
            );
            sortedBirthdays.forEach(student => {
                birthdayList.appendChild(this.createStudentCard(student, 'birthday'));
            });
        }
    }

    renderEMIs(data) {
        if (data.categorized.all && data.categorized.all.emis) {
            data.categorized.all.emis.forEach(student => {
                if (student.isToday) {
                    document.getElementById('emiDueList').appendChild(
                        this.createStudentCard(student, 'emi')
                    );
                } else if (student.isTomorrow) {
                    document.getElementById('tomorrowList').appendChild(
                        this.createStudentCard(student, 'emi')
                    );
                } else {
                    document.getElementById('upcomingList').appendChild(
                        this.createStudentCard(student, 'emi')
                    );
                }
            });
        }
    }

    renderAWSBills(data) {
        if (data.categorized.all && data.categorized.all.awsBills) {
            data.categorized.all.awsBills.forEach(bill => {
                document.getElementById('awsBillsList').appendChild(
                    this.createStudentCard(bill, 'awsbill')
                );
            });
        }
    }

    createStudentCard(student, type) {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 rounded-lg p-4 flex justify-between items-center';

        const mainInfo = document.createElement('div');
        mainInfo.className = 'flex-1';

        const name = document.createElement('h4');
        name.className = 'font-semibold text-gray-800';
        name.textContent = type === 'awsbill' ? student.BillName : student.Name;

        const details = document.createElement('div');
        details.className = 'text-sm text-gray-600 mt-1';

        if (type === 'awsbill') {
            details.innerHTML = this.getAWSBillDetails(student);
        } else if (type === 'birthday') {
            details.innerHTML = this.getBirthdayDetails(student);
        } else {
            details.innerHTML = this.getEMIDetails(student);
        }

        mainInfo.appendChild(name);
        mainInfo.appendChild(details);
        card.appendChild(mainInfo);

        return card;
    }

    getAWSBillDetails(bill) {
        const billDate = formatDate(bill.BillDate || bill.awsBillDate);
        const daysUntilBill = bill.daysUntilBill;

        let statusText = '';
        let statusClass = 'text-gray-600';

        if (daysUntilBill === 0) {
            statusText = 'AWS Bill Due Today! ☁️⚠️';
            statusClass = 'text-red-600 font-bold';
        } else if (daysUntilBill === 1) {
            statusText = 'AWS Bill Due Tomorrow! ☁️⏰';
            statusClass = 'text-orange-600 font-bold';
        } else if (daysUntilBill > 1 && daysUntilBill <= 5) {
            statusText = `AWS Bill due in ${daysUntilBill} days ☁️`;
            statusClass = 'text-yellow-600 font-bold';
        } else if (daysUntilBill > 5) {
            statusText = `AWS Bill due in ${daysUntilBill} days`;
            statusClass = 'text-green-600';
        } else {
            statusText = `AWS Bill overdue by ${Math.abs(daysUntilBill)} days`;
            statusClass = 'text-red-800 font-bold';
        }

        return `
            <p>Bill Date: ${billDate}</p>
            <p class="font-semibold ${statusClass}">${statusText}</p>
        `;
    }

    getBirthdayDetails(student) {
        const birthDate = formatDate(student.DateOfBirth || student.birthdayDate);
        const daysUntil = student.daysUntilBirthday;

        let statusText = '';
        let statusClass = 'text-gray-600';

        if (daysUntil === 0) {
            statusText = '🎉 Birthday Today! 🎉';
            statusClass = 'text-blue-600 font-bold';
        } else if (daysUntil === 1) {
            statusText = '🎂 Birthday Tomorrow!';
            statusClass = 'text-purple-600 font-bold';
        } else if (daysUntil === 2) {
            statusText = `🎈 Birthday in 2 days!`;
            statusClass = 'text-pink-600 font-bold';
        } else if (daysUntil === 3) {
            statusText = `🎈 Birthday in 3 days!`;
            statusClass = 'text-orange-600 font-bold';
        }

        return `
            <p>Batch: ${student.BatchName}</p>
            <p>Timing: ${student.BatchTiming}</p>
            <p>Birth Date: ${student.birthdayDate || birthDate}</p>
            <p class="font-semibold ${statusClass}">${statusText}</p>
        `;
    }

    getEMIDetails(student) {
        const dueDate = formatDate(student.EMIDueDate || student.emiDueDate);
        const daysUntilDue = student.daysUntilDue;

        let statusText = '';
        let statusClass = 'text-gray-600';

        if (daysUntilDue === 0) {
            statusText = 'Due Today! ⚠️';
            statusClass = 'text-red-600 font-bold';
        } else if (daysUntilDue === 1) {
            statusText = 'Due Tomorrow! ⏰';
            statusClass = 'text-orange-600 font-bold';
        } else if (daysUntilDue > 1) {
            statusText = `Due in ${daysUntilDue} days`;
            statusClass = 'text-green-600';
        } else {
            statusText = `Overdue by ${Math.abs(daysUntilDue)} days`;
            statusClass = 'text-red-800 font-bold';
        }

        return `
            <p>Due Date: ${dueDate}</p>
            <p>EMIs: ${student.CompletedEMIs}/${student.TotalEMIs} completed</p>
            <p class="font-semibold ${statusClass}">${statusText}</p>
        `;
    }

    updateNotificationBarCounts(data) {
        const emiDueCount = data.categorized.today.emiDue.length;

        let urgentJobApps = 0;
        // This will be updated by JobsManager

        let urgentAWSBills = 0;
        if (data.categorized.all && data.categorized.all.awsBills) {
            urgentAWSBills = data.categorized.all.awsBills.filter(bill => 
                bill.daysUntilBill >= 0 && bill.daysUntilBill <= 5
            ).length;
        }

        document.getElementById('notifEmiDue').textContent = emiDueCount;
        document.getElementById('notifAWSBills').textContent = urgentAWSBills;
    }

    showNotification(data) {
        this.notificationQueue.push(data);
        this.showNextNotification();
    }

    showNextNotification() {
        if (this.notificationQueue.length === 0 || this.activeNotifications >= this.MAX_NOTIFICATIONS) {
            return;
        }

        const data = this.notificationQueue.shift();
        this.activeNotifications++;

        const position = this.activeNotifications === 1 ? '1rem' : '10rem';

        const alertDiv = document.createElement('div');
        alertDiv.className = 'fixed right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-w-md';
        alertDiv.style.borderLeft = `4px solid ${data.color}`;
        alertDiv.style.top = position;
        alertDiv.style.transition = 'all 0.3s ease-in-out';
        alertDiv.style.transform = 'translateX(100%)';
        alertDiv.style.opacity = '0';

        alertDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-gray-900">${data.title}</h3>
                    <p class="text-sm text-gray-600 mt-1">${data.message}</p>
                </div>
                <button class="text-gray-400 hover:text-gray-500" onclick="this.parentElement.parentElement.remove()">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.transform = 'translateX(0)';
            alertDiv.style.opacity = '1';
        }, 100);

        setTimeout(() => {
            this.removeNotification(alertDiv);
        }, 20000);
    }

    removeNotification(alertDiv) {
        if (alertDiv && alertDiv.parentElement) {
            alertDiv.style.transform = 'translateX(100%)';
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                alertDiv.remove();
                this.activeNotifications--;
                this.showNextNotification();
            }, 300);
        }
    }

    updateNotificationUI(status) {
        this.notificationStatus = status;
        const statusText = document.getElementById('notificationStatus');
        const snoozeBtn = document.getElementById('snoozeBtn');
        const stopBtn = document.getElementById('stopBtn');
        const restartBtn = document.getElementById('restartBtn');

        if (!status.enabled) {
            statusText.textContent = 'STOPPED';
            statusText.className = 'text-red-600 font-semibold';
            snoozeBtn.disabled = true;
            stopBtn.disabled = true;
            restartBtn.disabled = false;
        } else if (status.snoozedUntil) {
            const snoozeEnd = moment(status.snoozedUntil);
            statusText.textContent = `SNOOZED until ${snoozeEnd.format('h:mm A')}`;
            statusText.className = 'text-yellow-600 font-semibold';
            snoozeBtn.disabled = true;
            stopBtn.disabled = false;
            restartBtn.disabled = false;
        } else {
            const currentHour = moment().hour();
            const isActiveTime = currentHour >= 5 && currentHour < 21;

            statusText.textContent = isActiveTime ? 
                'ACTIVE (5 AM - 9 PM)' : 
                'ACTIVE (Outside hours: 5 AM - 9 PM)';
            statusText.className = isActiveTime ? 
                'text-green-600 font-semibold' : 
                'text-blue-600 font-semibold';

            snoozeBtn.disabled = false;
            stopBtn.disabled = false;
            restartBtn.disabled = true;
        }
    }

    showError(errorData) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md z-50';
        errorDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <strong class="font-bold">Error Loading Excel File</strong>
                    <p class="text-sm mt-1">${errorData.error}</p>
                    <p class="text-xs mt-1 text-gray-600">File: ${errorData.filePath}</p>
                </div>
                <button class="text-red-500 hover:text-red-700" onclick="this.parentElement.parentElement.remove()">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }
}

module.exports = UIManager;
