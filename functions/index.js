const functions = require('firebase-functions');
const {getLocations} = require("./handlers/locations");
const {getBreads} = require("./handlers/breads");
const {FBAuth, AdminAuth} = require("./util/firebase_auth");
const app = require('express')();

const {getFutureOrders, getPastOrders, postOrder, getAllOrders, deleteOrder} = require("./handlers/orders");
const {login, signup} = require('./handlers/users');
const {getOrdersSheet, getQuantitySheet} = require("./handlers/sheets");

const cors = require('cors');
app.use(cors());

// ROUTE ORDERS
app.get('/future_orders', FBAuth, getFutureOrders);
app.get('/past_orders', FBAuth, getPastOrders);
app.get('/list_orders', AdminAuth, getAllOrders);
app.post('/order', FBAuth, postOrder);
app.post('/delete_order', FBAuth, deleteOrder);
// app.post('/update_order', )

//ROUTE BREADS
app.get('/breads', getBreads);

// ROUTE LOCATIONS
app.get('/locations', getLocations);

// ROUTE USERS
app.post('/signup', signup);
app.post('/login', login);


// ROUTE SHEETS
app.get('/orders_sheet', AdminAuth, getOrdersSheet);
app.get('/quantity_sheet', AdminAuth, getQuantitySheet);


exports.api = functions.region('europe-west1').https.onRequest(app);
