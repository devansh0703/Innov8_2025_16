import { useState, useEffect, useRef } from 'react';
import { IconButton, Paper, TextField, Box, Typography, Link } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ChatAssistant = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState(null);
  const [error, setError] = useState(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Chat service is not configured. Please check environment variables.');
      return;
    }
    
    fetchApiEndpoint();
    // Fetch endpoint every minute to ensure we have the latest URL
    const interval = setInterval(fetchApiEndpoint, 60000);
    return () => clearInterval(interval);
  }, []);

  // Add welcome message when chat is opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        text: "Hello, I am Arya. How may I help you?",
        sender: 'assistant',
        isPath: false
      }]);
    }
  }, [isOpen, messages.length]);

  // Add click-outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && chatRef.current && !chatRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    // Add event listener when chat is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchApiEndpoint = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error: supabaseError } = await supabase
        .from('ngrok')
        .select('url')
        .eq('id', 1)
        .single();

      if (supabaseError) throw supabaseError;
      if (data?.url) {
        setApiEndpoint(data.url);
        setError(null);
      } else {
        setError('Chat service endpoint not found');
      }
    } catch (err) {
      console.error('Error fetching API endpoint:', err);
      setError('Unable to connect to chat service');
    }
  };

  const handleNavigation = (path) => {
    if (path.startsWith('/')) {
      navigate(path);
      setIsOpen(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !apiEndpoint) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiEndpoint}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruction: input }),
      });

      if (!response.ok) throw new Error('API response was not ok');

      const data = await response.json();
      const responseText = data.response || data.message || 'No response received';
      
      // Check if it's the error message
      if (responseText === "I am sorry I am not able to help you with that") {
        setMessages(prev => [...prev, { 
          text: responseText,
          sender: 'assistant',
          isPath: false
        }]);
      } else {
        // For other responses, handle as potential paths
        setMessages(prev => [...prev, { 
          text: responseText,
          displayText: responseText.startsWith('/') ? responseText.substring(1) : responseText,
          sender: 'assistant',
          isPath: responseText.startsWith('/'),
          fullUrl: responseText.startsWith('/') ? `http://localhost:5173${responseText}` : responseText
        }]);
      }
    } catch (err) {
      console.error('Error fetching response:', err);
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error. Please try again later.',
        sender: 'assistant',
        isPath: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: '80px',
              right: '20px',
              zIndex: 1000,
            }}
            ref={chatRef}
          >
            <Paper
              elevation={3}
              sx={{
                width: '300px',
                height: '400px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 2,
                bgcolor: 'rgba(18, 18, 18, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" sx={{ color: '#00ff88' }}>Arya</Typography>
                <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(0, 0, 0, 0.1)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                  },
                }}
              >
                {error && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'rgba(255, 0, 0, 0.1)',
                      borderRadius: 1,
                      border: '1px solid rgba(255, 0, 0, 0.2)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#ff6b6b' }}>
                      {error}
                    </Typography>
                  </Box>
                )}
                {messages.map((message, index) => (
                  <Box
                    key={index}
                    sx={{
                      alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      position: 'relative',
                      '&:hover': message.isPath ? {
                        '&::after': {
                          content: '"Click to navigate"',
                          position: 'absolute',
                          bottom: '-20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          whiteSpace: 'nowrap',
                        }
                      } : {},
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        bgcolor: message.sender === 'user' 
                          ? 'rgba(0, 255, 136, 0.15)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        color: message.sender === 'user' 
                          ? '#00ff88' 
                          : '#fff',
                        borderRadius: message.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        border: '1px solid',
                        borderColor: message.sender === 'user' 
                          ? 'rgba(0, 255, 136, 0.3)' 
                          : 'rgba(255, 255, 255, 0.1)',
                        cursor: message.isPath ? 'pointer' : 'default',
                        transition: 'all 0.3s ease',
                        boxShadow: message.isPath ? '0 2px 8px rgba(0, 255, 136, 0.1)' : 'none',
                        '&:hover': message.isPath ? {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 255, 136, 0.2)',
                        } : {},
                      }}
                      onClick={() => message.isPath && handleNavigation(message.text)}
                    >
                      <Typography 
                        variant="body2" 
                        component={message.isPath ? Link : 'p'}
                        sx={{
                          color: 'inherit',
                          textDecoration: message.isPath ? 'none' : 'none',
                          fontWeight: message.isPath ? 500 : 400,
                          letterSpacing: '0.2px',
                          lineHeight: 1.5,
                          fontSize: '0.95rem',
                          '&:hover': {
                            color: message.isPath ? '#00ff88' : 'inherit',
                          },
                          ...(message.isPath && {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            '&::before': {
                              content: '"→"',
                              fontSize: '1.1rem',
                              opacity: 0,
                              transition: 'opacity 0.2s ease',
                            },
                            '&:hover::before': {
                              opacity: 1,
                            }
                          })
                        }}
                      >
                        {message.isPath ? message.displayText : message.text}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
                {isLoading && (
                  <Box sx={{ alignSelf: 'flex-start' }}>
                    <Paper
                      sx={{
                        p: 1.5,
                        bgcolor: 'rgba(0, 180, 216, 0.15)',
                        borderRadius: '20px 20px 20px 4px',
                        border: '1px solid rgba(0, 180, 216, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 2px 8px rgba(0, 180, 216, 0.1)',
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#00b4d8',
                          fontWeight: 500,
                          letterSpacing: '0.2px',
                        }}
                      >
                        Thinking
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            style={{
                              width: 4,
                              height: 4,
                              backgroundColor: '#00b4d8',
                              borderRadius: '50%',
                            }}
                            animate={{
                              y: ['0%', '-50%', '0%'],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Box>

              <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={error ? "Chat service unavailable..." : "Type your message..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!!error}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                      },
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'white',
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <IconButton 
                        onClick={handleSend} 
                        disabled={!input.trim() || isLoading || !!error}
                        sx={{ 
                          color: input.trim() && !isLoading && !error ? '#00ff88' : 'rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <SendIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          scale: isOpen ? 0.8 : 1,
          opacity: isOpen ? 0.8 : 1,
        }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      >
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            width: 56,
            height: 56,
            boxShadow: '0 4px 12px rgba(0, 255, 136, 0.3)',
          }}
        >
          <ChatIcon />
        </IconButton>
      </motion.div>
    </>
  );
};

export default ChatAssistant; 