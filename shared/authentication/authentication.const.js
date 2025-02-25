const {
    SECRET_KEY,
    JWT_SECRET
} = process.env

module.exports ={
    secretkey: SECRET_KEY,
    JWTOptions : {
        jwtSecret: JWT_SECRET,  
        expiresIn: '1d', // Expired in 1 day
        longExpiresIn:'365d' // Refresh in 365 days
    }
};