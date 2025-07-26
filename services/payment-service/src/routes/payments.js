const express = require('express');
const Joi = require('joi');
const Payment = require('../models/Payment');
const authMiddleware = require('../middleware/auth');
const redis = require('../config/redis');

const router = express.Router();

const processPaymentSchema = Joi.object({
    rideId: Joi.number().integer().positive().required(),
    paymentMethod: Joi.string().valid('cash', 'card', 'mobile_banking', 'digital_wallet').required()
});

const refundSchema = Joi.object({
    paymentId: Joi.number().integer().positive().required(),
    reason: Joi.string().optional()
});

router.post('/process', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'user') {
            return res.status(403).json({ error: 'Only users can process payments' });
        }

        const { error, value } = processPaymentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: error.details[0].message 
            });
        }

        const { rideId, paymentMethod } = value;

        const result = await Payment.processPayment(rideId, paymentMethod, req.userId);
        const { payment, ride } = result;

        if (paymentMethod !== 'cash') {
            const gatewayResult = await Payment.simulatePaymentGateway(payment.amount, paymentMethod);
            
            if (!gatewayResult.success) {
                await Payment.updateStatus(payment.id, 'failed');
                return res.status(400).json({
                    error: 'Payment processing failed',
                    message: gatewayResult.message
                });
            }
        }

        await Payment.updateStatus(payment.id, 'completed');

        await redis.publish('payment_processed', {
            paymentId: payment.id,
            rideId: rideId,
            userId: req.userId,
            driverId: ride.driver_id,
            amount: payment.amount,
            paymentMethod: paymentMethod,
            timestamp: new Date().toISOString()
        });

        res.status(200).json({
            message: 'Payment processed successfully',
            payment: {
                id: payment.id,
                rideId: payment.ride_id,
                amount: payment.amount,
                paymentMethod: payment.payment_method,
                transactionId: payment.transaction_id,
                status: 'completed',
                processedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Process payment error:', error);

        if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
            return res.status(400).json({ 
                error: 'Payment processing failed',
                message: error.message 
            });
        }

        if (error.message.includes('already processed')) {
            return res.status(409).json({ 
                error: 'Payment already processed',
                message: error.message 
            });
        }

        res.status(500).json({ 
            error: 'Failed to process payment',
            message: error.message 
        });
    }
});

router.get('/history', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const payments = await Payment.getPaymentHistory(req.userId, req.user.type, limit, offset);

        res.status(200).json({
            payments: payments,
            count: payments.length,
            limit: limit,
            offset: offset
        });

    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ 
            error: 'Failed to get payment history',
            message: error.message 
        });
    }
});

router.post('/refund', authMiddleware, async (req, res) => {
    try {
        const { error, value } = refundSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: error.details[0].message 
            });
        }

        const { paymentId, reason } = value;

        const refundedPayment = await Payment.processRefund(paymentId, req.userId);

        res.status(200).json({
            message: 'Refund processed successfully',
            payment: {
                id: refundedPayment.id,
                rideId: refundedPayment.ride_id,
                amount: refundedPayment.amount,
                status: refundedPayment.status,
                refundedAt: refundedPayment.processed_at
            },
            reason: reason || 'User requested refund'
        });

    } catch (error) {
        console.error('Process refund error:', error);

        if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
            return res.status(400).json({ 
                error: 'Refund processing failed',
                message: error.message 
            });
        }

        res.status(500).json({ 
            error: 'Failed to process refund',
            message: error.message 
        });
    }
});

router.get('/earnings', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'driver') {
            return res.status(403).json({ error: 'Only drivers can view earnings' });
        }

        const driverQuery = 'SELECT id FROM drivers WHERE user_id = $1';
        const driverResult = await require('../config/database').query(driverQuery, [req.userId]);
        
        if (driverResult.rows.length === 0) {
            return res.status(404).json({ error: 'Driver profile not found' });
        }

        const driverId = driverResult.rows[0].id;
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;

        const earnings = await Payment.getEarnings(driverId, startDate, endDate);

        res.status(200).json({
            earnings: {
                totalRides: parseInt(earnings.total_rides),
                totalEarnings: parseFloat(earnings.total_earnings),
                averageFare: parseFloat(earnings.average_fare) || 0
            },
            period: {
                startDate: startDate || 'All time',
                endDate: endDate || 'Present'
            }
        });

    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ 
            error: 'Failed to get earnings',
            message: error.message 
        });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.user_id !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized to view this payment' });
        }

        res.status(200).json(payment);

    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ 
            error: 'Failed to get payment',
            message: error.message 
        });
    }
});

module.exports = router;