import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import { DirectionsCar, Person, Payment, Notifications } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      title: 'Quick Ride Booking',
      description: 'Book your ride in seconds with our easy-to-use interface',
    },
    {
      icon: <Person sx={{ fontSize: 40 }} />,
      title: 'Verified Drivers',
      description: 'All our drivers are verified and background checked',
    },
    {
      icon: <Payment sx={{ fontSize: 40 }} />,
      title: 'Secure Payments',
      description: 'Multiple payment options with secure transaction processing',
    },
    {
      icon: <Notifications sx={{ fontSize: 40 }} />,
      title: 'Real-time Updates',
      description: 'Get live updates about your ride status and driver location',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" gutterBottom>
            Welcome to RickshawX
          </Typography>
          <Typography variant="h5" sx={{ mb: 4 }}>
            Your trusted ride-sharing platform in Bangladesh
          </Typography>
          <Box>
            <Button
              variant="contained"
              size="large"
              sx={{ mr: 2, mb: 2 }}
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ mb: 2 }}
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Why Choose RickshawX?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Ready to Start Your Journey?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4 }}>
            Join thousands of satisfied customers who trust RickshawX for their daily commute
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
          >
            Sign Up Now
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 