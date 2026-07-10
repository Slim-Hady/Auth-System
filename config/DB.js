const mongoose = require('mongoose');
const {MONGO_URI} = require('./key.js');

const MONGO_CONNECTION = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected with database");
    }
    catch(err){
        console.log(err);
    }
}

module.exports = MONGO_CONNECTION;