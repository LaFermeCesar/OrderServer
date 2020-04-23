const {db} = require('../util/admin');

exports.dbGetBreads = () => {
    return db.collection('breads')
        .get()
        .then((data) => {
            const breads = [];
            data.forEach((doc) => {
                const bread = {
                    breadID: doc.id,
                    ...doc.data()
                };
                breads.push(bread);
            });
            return breads
        });
};

exports.getBreads = (req, res) => {
    return dbGetBreads()
        .then((breads) => res.json(breads))
        .catch((err) => {
            console.error(err);
            return res.status(500).json({error: 'something went wrong'});
        });
};