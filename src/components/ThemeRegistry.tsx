'use client';
import React, { useState } from 'react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: 'mui' });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert.apply(cache, args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#6366f1', // Indigo-500
        light: '#818cf8', // Indigo-400
        dark: '#4f46e5', // Indigo-600
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#14b8a6', // Teal-500
        light: '#2dd4bf', // Teal-400
        dark: '#0d9488', // Teal-600
        contrastText: '#000000',
      },
      background: {
        default: '#0a0d1a', // Deep elegant navy/slate
        paper: '#121829', // Card background
      },
      text: {
        primary: '#f8fafc', // Slate-50
        secondary: '#94a3b8', // Slate-400
      },
      divider: '#1e293b', // Slate-800
      success: {
        main: '#10b981', // Emerald-500
        light: '#34d399',
      },
      warning: {
        main: '#f59e0b', // Amber-500
        light: '#fbbf24',
      },
      info: {
        main: '#3b82f6', // Blue-500
        light: '#60a5fa',
      },
    },
    typography: {
      fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
      h1: {
        fontWeight: 800,
        fontSize: '2.5rem',
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 700,
        fontSize: '1.5rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '0.875rem',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: '#121829',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            boxShadow: '0 4px 30px 0 rgba(0, 0, 0, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            padding: '8px 16px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'none',
          },
          outlined: {
            borderColor: '#1e293b',
            color: '#f8fafc',
            '&:hover': {
              borderColor: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.05)',
              transform: 'translateY(-1px)',
            },
          },
        },
        variants: [
          {
            props: { variant: 'contained', color: 'primary' },
            style: {
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)',
                transform: 'translateY(-1px)',
              },
            },
          },
          {
            props: { variant: 'contained', color: 'secondary' },
            style: {
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                boxShadow: '0 0 15px rgba(20, 184, 166, 0.5)',
                transform: 'translateY(-1px)',
              },
            },
          },
        ],
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontWeight: 550,
          },
        },
      },
    },
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
