import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedIcon from '@mui/icons-material/Verified';
import LinkIcon from '@mui/icons-material/Link';

const BlockchainVisualization = () => {
  const [blocks, setBlocks] = useState([]);
  const [hoveredBlock, setHoveredBlock] = useState(null);

  useEffect(() => {
    // Generate initial blocks
    const initialBlocks = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      hash: generateHash(),
      timestamp: new Date(Date.now() - (4 - i) * 5000).toLocaleTimeString(),
      transactions: Math.floor(Math.random() * 10) + 1,
      size: (Math.random() * 2 + 0.5).toFixed(2),
    }));
    setBlocks(initialBlocks);

    // Add new blocks periodically
    const interval = setInterval(() => {
      setBlocks(prev => {
        if (prev.length >= 7) {
          return [...prev.slice(1), {
            id: prev[prev.length - 1].id + 1,
            hash: generateHash(),
            timestamp: new Date().toLocaleTimeString(),
            transactions: Math.floor(Math.random() * 10) + 1,
            size: (Math.random() * 2 + 0.5).toFixed(2),
          }];
        }
        return [...prev, {
          id: prev[prev.length - 1].id + 1,
          hash: generateHash(),
          timestamp: new Date().toLocaleTimeString(),
          transactions: Math.floor(Math.random() * 10) + 1,
          size: (Math.random() * 2 + 0.5).toFixed(2),
        }];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const generateHash = () => {
    return Array.from({ length: 8 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '400px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'transparent',
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#00ff88', stopOpacity: 0.3 }} />
            <stop offset="50%" style={{ stopColor: '#00ff88', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#00ff88', stopOpacity: 0.3 }} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {blocks.map((block, index) => {
          if (index === blocks.length - 1) return null;
          const x1 = (index + 1) * (100 / (blocks.length)) + 5;
          const x2 = (index + 2) * (100 / (blocks.length)) - 5;
          return (
            <motion.path
              key={`link-${block.id}`}
              d={`M ${x1}% 50% L ${x2}% 50%`}
              stroke="url(#linkGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1,
                ease: "easeInOut"
              }}
              style={{
                filter: 'url(#glow)',
              }}
            />
          );
        })}
      </svg>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          px: 4,
        }}
      >
        <AnimatePresence mode="popLayout">
          {blocks.map((block) => (
            <motion.div
              key={block.id}
              layout
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 50 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              style={{
                position: 'relative',
                width: '140px',
              }}
              onMouseEnter={() => setHoveredBlock(block.id)}
              onMouseLeave={() => setHoveredBlock(null)}
            >
              <Box
                sx={{
                  bgcolor: 'rgba(0, 255, 136, 0.1)',
                  borderRadius: 2,
                  p: 2,
                  border: '1px solid',
                  borderColor: hoveredBlock === block.id ? 'rgba(0, 255, 136, 0.5)' : 'rgba(0, 255, 136, 0.2)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    bgcolor: 'rgba(0, 255, 136, 0.15)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(0, 255, 136, 0.2)',
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    bgcolor: '#00ff88',
                    opacity: 0.5,
                  }}
                >
                  <motion.div
                    style={{
                      width: '20%',
                      height: '100%',
                      backgroundColor: '#00ff88',
                    }}
                    animate={{
                      x: ['0%', '500%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LockIcon sx={{ color: '#00ff88', fontSize: 16, mr: 1 }} />
                  <Typography variant="caption" sx={{ color: '#00ff88' }}>
                    Block #{block.id}
                  </Typography>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    display: 'block',
                    mb: 1,
                    fontSize: '0.7rem',
                  }}
                >
                  {block.hash}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>
                      {block.transactions} TXs
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      {block.size} MB
                    </Typography>
                  </Box>
                  <VerifiedIcon 
                    sx={{ 
                      color: '#00ff88', 
                      fontSize: 16,
                      opacity: hoveredBlock === block.id ? 1 : 0.5,
                      transition: 'opacity 0.3s ease'
                    }} 
                  />
                </Box>

                {block.id === blocks.length - 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      border: '2px solid #00ff88',
                      borderRadius: 2,
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': {
                          opacity: 0.5,
                          transform: 'scale(1)',
                        },
                        '50%': {
                          opacity: 0.2,
                          transform: 'scale(1.02)',
                        },
                        '100%': {
                          opacity: 0.5,
                          transform: 'scale(1)',
                        },
                      },
                    }}
                  />
                )}
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default BlockchainVisualization; 