const moment = require('moment');

/**
 * Parse full dates (with year) for EMI, Jobs, AWS Bills
 * Supports multiple formats and Excel serial numbers
 */
function parseDate(dateString) {
    if (!dateString) return null;

    // Excel date serial number
    if (typeof dateString === 'number') {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const jsDate = new Date(excelEpoch.getTime() + dateString * 86400 * 1000);
        return moment(jsDate);
    }

    const dateStr = String(dateString).trim();

    const formats = [
        'DD-MM-YYYY', 'DD/MM/YYYY', 'D/M/YYYY',
        'DD.MM.YYYY', 'D.M.YYYY', 'DD,MM,YYYY',
        'YYYY-MM-DD', 'YYYY/MM/DD'
    ];

    for (const format of formats) {
        const parsed = moment(dateStr, format, true);
        if (parsed.isValid()) return parsed;
    }

    console.warn(`Unable to parse date: "${dateString}"`);
    return null;
}

/**
 * Parse birthdays (month-day only, no year)
 * Returns {month: 0-11, day: 1-31} for year-independent comparison
 */
function parseBirthday(dateStr) {
    if (!dateStr) return null;

    const str = String(dateStr).trim().replace(/\s+/g, ' ');

    const formats = [
        'MMM D', 'MMM DD', 'D MMM', 'DD MMM',
        'MMMM D', 'MMMM DD', 'D MMMM', 'DD MMMM',
        'DD-MM-YYYY', 'D-M-YYYY', 'DD/MM/YYYY', 'D/M/YYYY',
        'DD-MM', 'D-M', 'MM-DD', 'M-D'
    ];

    const parsed = moment(str, formats, true);

    if (parsed.isValid()) {
        return {
            month: parsed.month(), // 0-11
            day: parsed.date()     // 1-31
        };
    }

    return null;
}

/**
 * Format date for display
 */
function formatDate(date, format = 'DD-MM-YYYY') {
    if (!date) return 'Invalid Date';
    const momentDate = moment.isMoment(date) ? date : parseDate(date);
    if (!momentDate || !momentDate.isValid()) return 'Invalid Date';
    return momentDate.format(format);
}

/**
 * Calculate days until a birthday (handles year rollover)
 */
function daysUntilBirthday(birthdayObj) {
    if (!birthdayObj) return null;

    const today = moment().startOf('day');
    let nextBirthday = moment()
        .year(today.year())
        .month(birthdayObj.month)
        .date(birthdayObj.day)
        .startOf('day');

    if (nextBirthday.isBefore(today)) {
        nextBirthday.add(1, 'year');
    }

    return nextBirthday.diff(today, 'days');
}

module.exports = {
    parseDate,
    parseBirthday,
    formatDate,
    daysUntilBirthday
};
