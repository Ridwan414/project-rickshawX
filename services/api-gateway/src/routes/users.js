const express = require('express');
const axios = require('axios');
const router = express.Router();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

router.get('/profile', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.get(`${USER_SERVICE_URL}/users/profile`, {
            headers: { Authorization: token },
            timeout: 5000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

router.put('/profile', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.put(`${USER_SERVICE_URL}/users/profile`, req.body, {
            headers: { Authorization: token },
            timeout: 5000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

router.put('/drivers/status', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.put(`${USER_SERVICE_URL}/drivers/status`, req.body, {
            headers: { Authorization: token },
            timeout: 5000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;