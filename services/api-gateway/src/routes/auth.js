const express = require('express');
const axios = require('axios');
const router = express.Router();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

router.post('/register', async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SERVICE_URL}/auth/register`, req.body, {
            timeout: 10000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const response = await axios.post(`${USER_SERVICE_URL}/auth/login`, req.body, {
            timeout: 10000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

router.post('/logout', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.post(`${USER_SERVICE_URL}/auth/logout`, {}, {
            headers: { Authorization: token },
            timeout: 5000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;