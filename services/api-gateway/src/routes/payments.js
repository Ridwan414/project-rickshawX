const express = require('express');
const axios = require('axios');
const router = express.Router();

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003';

router.post('/process', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.post(`${PAYMENT_SERVICE_URL}/payments/process`, req.body, {
            headers: { Authorization: token },
            timeout: 10000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

router.get('/history', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.get(`${PAYMENT_SERVICE_URL}/payments/history`, {
            headers: { Authorization: token },
            params: req.query,
            timeout: 5000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

router.post('/refund', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.post(`${PAYMENT_SERVICE_URL}/payments/refund`, req.body, {
            headers: { Authorization: token },
            timeout: 10000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;