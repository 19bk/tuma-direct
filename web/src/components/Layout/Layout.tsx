import React from 'react';
import { Container, Box } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
      <Box sx={{ minHeight: 'calc(100vh - 128px)' }}>
        {children}
      </Box>
    </Container>
  );
};

export default Layout; 