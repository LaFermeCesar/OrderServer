function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {value: value, enumerable: true, configurable: true, writable: true});
    } else {
        obj[key] = value;
    }
    return obj;
}

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

class SwissDate {
    constructor(stringOrTime) {
        _defineProperty(this, "dayDifference", other => Math.round((this._date.getTime() - other._date.getTime()) / DAY));
        _defineProperty(this, "equals", other => this._date.getTime() === other._date.getTime());

        let date;

        if (stringOrTime) {
            date = new Date(stringOrTime);
        } else {
            date = new Date();
        }

        this._date = SwissDate.fixTzDay(date);

        this._date.setUTCHours(0, 0, 0, 0); // only the date matters

    }

    get day() {
        return this._date.getUTCDay();
    }

    get string() {
        return this._date.toISOString();
    }

}

_defineProperty(SwissDate, "now", () => {
    return new SwissDate();
});

_defineProperty(SwissDate, "next", days => {
    let date = SwissDate.now();

    while (!days.includes(date.day)) {
        date = new SwissDate(date._date.getTime() + DAY);
    }

    return date;
});

_defineProperty(SwissDate, "fixTzDay", date => {
    // add two hours because of GMT+2 (in switzerland, at the time of the writing)
    date = new Date(date);
    date.setTime(date.getTime() + 2 * HOUR);
    return date;
});

module.exports = {
    SwissDate
};