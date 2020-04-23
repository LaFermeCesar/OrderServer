const {admin} = require('./admin');

exports.FBAuth = (req, res, next) => {
    let token;
    const auth = req.headers.authorization;
    const bearerStr = 'Bearer ';
    if (auth && auth.startsWith(bearerStr)) {
        token = auth.replace(bearerStr, '');
    } else {
        console.error('no token found');
        return res.status(403).json({error: 'unauthorized request'})
    }

    admin.auth().verifyIdToken(token)
        .then(decodedToken => {
            req.user = decodedToken;
            return next();
        })
        .catch((err) => {
            console.error('error while verifying error', err);
            return res.status(403).json(err)
        })
};


exports.AdminAuth = (req, res, next) => {
    let token;
    const auth = req.headers.authorization;
    const bearerStr = 'Bearer ';
    if (auth && auth.startsWith(bearerStr)) {
        token = auth.replace(bearerStr, '');
    } else {
        console.error('no token found');
        return res.status(403).json({error: 'unauthorized request'})
    }

    admin.auth().verifyIdToken(token)
        .then(decodedToken => {
            req.user = decodedToken;
            if (req.user.uid === 'CXTGWqQv8YgBhzdmlTAwdNtuXF02') {
                return next();
            } else {
                return Promise.reject({error: 'user is not an admin'})
            }
        })
        .catch((err) => {
            console.error('error while verifying error', err);
            return res.status(403).json(err)
        })
};