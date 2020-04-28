const {SwissDate} = require("./swiss_date");

const PhoneNumber = require('libphonenumber-js');
const {dbGetBreads} = require("../handlers/breads");
const {dbGetLocations} = require("../handlers/locations");

const DEFAULT_COUNTRY = 'CH';

const isValidDate = (date) => date instanceof Date && !isNaN(date);
const isNumber = (number) => typeof number === 'number' && isFinite(number);
const isString = (str) => typeof str === 'string' || str instanceof String;
const isEmptyString = (str) => isString(str) && str.trim() === '';

const normalizeString = (str) => {
    return str.trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace('-', ' ') // hyphen to whitespace
        .toLowerCase()
        .replace(/(\s+)/, '') // whitespace to space
        .trim();
};

exports.staticValidateUser = (phoneNumber, lastName, firstName) => {
    const errors = {};
    let phoneNumberObj;

    if (phoneNumber) {
        phoneNumberObj = PhoneNumber.parsePhoneNumberFromString(phoneNumber, DEFAULT_COUNTRY);

        if (!phoneNumberObj || !phoneNumberObj.isValid()) {
            errors.phoneNumber = 'is invalid';
        }
    } else {
        errors.phoneNumber = 'is missing';
    }
    if (lastName) {
        if (isEmptyString(lastName) || isEmptyString(normalizeString(lastName))) {
            errors.lastName = 'is invalid';
        }
    } else {
        errors.lastName = 'is missing';
    }
    if (firstName) {
        if (isEmptyString(firstName) || isEmptyString(normalizeString(firstName))) {
            errors.firstName = 'is invalid';
        }
    } else {
        errors.firstName = 'is missing';
    }

    if (Object.keys(errors).length > 0) {
        return {
            errors: errors,
        }
    }

    phoneNumber = phoneNumberObj.formatInternational();

    return {
        user: {
            phoneNumber: phoneNumber,
            lastName: normalizeString(lastName),
            firstName: normalizeString(firstName),
        },
    }
};

exports.staticValidateOrder = (userID, locationID, locationDate, breadList) => {

    const errors = {};

    if (!userID) {
        errors.userID = 'is missing';
    }

    if (locationID) {
        if (isEmptyString(locationID)) {
            errors.locationID = 'is invalid';
        }
    } else {
        errors.locationID = 'is missing';
    }

    if (locationDate) {
        locationDate = new Date(locationDate);
        if (!isValidDate(locationDate)) {
            errors.locationDate = 'is invalid';
        }
    } else {
        errors.locationDate = 'is missing';
    }

    if (breadList) {
        if (!Array.isArray(breadList)) {
            errors.breadList = 'is invalid'
        } else {
            breadList.forEach((bread, index) => {
                if (bread.breadID) {
                    if (isEmptyString(bread.breadID)) {
                        errors[`breadList_breadID_${index}`] = 'is invalid';
                    }
                } else {
                    errors[`breadList_breadID_${index}`] = 'is missing';
                }
                if (bread.quantity) {
                    if (!isNumber(parseFloat(bread.quantity)) || parseFloat(bread.quantity) <= 0) {
                        errors[`breadList_quantity_${index}`] = 'is invalid';
                    }
                } else {
                    errors[`breadList_quantity_${index}`] = 'is missing';
                }
            });
        }
    } else {
        errors.breadList = 'is missing';
    }


    if (Object.keys(errors).length > 0) {
        return {errors}
    }

    const dateTimeNowString = new Date().toISOString();

    return {
        order: {
            userID: userID,
            locationID: locationID,
            locationDate: locationDate.toISOString(),
            breadList: breadList.map(breadOrder => ({
                breadID: breadOrder.breadID,
                quantity: parseFloat(breadOrder.quantity)
            })),
            createdAt: dateTimeNowString,
            lastModified: dateTimeNowString,
        }
    };
};

exports.promiseValidateOrder = (order) => {
    const errors = {};

    return dbGetLocations()
        .then(locations => {
            const loc = locations.find(l => l.locationID === order.locationID);
            if (!loc) {
                console.log('invalid locationID, someone might be sending request manually.');
                errors.locationID = 'is invalid';
            } else {
                const locDate = new SwissDate(order.locationDate)
                if (!loc.daysOfWeek.includes(locDate.day)
                    || locDate.dayDifference(SwissDate.now()) < 1) {
                    errors.locationDate = 'is invalid';
                }
            }
            return dbGetBreads();
        })
        .then(breads => {
            order.breadList.forEach((breadOrder, index) => {
                const bread = breads.find(b => b.breadID === breadOrder.breadID);
                if (!bread) {
                    console.log('invalid breadID, someone might be sending request manually.');
                    errors[`breadList_breadID_${index}`] = 'is invalid';
                } else {
                    const MULT = 1000; // precision up to the gram
                    const step = Math.round(bread.unitStep * MULT);
                    const q = Math.round(breadOrder.quantity * MULT);
                    if (q % step !== 0) {
                        errors[`breadList_quantity_${index}`] = 'is invalid';
                    }
                }
            });

            if (Object.keys(errors).length > 0) {
                return errors
            }
            return false;
        });
};