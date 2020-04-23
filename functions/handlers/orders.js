const {dbGetUsers} = require("./users");
const {dbGetLocations} = require("./locations");
const {dbGetBreads} = require("./breads");
const {promiseValidateOrder} = require("../util/validaters");
const {staticValidateOrder} = require("../util/validaters");
const {db} = require('../util/admin');

const todayAtMidnight = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date
};

const dataToOrders = (data) => {
    const orders = [];
    data.forEach((doc) => {
        const order = {
            orderID: doc.id,
            ...doc.data()
        };
        orders.push(order);
    });
    return orders
};

exports.getFutureOrders = (req, res) => {
    return db.collection('orders')
        // .orderBy('locationDate', 'desc') // get up
        .where('userID', '==', req.user.uid)
        .where('locationDate', '>=', todayAtMidnight().toISOString())
        .get()
        .then((data) => {
            return res.json(dataToOrders(data))
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({error: 'something went wrong'});
        });
};


exports.getPastOrders = (req, res) => {
    return db.collection('orders')
        // .orderBy('locationDate', 'desc') // get up
        .where('userID', '==', req.user.uid)
        .where('locationDate', '<', todayAtMidnight().toISOString())
        .orderBy('locationDate', 'desc')
        // .limit(1)
        .get()
        .then((data) => {
            return res.json(dataToOrders(data));
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({error: 'something went wrong'});
        });
};

const addOrder = (order, res) => {
    return db.collection('orders')
        .add(order)
        .then((doc) => res.json({message: `document ${doc.id} created successfully`}))
        .catch((err) => {
            console.error(err);
            return res.status(500).json({error: 'something went wrong'});
        });
};

const updateOrder = (orderID, order, res) => {
    delete order.createdAt; // do not update this field
    return db.doc(`/orders/${orderID}`)
        .get()
        .then((data) => {
            if (data.exists && data.data().userID === order.userID) {
                return db.doc(`/orders/${orderID}`)
                    .update(order)
                    .then(() => res.json({message: `document ${orderID} updated successfully`}))
            } else {
                return res.status(400).json({general: 'cannot modify someone else\'s order'});
            }
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({general: 'something went wrong, please try again'});
        });
};

exports.postOrder = (req, res) => {
    const {errors, order} = staticValidateOrder(
        req.user.uid,
        req.body.locationID,
        req.body.locationDate,
        req.body.breadList,
    );

    if (errors) {
        return res.status(400).json(errors)
    }

    return promiseValidateOrder(order)
        .then(errors => {
            if (errors) {
                return res.status(400).json(errors)
            } else {
                if (req.body.orderID) { // updating an order
                    return updateOrder(req.body.orderID, order, res)
                } else { // adding a new order
                    return addOrder(order, res)
                }
            }
        })

};


exports.getAllOrders = (req, res) => {
    let orders;
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
        .then(locations => {
            orders.forEach(order => {
                order.location = locations.find(loc => loc.locationID === order.locationID)
            });
            return dbGetBreads();
        })
        .then(breads => {
            orders.forEach(order => {
                order.breadList.forEach(breadOrder => {
                    breadOrder.bread = breads.find(bread => bread.breadID === breadOrder.breadID);
                });
            });
            return res.json(orders.map(order => ({
                orderID: order.orderID,
                location: {
                    locationDate: order.locationDate,
                    locationName: order.location.name,
                },
                user: {
                    phoneNumber: order.user.phoneNumber,
                    firstName: order.user.firstName,
                    lastName: order.user.lastName,
                },
                breadList: order.breadList.map(breadOrder => ({
                    breadName: breadOrder.bread.name,
                    quantity: breadOrder.quantity,
                }))
            })));
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({error: 'something went wrong'});
        });
};

exports.deleteOrder = (req, res) => {
    const orderID = req.body.orderID;
    if (!orderID) {
        return res.status(500).json({errors: {orderID: 'is missing'}})
    }

    return db.doc(`/orders/${orderID}`)
        .get()
        .then((data) => {
            if (data.exists && data.data().userID === req.user.uid) {
                return db.doc(`/orders/${orderID}`)
                    .delete()
                    .then(() => res.json({message: `document ${orderID} deleted successfully`}))
            } else {
                return res.status(400).json({general: 'cannot modify someone else\'s order'});
            }
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({general: 'something went wrong, please try again'});
        });
};