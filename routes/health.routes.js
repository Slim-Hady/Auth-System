const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/' , async (req, res) => {
    const healthCheck = {
        status: 'Up',
        upTime: process.uptime(),
        timestamp: new Date().toISOString(),
        checks : {
            database: "unknown"
        }
    };
    try{
        const isConnected = mongoose.connection.readyState === 1;
        
        if (!isConnected) {
            throw new Error('Mongoose connection readyState is not 1 (Connected)');
        }
        healthCheck.checks.database = "UP";
        res.status(200).json(healthCheck);
    }
    catch(err){
        healthCheck.status = "DOWN";
        healthCheck.checks.database = "DOWN";
        healthCheck.error = err.message;
        res.status(503).json(healthCheck);
    }
}); 

module.exports = router;