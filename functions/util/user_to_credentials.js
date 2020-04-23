const MAIL_HOSTNAME = 'phone.number';

const Crypto = require("crypto-js");

exports.userToCred = (user) => {
    // email is actually the phone number
    // password is a hash or the name
    const salt = '2enYyo-$Wb;=LZ-5k&]Z%ZrT]6Ab)'; // not really useful
    const email = `${user.phoneNumber.replace(/\s/g, '')}@${MAIL_HOSTNAME}`;
    const password = Crypto.SHA256(salt + [user.lastName, user.firstName].sort().join(';')).toString(Crypto.enc.Hex);

    return {
        email: email,
        password: password,
    }
};