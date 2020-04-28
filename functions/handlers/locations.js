const {db} = require('../util/admin');

exports.dbGetLocations = () => {
    return db.collection('locations')
        .get()
        .then((data) => {
            const locations = [];
            data.forEach((doc) => {
                const loc = {
                    locationID: doc.id,
                    ...doc.data()
                };
                locations.push(loc);
            });
            return locations
        })
};

exports.getLocations = (req, res) => {
    return exports.dbGetLocations()
        .then((locations) => res.json(locations))
        .catch((err) => {
            console.error(err);
            return res.status(500).json({error: 'something went wrong'});
        });
};