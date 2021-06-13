const {db} = require('../util/admin');
const XLSX = require('xlsx');
const dayjs = require('dayjs')
const {SwissDate} = require("../util/swiss_date");
const {dataToOrders} = require("./orders");
const {dbGetUsers} = require("./users");
const {dbGetLocations} = require("./locations");
const {dbGetBreads} = require("./breads");
const {toNumber} = require('../util/id_number');

exports.dbGetOrders = () => {
    let orders, locations, breads;
    return db.collection('orders')
        .get()
        .then((data) => {
            orders = dataToOrders(data);
            return dbGetUsers();
        })
        .then(users => {
            orders.forEach(order => {
                order.user = users.find(user => user.userID === order.userID)
            });
            return dbGetLocations();
        })
        .then(locations_ => {
            locations = locations_;
            orders.forEach(order => {
                order.location = locations.find(loc => loc.locationID === order.locationID)
            });
            return dbGetBreads();
        })
        .then(breads_ => {
            breads = breads_;
            orders.forEach(order => {
                order.breadList.forEach(breadOrder => {
                    breadOrder.bread = breads.find(bread => bread.breadID === breadOrder.breadID);
                });
            });
            orders = orders.map(order => ({
                orderID: order.orderID,
                isRecurrent: order.isRecurrent,
                location: {
                    date: order.locationDate,
                    name: (order.location || {name: 'unknown'}).name,
                },
                user: {
                    phoneNumber: order.user.phoneNumber,
                    firstName: order.user.firstName,
                    lastName: order.user.lastName,
                },
                breadList: order.breadList.map(breadOrder => ({
                    name: (breadOrder.bread || {name: 'unknown'}).name,
                    quantity: breadOrder.quantity,
                    withDetail: (breadOrder.bread || {cat: 'unknown'}).cat === 'levure',
                })),
                lastModified: order.lastModified,
            }));
            return {
                orders,
                locations,
                breads
            }
        })
};

const makeBook = () => XLSX.utils.book_new();
const addSheet = (book, data, name, date) => {
    const dateString = dayjs(date.string).format('DD/MM/YYYY')
    data.unshift([name, dateString]);
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(data), name);
}
const bookToBuffer = (book) => XLSX.write(book, {type: 'buffer', bookType: 'xlsx'});

const nextMarketDate = () => SwissDate.next([3, 6]);

const isOrderForMarketDate = (order, marketLocation, marketDate) => {
    const locDate = new SwissDate(order.location.date);
    const dayDif = locDate.dayDifference(marketDate);
    return (marketLocation.name === order.location.name) && (
        (order.isRecurrent && locDate.day === marketDate.day) ||
        (dayDif >= -1 && dayDif <= 0)
    );
}

exports.getQuantitySheet = (req, res) => {
    const marketDate = req.query.date ? new SwissDate(req.query.date) : nextMarketDate();

    return exports.dbGetOrders()
        .then(out => {
            const {orders, locations} = out;
            const book = makeBook();
            const totalQuantities = {}

            locations.forEach(loc => {
                const sheetName = loc.name;
                const quantities = {};

                orders
                    .filter(order => isOrderForMarketDate(order, loc, marketDate))
                    .forEach(order => {
                        order.breadList.forEach(breadOrder => {
                            let name = breadOrder.name;
                            const quantity = breadOrder.quantity

                            if (breadOrder.withDetail) {
                                const key = `${name} (${quantity * 1000}g)`
                                quantities[key] = quantities[key] ? quantities[key] + 1 : 1
                                totalQuantities[key] = totalQuantities[key] ? totalQuantities[key] + 1 : 1
                                name = `${name} (total)`
                            }
                            quantities[name] = quantities[name] ? quantities[name] + quantity : quantity
                            totalQuantities[name] = totalQuantities[name] ? totalQuantities[name] + quantity : quantity
                        })
                    })


                const data = Object.keys(quantities)
                    .sort()
                    .map(name => [name, quantities[name]])

                addSheet(book, data, sheetName, marketDate)
            });

            const totData = Object.keys(totalQuantities)
                .sort()
                .map(name => [name, totalQuantities[name]])

            addSheet(book, totData, 'Tous', marketDate)

            return res.status(200).send(bookToBuffer(book));
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({error: 'something went wrong'});
        });
}

exports.getOrdersSheet = (req, res) => {
    const marketDate = req.query.date ? new SwissDate(req.query.date) : nextMarketDate();

    return exports.dbGetOrders()
        .then(out => {
            const {orders, locations} = out;
            const book = makeBook();

            locations.forEach(loc => {
                const sheetName = loc.name;

                const data = orders
                    .filter(order => isOrderForMarketDate(order, loc, marketDate))
                    .map(order => {
                        const name = `${order.user.lastName} ${order.user.firstName} (${order.user.phoneNumber.split(' ').join('.')})`;
                        const orderNumber = toNumber(order.orderID)
                        const breads = order.breadList
                            .map(breadOrder => `${breadOrder.quantity} ${breadOrder.name}`)
                            .join(', ');
                        const dateTime = new Date(order.lastModified)
                        dateTime.setTime(dateTime.getTime() + 2 * 1000 * 60 * 60)
                        const dateTimeString = dayjs(dateTime).format('DD/MM/YYYY HH:mm');
                        return [name, dateTimeString, orderNumber, breads]
                    })
                    .sort((a, b) => {
                        if (a[0] >= b[0]) {
                            return 1;
                        }
                        return -1;
                    });
                addSheet(book, data, sheetName, marketDate);
            })

            return res.status(200).send(bookToBuffer(book));
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({error: 'something went wrong'});
        });
}