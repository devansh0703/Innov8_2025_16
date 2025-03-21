import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Box, 
  Typography, 
  Container, 
  Button, 
  Stack,
  Divider,
  useTheme,
  alpha,
  Grid,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Avatar,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import { 
  TrendingUpRounded, 
  AssessmentRounded, 
  PriceCheckRounded,
  RocketLaunchRounded,
  Close as CloseIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  CodeRounded,
  SecurityRounded,
  DesignServicesRounded,
  BusinessRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import our custom components
import AdvancedBackground from '../components/AdvancedBackground';
import GlassCard from '../components/GlassCard';
import BlockchainVisualization from '../components/BlockchainVisualization';
import TransactionTicker from '../components/TransactionTicker';
import TransactionChart from '../components/TransactionChart';
import Navbar from '../components/Navbar';

// Team member data with placeholder images
const teamMembers = [
  {
    name: "Alex Johnson",
    role: "Blockchain Developer",
    image: "/team/placeholder1.jpg",  // These paths will be replaced
    description: "Full-stack developer focused on smart contracts and blockchain integration.",
    icon: <CodeRounded />,
  },
  {
    name: "Taylor Reyes",
    role: "Security Specialist",
    image: "/team/placeholder2.jpg",  // These paths will be replaced
    description: "Specialized in blockchain security and transaction validation protocols.",
    icon: <SecurityRounded />,
  },
  {
    name: "Jordan Chen",
    role: "UI/UX Designer",
    image: "/team/placeholder3.jpg",  // These paths will be replaced
    description: "Creates intuitive interfaces for complex blockchain applications.",
    icon: <DesignServicesRounded />,
  },
  {
    name: "Morgan Williams",
    role: "Project Manager",
    image: "/team/placeholder4.jpg",  // These paths will be replaced
    description: "Coordinates development and ensures project milestones are met.",
    icon: <BusinessRounded />,
  }
];

// About Us Dialog Component
const AboutUsDialog = ({ open, onClose }) => {
  const dialogRef = useRef(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        style: {
          background: 'rgba(10, 10, 30, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        ref: dialogRef
      }}
    >
      <DialogTitle sx={{ 
        color: 'white', 
        pb: 0, 
        pt: 3, 
        background: 'linear-gradient(45deg, #00ff88, #00b4d8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold',
        fontSize: '2rem',
        textAlign: 'center'
      }}>
        About Blocc
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ color: 'white', py: 4 }}>
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 4, color: 'rgba(255, 255, 255, 0.8)' }}>
          Revolutionizing blockchain transactions with cutting-edge technology
        </Typography>
        
        <Box sx={{ mb: 5 }}>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
            Blocc is a next-generation blockchain transaction platform designed to make cryptocurrency 
            trading seamless, secure, and transparent. Our mission is to bridge the gap between complex 
            blockchain technology and everyday users, providing a frictionless experience for managing 
            digital assets.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
            Founded in 2023, our team combines expertise in blockchain development, security, design, 
            and project management to create a platform that stands above the rest. We're committed 
            to innovation, security, and user empowerment.
          </Typography>
        </Box>
        
        <Typography variant="h5" sx={{ 
          mb: 4, 
          textAlign: 'center',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #00ff88, #00b4d8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Meet Our Team
        </Typography>
        
        <Grid container spacing={3}>
          {teamMembers.map((member, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Paper sx={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  height: '100%',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
                  }
                }}>
                  <Box sx={{ position: 'relative', pt: '100%' }}>
                    <Avatar 
                      src={member.image}
                      alt={member.name}
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: 0,
                      }}
                    />
                    <Box sx={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Box sx={{ 
                        bgcolor: 'rgba(0, 255, 136, 0.2)',
                        color: '#00ff88',
                        borderRadius: '50%',
                        p: 1,
                      }}>
                        {member.icon}
                      </Box>
                    </Box>
                  </Box>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {member.name}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: '#00ff88', mb: 1 }}>
                      {member.role}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                      {member.description}
                    </Typography>
                  </CardContent>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

