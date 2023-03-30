const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SCERET_KEY } = process.env;


module.exports.authentication = async (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.status(403).send({ message: 'No token provided' });
    } else {
        jwt.verify(token, ACCESS_TOKEN_SCERET_KEY, (err, sucessData) => {
            if (err) {
                console.log('Failed to authenticate token.');
                if (err & err.message == "jwt expired") {
                    return res.status(401).send('Error validating token: Session expired on ' + err.expiredAt);
                } else {
                    console.log(err.message)
                    return res.status(400).send(err & err.message ? err.message : 'Failed to authenticate token');
                }

            } else {
                const { _id } = sucessData;
                // console.log("data", _id)
                res.locals.jwtData = _id;
                req.user = _id
                next();
            }
        })
    }
}