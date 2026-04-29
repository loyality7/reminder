const moment = require('moment');
const { parseDate, formatDate } = require('../utils/dateParser');

class JobsManager {
    constructor() {
        this.jobApplications = [];
        this.filteredApplications = [];
        this.currentPage = 1;
        this.ITEMS_PER_PAGE = 20;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('jobSearch').addEventListener('input', () => this.filterApplications());
        document.getElementById('deadlineFilter').addEventListener('change', () => this.filterApplications());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterApplications());
        document.getElementById('prevPage').addEventListener('click', () => this.changePage(-1));
        document.getElementById('nextPage').addEventListener('click', () => this.changePage(1));
    }

    setJobApplications(allJobApplications) {
        this.jobApplications = [];

        if (allJobApplications && allJobApplications.length > 0) {
            allJobApplications.forEach(jobApp => {
                this.jobApplications.push({
                    student: {
                        ID: jobApp.StudentID,
                        Name: jobApp.StudentName,
                        BatchName: jobApp.BatchName
                    },
                    application: {
                        CompanyName: jobApp.CompanyName,
                        Role: jobApp.Role,
                        StartDate: jobApp.StartDate,
                        EndDate: jobApp.EndDate,
                        Duration: jobApp.Duration
                    }
                });
            });
            console.log('Processed ALL job applications from Excel:', this.jobApplications.length);
        }

        this.filterApplications();
    }

    filterApplications() {
        const searchTerm = document.getElementById('jobSearch').value.toLowerCase();
        const deadlineFilter = document.getElementById('deadlineFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const today = moment();

        this.filteredApplications = this.jobApplications.filter(app => {
            const matchesSearch =
                app.student.Name.toLowerCase().includes(searchTerm) ||
                app.application.CompanyName.toLowerCase().includes(searchTerm);

            const endDate = parseDate(app.application.EndDate);
            const daysRemaining = endDate ? endDate.diff(today, 'days') : -999;
            const isActive = daysRemaining >= 0;

            let matchesDeadline = true;
            if (deadlineFilter !== 'all') {
                switch (deadlineFilter) {
                    case '3days': matchesDeadline = daysRemaining === 3; break;
                    case '2days': matchesDeadline = daysRemaining === 2; break;
                    case '1day': matchesDeadline = daysRemaining === 1; break;
                    case 'today': matchesDeadline = daysRemaining === 0; break;
                }
            }

            let matchesStatus = true;
            if (statusFilter !== 'all') {
                matchesStatus = statusFilter === 'active' ? isActive : !isActive;
            }

            return matchesSearch && matchesDeadline && matchesStatus;
        });

        this.currentPage = 1;
        this.updateJobsList();
        this.updatePagination();
        this.updateStats();
    }

    changePage(delta) {
        this.currentPage += delta;
        this.updateJobsList();
        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredApplications.length / this.ITEMS_PER_PAGE) || 1;
        document.getElementById('pageInfo').textContent = 
            `Page ${this.currentPage} of ${totalPages} (${this.filteredApplications.length} total)`;
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages;
    }

    updateStats() {
        const today = moment();
        let threeDaysCount = 0;
        let twoDaysCount = 0;
        let oneDayCount = 0;
        let todayCount = 0;

        this.filteredApplications.forEach(item => {
            const endDate = parseDate(item.application.EndDate);
            const daysRemaining = endDate ? endDate.diff(today, 'days') : -999;
            if (daysRemaining === 3) threeDaysCount++;
            if (daysRemaining === 2) twoDaysCount++;
            if (daysRemaining === 1) oneDayCount++;
            if (daysRemaining === 0) todayCount++;
        });

        document.getElementById('threeDaysApps').textContent = threeDaysCount;
        document.getElementById('twoDaysApps').textContent = twoDaysCount;
        document.getElementById('oneDayApps').textContent = oneDayCount;
        document.getElementById('todayApps').textContent = todayCount;

        // Update notification bar
        const urgentCount = threeDaysCount + twoDaysCount + oneDayCount + todayCount;
        document.getElementById('notifJobApps').textContent = urgentCount;
    }

    updateJobsList() {
        const tableBody = document.getElementById('jobsTableBody');
        tableBody.innerHTML = '';

        const today = moment();
        const totalPages = Math.ceil(this.filteredApplications.length / this.ITEMS_PER_PAGE) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const start = (this.currentPage - 1) * this.ITEMS_PER_PAGE;
        const end = start + this.ITEMS_PER_PAGE;
        const pageApplications = this.filteredApplications.slice(start, end);

        pageApplications.forEach(item => {
            const student = item.student;
            const app = item.application;
            const endDate = parseDate(app.EndDate);
            const daysRemaining = endDate ? endDate.diff(today, 'days') : -999;

            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';

            let statusClass = 'text-gray-600';
            let statusText = `${daysRemaining} days left`;

            if (daysRemaining < 0) {
                statusClass = 'text-gray-500';
                statusText = 'Ended';
            } else if (daysRemaining === 0) {
                statusClass = 'text-red-800 font-bold';
                statusText = 'Ends Today';
            } else if (daysRemaining === 1) {
                statusClass = 'text-red-600 font-bold';
                statusText = '1 day left';
            } else if (daysRemaining === 2) {
                statusClass = 'text-orange-600 font-bold';
                statusText = '2 days left';
            } else if (daysRemaining === 3) {
                statusClass = 'text-yellow-600 font-bold';
                statusText = '3 days left';
            }

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${student.Name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${app.CompanyName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${app.Role}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(app.StartDate)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(app.EndDate)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass}">${statusText}</td>
            `;

            tableBody.appendChild(row);
        });
    }
}

module.exports = JobsManager;