// Hero Section
const HeroSection = () => {
  const [account, setAccount] = useState(null);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Check if MetaMask is installed and account is connected
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum !== undefined) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        })
        .catch(error => {
          console.error('Error checking accounts:', error);
        });
    }
  }, []);

  // Handle Get Started button click
  const handleGetStarted = async () => {
    if (account) {
      // If already connected, navigate to wallet page
      navigate('/wallet');
    } else {
      // If not connected, try to connect
      if (typeof window !== 'undefined' && window.ethereum !== undefined) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            navigate('/wallet');
          }
        } catch (error) {
          console.error('Error connecting wallet:', error);
        }
      } else {
        // MetaMask not installed
        window.open('https://metamask.io/download/', '_blank');
      }
    }
  };

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: '#00ff88',
                    letterSpacing: 2,
                    fontWeight: 'bold',
                  }}
                >
                  Web3 Transaction Platform
                </Typography>
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
                    fontWeight: 'bold',
                    mb: 2,
                    background: 'linear-gradient(45deg, #00ff88, #00b4d8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.1,
                  }}
                >
                  Next-Gen Blockchain Payments
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    color: 'rgba(255, 255, 255, 0.7)',
                    maxWidth: 500,
                    lineHeight: 1.5,
                  }}
                >
                  Secure, fast, and transparent transactions powered by blockchain technology
                </Typography>
                <Stack direction="row" spacing={2}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<RocketLaunchRounded />}
                      onClick={handleGetStarted}
                      sx={{
                        background: 'linear-gradient(45deg, #00ff88, #00b4d8)',
                        borderRadius: '50px',
                        px: 4,
                        py: 1.5,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: '0 4px 14px 0 rgba(0, 255, 136, 0.25)',
                      }}
                    >
                      Get Started
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => setAboutDialogOpen(true)}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '50px',
                        px: 4,
                        py: 1.5,
                        color: 'white',
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&:hover': {
                          borderColor: '#00ff88',
                          background: 'rgba(0, 255, 136, 0.05)',
                        },
                      }}
                    >
                      Learn More
                    </Button>
                  </motion.div>
                </Stack>
              </Box>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: { xs: '300px', md: '400px' },
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backdropFilter: 'blur(5px)',
                  background: 'rgba(10, 10, 30, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <BlockchainVisualization />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
                    Live blockchain visualization
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
        
        {/* About Us Dialog */}
        <AboutUsDialog 
          open={aboutDialogOpen} 
          onClose={() => setAboutDialogOpen(false)} 
        />

        {/* Feature cards */}
        <Box sx={{ mt: 8 }}>
          <Grid container spacing={3}>
            {[
              { 
                icon: <TrendingUpRounded fontSize="large" />, 
                title: 'Track Transactions', 
                description: 'Monitor all your blockchain transactions in real-time.' 
              },
              { 
                icon: <AssessmentRounded fontSize="large" />, 
                title: 'Analytics Dashboard', 
                description: 'Comprehensive analytics on your transaction history.' 
              },
              { 
                icon: <PriceCheckRounded fontSize="large" />, 
                title: 'Secure Payments', 
                description: 'Industry-leading security for all your transactions.' 
              },
            ].map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <GlassCard delay={index * 0.1 + 0.4}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start', 
                    height: '100%' 
                  }}>
                    <Box 
                      sx={{ 
                        mb: 2, 
                        p: 1.5, 
                        borderRadius: '12px', 
                        background: 'rgba(0, 255, 136, 0.1)', 
                        color: '#00ff88'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

// Live Transactions Section
const LiveTransactionsSection = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ py: 8, background: alpha(theme.palette.background.paper, 0.3) }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h2"
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                mb: 1,
                fontSize: { xs: '2rem', md: '3rem' },
              }}
            >
              Live Transactions
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ textAlign: 'center', mb: 2, maxWidth: 800, mx: 'auto' }}
            >
              Watch blockchain transactions happening in real-time
            </Typography>
            <Divider 
              sx={{ 
                width: '80px', 
                mx: 'auto', 
                mb: 4, 
                borderColor: 'rgba(0, 255, 136, 0.5)' 
              }} 
            />
          </motion.div>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <GlassCard delay={0.1}>
              <Typography variant="h6" gutterBottom>
                Transaction Volume
              </Typography>
              <Box sx={{ height: 350 }}>
                <TransactionChart />
              </Box>
            </GlassCard>
          </Grid>
          <Grid item xs={12} md={5}>
            <GlassCard delay={0.2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Recent Transactions
                </Typography>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '50px',
                    bgcolor: 'rgba(0, 255, 136, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#00ff88',
                      mr: 1,
                      animation: 'pulse 1.5s infinite',
                      '@keyframes pulse': {
                        '0%': {
                          boxShadow: '0 0 0 0 rgba(0, 255, 136, 0.4)',
                        },
                        '70%': {
                          boxShadow: '0 0 0 6px rgba(0, 255, 136, 0)',
                        },
                        '100%': {
                          boxShadow: '0 0 0 0 rgba(0, 255, 136, 0)',
                        },
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#00ff88', fontWeight: 'medium' }}>
                    Live
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ height: 350, overflow: 'auto' }}>
                <TransactionTicker />
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default function Home() {
  return (
    <Box sx={{ minHeight: '100vh', color: 'white' }}>
      <AdvancedBackground />
      <Navbar />
      <Box sx={{ height: '80px' }} /> {/* Spacer for fixed navbar */}
      <HeroSection />
      <LiveTransactionsSection />
    </Box>
  );
} 