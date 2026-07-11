import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  padding = 'p-6',
  hoverEffect = true,
  className = '',
  ...props
}) {
  const hoverAnimation = hoverEffect
    ? {
        whileHover: {
          scale: 1.015,
          y: -2,
          borderColor: 'rgba(124, 58, 237, 0.35)',
          boxShadow: '0 15px 30px -10px rgba(124, 58, 237, 0.15)',
        },
        transition: { type: 'spring', stiffness: 400, damping: 22 },
      }
    : {};

  return (
    <motion.div
      {...hoverAnimation}
      className={`glass-card border rounded-2xl transition-colors duration-300 ${padding} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
