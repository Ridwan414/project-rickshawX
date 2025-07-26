const express = require('express');
const axios = require('axios');
const router = express.Router();

const RIDE_SERVICE_URL = process.env.RIDE_SERVICE_URL || 'http://localhost:3002';

router.post('/request', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.post(`${RIDE_SERVICE_URL}/rides/request`, req.body, {
            headers: { Authorization: token },
            timeout: 10000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

router.post('/:id/accept', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.post(`${RIDE_SERVICE_URL}/rides/${req.params.id}/accept`, req.body, {
            headers: { Authorization: token },
            timeout: 5000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

router.post('/:id/start', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.post(`${RIDE_SERVICE_URL}/rides/${req.params.id}/start`, req.body, {
            headers: { Authorization: token },
            timeout: 5000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

router.post('/:id/complete', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.post(`${RIDE_SERVICE_URL}/rides/${req.params.id}/complete`, req.body, {
            headers: { Authorization: token },
            timeout: 5000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

router.get('/history', async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        const response = await axios.get(`${RIDE_SERVICE_URL}/rides/history`, {
            headers: { Authorization: token },
            params: req.query,
            timeout: 5000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;