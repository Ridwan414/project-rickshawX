import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
} from '@mui/material';
import { Person, Phone, DirectionsCar } from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { ridesAPI } from '../../services/api';

const steps = ['Route Selected', 'Finding Driver', 'Driver Assigned', 'Trip Started'];

const RideBooking = ({ selectedRoute, onBookingComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [rideId, setRideId] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { on, off } = useWebSocket();
  const { showError, showSuccess, showInfo } = useNotification();

  useEffect(() => {
    if (selectedRoute) {
      requestRide();
    }
  }, [selectedRoute]);

  useEffect(() => {
    // Listen for WebSocket events
    on('ride_accepted', handleRideAccepted);
    on('trip_started', handleTripStarted);
    on('trip_completed', handleTripCompleted);

    return () => {
      off('ride_accepted', handleRideAccepted);
      off('trip_started', handleTripStarted);
      off('trip_completed', handleTripCompleted);
    };
  }, []);

  const requestRide = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await ridesAPI.requestRide(selectedRoute.id);
      setRideId(response.data.data.id);
      setActiveStep(1);
      showInfo('Looking for available drivers...');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to request ride';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRideAccepted = (data) => {
    setDriverInfo(data.driver);
    setActiveStep(2);
    showSuccess('Driver found! Your ride is on the way.');
  };

  const handleTripStarted = (data) => {
    setActiveStep(3);
    showInfo('Trip has started. Have a safe journey!');
  };

  const handleTripCompleted = (data) => {
    showSuccess('Trip completed! Please complete your payment.');
    onBookingComplete(data);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Booking Your Ride
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {activeStep >= 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Route Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography>
                  <strong>From:</strong> {selectedRoute.from_location}
                </Typography>
                <Typography>
                  <strong>To:</strong> {selectedRoute.to_location}
                </Typography>
                <Typography>
                  <strong>Price:</strong> ৳{selectedRoute.price}
                </Typography>
                <Typography>
                  <strong>Duration:</strong> {selectedRoute.duration} minutes
                </Typography>
              </Box>
            </Box>
          )}
          
          {driverInfo && (
            <Box mt={2}>
              <Typography variant="h6" gutterBottom>
                Driver Information
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 2 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">{driverInfo.name}</Typography>
                  <Chip
                    icon={<Phone />}
                    label={driverInfo.phone}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
              <Box display="flex" alignItems="center">
                <DirectionsCar sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {driverInfo.vehicle_model} - {driverInfo.vehicle_number}
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RideBooking; 