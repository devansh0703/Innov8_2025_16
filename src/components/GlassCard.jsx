import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

export default function GlassCard({ children, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      style={{ height: '100%' }}
    >
      <Box
        sx={{
          position: 'relative',
          padding: 3,
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          background: 'rgba(10, 10, 30, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          height: '100%',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #00ff88, #00b4d8)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 180, 216, 0.05) 100%)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            borderRadius: '16px',
          },
          '&:hover': {
            boxShadow: '0 10px 40px rgba(0, 180, 216, 0.2)',
            transform: 'translateY(-5px)',
            '&::after': {
              opacity: 1,
            }
          },
          ...props.sx
        }}
        {...props}
      >
        {children}
      </Box>
    </motion.div>
  );
} 