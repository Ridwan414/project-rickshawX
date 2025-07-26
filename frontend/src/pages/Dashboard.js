import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import RouteSelection from '../components/rides/RouteSelection';
import RideBooking from '../components/rides/RideBooking';
import PaymentForm from '../components/payments/PaymentForm';
import DriverDashboard from '../components/drivers/DriverDashboard';

const Dashboard = () => {
  const { user, userType } = useAuth();
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    setActiveTab(1);
  };

  const handleBookingComplete = (rideData) => {
    setCurrentRide(rideData);
    setActiveTab(2);
  };

  const handlePaymentComplete = () => {
    setSelectedRoute(null);
    setCurrentRide(null);
    setActiveTab(0);
  };

  // Driver Dashboard
  if (userType === 'driver') {
    return <DriverDashboard />;
  }

  // User Dashboard
  const tabs = [
    { label: 'Book Ride', component: <RouteSelection onRouteSelect={handleRouteSelect} /> },
    { label: 'Ride Status', component: selectedRoute && <RideBooking selectedRoute={selectedRoute} onBookingComplete={handleBookingComplete} /> },
    { label: 'Payment', component: currentRide && <PaymentForm rideDetails={currentRide} onPaymentComplete={handlePaymentComplete} /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name}!
      </Typography>
      
      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {tabs[activeTab]?.component || (
            <Typography>Please select a route to continue</Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard; 