import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const AdvancedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let lines = [];
    
    // Set canvas size
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    // Line class
    class Line {
      constructor() {
        this.reset();
      }

      reset() {
        // Randomly start from any edge
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        switch(edge) {
          case 0: // top
            this.x = Math.random() * canvas.width;
            this.y = 0;
            this.speedX = (Math.random() - 0.5) * 0.2;
            this.speedY = Math.random() * 0.2 + 0.1;
            break;
          case 1: // right
            this.x = canvas.width;
            this.y = Math.random() * canvas.height;
            this.speedX = -(Math.random() * 0.2 + 0.1);
            this.speedY = (Math.random() - 0.5) * 0.2;
            break;
          case 2: // bottom
            this.x = Math.random() * canvas.width;
            this.y = canvas.height;
            this.speedX = (Math.random() - 0.5) * 0.2;
            this.speedY = -(Math.random() * 0.2 + 0.1);
            break;
          case 3: // left
            this.x = 0;
            this.y = Math.random() * canvas.height;
            this.speedX = Math.random() * 0.2 + 0.1;
            this.speedY = (Math.random() - 0.5) * 0.2;
            break;
        }
        
        this.length = Math.random() * 100 + 50;
        this.opacity = Math.random() * 0.08 + 0.02; // More subtle opacity
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Reset if out of bounds
        if (this.x < -this.length || this.x > canvas.width + this.length || 
            this.y < -this.length || this.y > canvas.height + this.length) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
          this.x + this.length * this.speedX * 3,
          this.y + this.length * this.speedY * 3
        );
        
        // Create gradient for line
        const gradient = ctx.createLinearGradient(
          this.x, this.y,
          this.x + this.length * this.speedX * 3,
          this.y + this.length * this.speedY * 3
        );
        gradient.addColorStop(0, `rgba(0, 255, 136, 0)`);
        gradient.addColorStop(0.5, `rgba(0, 255, 136, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(0, 255, 136, 0)`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Create lines
    const createLines = () => {
      lines = [];
      const lineCount = Math.min(
        Math.floor((canvas.width * canvas.height) / 70000),
        30 // Reduced number of lines
      );
      for (let i = 0; i < lineCount; i++) {
        lines.push(new Line());
      }
    };

    // Animation loop
    const animate = () => {
      // Semi-transparent clear for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw lines
      lines.forEach(line => {
        line.update();
        line.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize
    createLines();
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        backgroundColor: 'transparent',
        pointerEvents: 'none', // Ensure it doesn't interfere with interactions
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
};

export default AdvancedBackground; 