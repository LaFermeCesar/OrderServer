const {admin} = require('./admin');

const bearerStr = 'Bearer ';

exports.adminID = 'JUSOsVzuneNl6ul26tD2k66mFpD2';

exports.checkIsLogged = (req) => {
    let token;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith(bearerStr)) {
        token = auth.replace(bearerStr, '');
    } else {
        return Promise.reject({error: 'unauthorized request'});
    }
    return admin.auth()
        .verifyIdToken(token)
        .then(decodedIDToken => {
            req.user = decodedIDToken;
        })
}

exports.FBAuth = (req, res, next) => {
    return exports.checkIsLogged(req)
        .then(() => {
            return next();
        })
        .catch((err) => {
            console.error(err);
            return res.status(403).json(err);
        });
};

exports.isAdmin = (req) => req.user && req.user.uid === exports.adminID

exports.AdminAuth = (req, res, next) => {
    return exports.checkIsLogged(req)
        .then(() => {
            if (exports.isAdmin(req)) {
                return next();
            } else {
                const uid = req.user ? req.user.uid : 'null'
                console.error(`user (with uid: ${uid}) is not an admin`);
                return res.status(403).json({error: 'user is not an admin'});
            }
        })
};