import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Person, Phone, DirectionsCar, LocationOn } from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { driversAPI, ridesAPI } from '../../services/api';

const DriverDashboard = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [loading, setLoading] = useState(false);

  const { on, off, emit } = useWebSocket();
  const { showError, showSuccess, showInfo } = useNotification();

  useEffect(() => {
    // Listen for ride requests
    on('ride_request', handleRideRequest);
    on('trip_completed', handleTripCompleted);

    return () => {
      off('ride_request', handleRideRequest);
      off('trip_completed', handleTripCompleted);
    };
  }, []);

  const handleRideRequest = (data) => {
    setRideRequests(prev => [...prev, data]);
    showInfo('New ride request received!');
  };

  const handleTripCompleted = (data) => {
    setCurrentRide(null);
    setIsAvailable(true);
    showSuccess('Trip completed successfully!');
  };

  const toggleAvailability = async () => {
    setLoading(true);
    try {
      const newStatus = !isAvailable ? 'available' : 'offline';
      await driversAPI.updateStatus(newStatus);
      setIsAvailable(!isAvailable);
      showSuccess(`Status updated to ${newStatus}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update status';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const acceptRide = async (rideId) => {
    try {
      await ridesAPI.acceptRide(rideId);
      const acceptedRide = rideRequests.find(r => r.id === rideId);
      setCurrentRide(acceptedRide);
      setRideRequests([]);
      setIsAvailable(false);
      showSuccess('Ride accepted successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to accept ride';
      showError(errorMessage);
    }
  };

  const startTrip = async () => {
    if (currentRide) {
      try {
        await ridesAPI.startTrip(currentRide.id);
        emit('trip_started', { rideId: currentRide.id });
        showInfo('Trip started!');
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to start trip';
        showError(errorMessage);
      }
    }
  };

  const completeTrip = async () => {
    if (currentRide) {
      try {
        await ridesAPI.completeTrip(currentRide.id);
        emit('trip_completed', { rideId: currentRide.id });
        showSuccess('Trip completed!');
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to complete trip';
        showError(errorMessage);
      }
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Driver Dashboard
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Status
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isAvailable}
                onChange={toggleAvailability}
                disabled={loading}
              />
            }
            label={isAvailable ? 'Available' : 'Offline'}
          />
          {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </CardContent>
      </Card>

      {currentRide && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Ride
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography>
                <strong>From:</strong> {currentRide.from_location}
              </Typography>
              <Typography>
                <strong>To:</strong> {currentRide.to_location}
              </Typography>
              <Typography>
                <strong>Price:</strong> ৳{currentRide.price}
              </Typography>
              <Typography>
                <strong>Duration:</strong> {currentRide.duration} minutes
              </Typography>
            </Box>
            <Box>
              <Button
                variant="contained"
                onClick={startTrip}
                sx={{ mr: 1 }}
              >
                Start Trip
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={completeTrip}
              >
                Complete Trip
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {rideRequests.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Incoming Ride Requests
            </Typography>
            <List>
              {rideRequests.map((ride, index) => (
                <React.Fragment key={ride.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="subtitle1">
                            {ride.from_location} → {ride.to_location}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`৳${ride.price}`}
                              color="primary"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={`${ride.duration} min`}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <Button
                      variant="contained"
                      onClick={() => acceptRide(ride.id)}
                    >
                      Accept
                    </Button>
                  </ListItem>
                  {index < rideRequests.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DriverDashboard; 