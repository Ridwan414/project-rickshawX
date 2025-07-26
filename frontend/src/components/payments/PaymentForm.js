import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { CreditCard, AccountBalance, Payment } from '@mui/icons-material';
import { paymentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const PaymentForm = ({ rideDetails, onPaymentComplete }) => {
  const [formData, setFormData] = useState({
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
  });
  const [loading, setLoading] = useState(false);

  const { showError, showSuccess } = useNotification();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (formData.paymentMethod === 'card') {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardHolderName) {
        showError('Please fill in all card details');
        return false;
      }
      if (formData.cardNumber.length < 16) {
        showError('Please enter a valid card number');
        return false;
      }
      if (formData.cvv.length < 3) {
        showError('Please enter a valid CVV');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const paymentData = {
        rideId: rideDetails.id,
        paymentMethod: formData.paymentMethod,
        amount: rideDetails.price,
        ...(formData.paymentMethod === 'card' && {
          cardNumber: formData.cardNumber,
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          cardHolderName: formData.cardHolderName,
        }),
      };

      const response = await paymentsAPI.processPayment(paymentData);
      
      showSuccess('Payment processed successfully!');
      onPaymentComplete(response.data.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Payment failed';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={2}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Complete Payment
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ride Summary
            </Typography>
            <Typography>
              <strong>From:</strong> {rideDetails?.from_location}
            </Typography>
            <Typography>
              <strong>To:</strong> {rideDetails?.to_location}
            </Typography>
            <Typography>
              <strong>Amount:</strong> ৳{rideDetails?.price}
            </Typography>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    label="Payment Method"
                  >
                    <MenuItem value="card">
                      <Box display="flex" alignItems="center">
                        <CreditCard sx={{ mr: 1 }} />
                        Credit/Debit Card
                      </Box>
                    </MenuItem>
                    <MenuItem value="bank">
                      <Box display="flex" alignItems="center">
                        <AccountBalance sx={{ mr: 1 }} />
                        Bank Transfer
                      </Box>
                    </MenuItem>
                    <MenuItem value="cash">
                      <Box display="flex" alignItems="center">
                        <Payment sx={{ mr: 1 }} />
                        Cash
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {formData.paymentMethod === 'card' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Card Number"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      placeholder="1234 5678 9012 3456"
                      inputProps={{ maxLength: 16 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expiry Date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      placeholder="MM/YY"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="CVV"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleChange}
                      placeholder="123"
                      inputProps={{ maxLength: 4 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Card Holder Name"
                      name="cardHolderName"
                      value={formData.cardHolderName}
                      onChange={handleChange}
                    />
                  </Grid>
                </>
              )}
            </Grid>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : `Pay ৳${rideDetails?.price}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentForm; 