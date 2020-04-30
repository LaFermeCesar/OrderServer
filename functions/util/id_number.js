import {pad} from "./utils";

const ID_SIZE = 4
const NUMBER_SIZE = 8

const SYMBOLS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const NUMBERS = SYMBOLS.map((char, i) => ({key: char, val: i}))
    .reduce((map, obj) => {
        map[obj.key] = obj.val;
        return map;
    }, {})
const BASE = SYMBOLS.length

const symbolToNumber = (char) => NUMBERS[char] ? NUMBERS[char] : 0;
const numberToSymbol = (num) => num >= 0 && num < BASE ? SYMBOLS[num] : '0';

exports.toNumber = (orderID) => {
    let number = 0;
    String(orderID)
        .split('')
        .slice(0, ID_SIZE)
        .forEach((c, i) => {
            number += BASE ** (ID_SIZE - 1 - i) * symbolToNumber(c);
        })
    return pad(number, NUMBER_SIZE);
}

exports.toID = (orderNumber) => {
    orderNumber = parseInt(orderNumber, 10);
    return [...Array(ID_SIZE).keys()]
        .map(i => {
            const min = BASE ** (ID_SIZE - i - 1);
            if (orderNumber >= min) {
                const n = Math.floor(orderNumber / min)
                orderNumber -= min * n
                return numberToSymbol(n)
            }
            return '0'
        })
        .join('');
}
