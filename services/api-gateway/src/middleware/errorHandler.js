const errorHandler = (error, req, res, next) => {
    console.error('API Gateway Error:', error);

    if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
            error: 'Service temporarily unavailable',
            message: 'Please try again later'
        });
    }

    if (error.response) {
        return res.status(error.response.status).json({
            error: error.response.data.error || 'Service error',
            message: error.response.data.message || 'An error occurred'
        });
    }

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            message: error.message
        });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong'
    });
};

module.exports = errorHandler;