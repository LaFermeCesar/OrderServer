const {db} = require('../util/admin');
const firebase = require('firebase');
const firebaseConfig = require('../util/firebase_config');
const {adminID} = require("../util/firebase_auth");
const {dbGetBreads} = require("./breads");
const {dbGetLocations} = require("./locations");
const {staticValidateUser} = require('../util/validaters');
const {userToCred} = require("../util/user_to_credentials");

firebase.initializeApp(firebaseConfig);


exports.dbGetUsers = () => {
    return db.collection('users')
        .get()
        .then((data) => {
            const users = [];
            data.forEach((doc) => {
                const user = {
                    userID: doc.id,
                    ...doc.data()
                };
                users.push(user);
            });
            return users
        });
};


exports.signup = (req, res) => {
    const {errors, user: newUser} = staticValidateUser(req.body.phoneNumber, req.body.lastName, req.body.firstName);

    if (errors) {
        return res.status(400).json(errors)
    }


    return db.doc(`/users/${newUser.phoneNumber}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return res.status(400).json({phoneNumber: 'phone number already in use'});
            } else {
                const cred = userToCred(newUser);
                let token, userID, locations;
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(cred.email, cred.password)
                    .then((data) => {
                        userID = data.user.uid;
                        return data.user.getIdToken();
                    })
                    .then((token_) => {
                        token = token_;
                        return db.doc(`/users/${userID}`).set(newUser)
                    })
                    .then(() => dbGetLocations())
                    .then((locations_) => {
                        locations = locations_;
                        return dbGetBreads();
                    })
                    .then((breads) => {
                        const user = {isAdmin: userID === adminID}
                        return res.json({token, locations, breads, user});
                    })
                    .catch((err) => {
                        console.error(err);
                        // this should never be accessed as the doc.exists() above check this already
                        if (err.code === 'auth/email-already-in-use') {
                            return res.status(400).json({phoneNumber: 'already in use'})
                        } else {
                            return res.status(500).json({general: 'something went wrong, please try again'});
                        }
                    });
            }
        });
};

exports.login = (req, res) => {

    const {errors, user} = staticValidateUser(req.body.phoneNumber, req.body.lastName, req.body.firstName);

    if (errors) {
        return res.status(400).json(errors)
    }

    const cred = userToCred(user);
    let token, userID, locations;

    return firebase
        .auth()
        .signInWithEmailAndPassword(cred.email, cred.password)
        .then((data) => {
            userID = data.user.uid;
            return data.user.getIdToken();
        })
        .then((token_) => {
            token = token_;
            return dbGetLocations();
        })
        .then((locations_) => {
            locations = locations_;
            return dbGetBreads();
        })
        .then((breads) => {
            const user = {isAdmin: userID === adminID}
            return res.json({token, locations, breads, user});
        })
        .catch((err) => {
            console.error(err);
            // if (err.code === 'auth/wrong-password') {
            return res.status(403).json({general: 'wrong credentials, please try again.'})
            // } else {
            //     return res.status(500).json({error: err.code});
            // }
        })

};
