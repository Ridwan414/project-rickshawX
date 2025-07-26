const express = require('express');
const axios = require('axios');
const router = express.Router();

const RIDE_SERVICE_URL = process.env.RIDE_SERVICE_URL || 'http://localhost:3002';

router.get('/', async (req, res, next) => {
    try {
        const response = await axios.get(`${RIDE_SERVICE_URL}/routes`, {
            timeout: 5000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;