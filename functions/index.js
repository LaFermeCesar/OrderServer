
const functions = require('firebase-functions');
const app = require('express')();

const {FBAuth, AdminAuth} = require("./util/firebase_auth");
const {login, signup, getUsers} = require('./handlers/users');
const {getOrders, postOrder, getAllOrders, deleteOrder, getOrderFromNumber} = require("./handlers/orders");
const {getLocations} = require("./handlers/locations");
const {getBreads} = require("./handlers/breads");
const {getOrdersSheet, getQuantitySheet} = require("./handlers/sheets");

const cors = require('cors');
app.use(cors());

// ROUTE ORDERS
app.get('/orders', FBAuth, getOrders);
app.get('/list_orders', AdminAuth, getAllOrders);

app.post('/order_number', AdminAuth, getOrderFromNumber)
app.post('/order', FBAuth, postOrder);
app.post('/delete_order', FBAuth, deleteOrder);

//ROUTE BREADS
app.get('/breads', getBreads);

// ROUTE LOCATIONS
app.get('/locations', getLocations);

// ROUTE USERS
app.get('/export_users', AdminAuth, getUsers);

app.post('/signup', signup);
app.post('/login', login);


// ROUTE SHEETS
app.get('/orders_sheet', AdminAuth, getOrdersSheet);
app.get('/quantity_sheet', AdminAuth, getQuantitySheet);


exports.api = functions.region('europe-west1').https.onRequest(app);
