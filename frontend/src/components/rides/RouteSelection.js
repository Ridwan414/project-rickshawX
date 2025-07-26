import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { LocationOn, AccessTime, AttachMoney } from '@mui/icons-material';
import { ridesAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const RouteSelection = ({ onRouteSelect }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { showError } = useNotification();

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await ridesAPI.getRoutes();
      setRoutes(response.data.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load routes';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Available Routes
      </Typography>
      
      <Grid container spacing={2}>
        {routes.map((route) => (
          <Grid item xs={12} sm={6} md={4} key={route.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationOn color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {route.from_location} → {route.to_location}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Chip
                    icon={<AccessTime />}
                    label={`${route.duration} min`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<AttachMoney />}
                    label={`৳${route.price}`}
                    color="primary"
                    size="small"
                  />
                </Box>
                
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => onRouteSelect(route)}
                >
                  Book This Route
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RouteSelection; 