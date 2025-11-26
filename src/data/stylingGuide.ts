export const stylingGuide = {
  overview: {
    framework: 'Tailwind CSS',
    approach: 'Design system with CSS variables and semantic tokens',
    darkMode: 'Class-based with next-themes',
    typography: 'System font stack with custom sizes',
    animations: 'CSS keyframes and Tailwind animate utilities'
  },

  cssVariables: {
    light: {
      // Background colors
      '--background': '0 0% 100%', // hsl(0, 0%, 100%) - white
      '--foreground': '240 10% 3.9%', // hsl(240, 10%, 3.9%) - near black
      
      // Card colors
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      
      // Popover colors
      '--popover': '0 0% 100%',
      '--popover-foreground': '240 10% 3.9%',
      
      // Primary brand color
      '--primary': '240 5.9% 10%',
      '--primary-foreground': '0 0% 98%',
      
      // Secondary color
      '--secondary': '240 4.8% 95.9%',
      '--secondary-foreground': '240 5.9% 10%',
      
      // Muted colors
      '--muted': '240 4.8% 95.9%',
      '--muted-foreground': '240 3.8% 46.1%',
      
      // Accent colors
      '--accent': '240 4.8% 95.9%',
      '--accent-foreground': '240 5.9% 10%',
      
      // Destructive colors
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '0 0% 98%',
      
      // Border and input
      '--border': '240 5.9% 90%',
      '--input': '240 5.9% 90%',
      '--ring': '240 5.9% 10%',
      
      // Chart colors
      '--chart-1': '12 76% 61%',
      '--chart-2': '173 58% 39%',
      '--chart-3': '197 37% 24%',
      '--chart-4': '43 74% 66%',
      '--chart-5': '27 87% 67%',
      
      // Radius
      '--radius': '0.5rem'
    },
    
    dark: {
      '--background': '240 10% 3.9%',
      '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%',
      '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%',
      '--popover-foreground': '0 0% 98%',
      '--primary': '0 0% 98%',
      '--primary-foreground': '240 5.9% 10%',
      '--secondary': '240 3.7% 15.9%',
      '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%',
      '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%',
      '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%',
      '--input': '240 3.7% 15.9%',
      '--ring': '240 4.9% 83.9%',
      '--chart-1': '220 70% 50%',
      '--chart-2': '160 60% 45%',
      '--chart-3': '30 80% 55%',
      '--chart-4': '280 65% 60%',
      '--chart-5': '340 75% 55%'
    }
  },

  tailwindConfig: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ]
      }
    }
  },

  typography: {
    headings: {
      h1: 'text-4xl font-bold tracking-tight lg:text-5xl',
      h2: 'text-3xl font-semibold tracking-tight',
      h3: 'text-2xl font-semibold tracking-tight',
      h4: 'text-xl font-semibold tracking-tight',
      h5: 'text-lg font-semibold',
      h6: 'text-base font-semibold'
    },
    body: {
      large: 'text-lg',
      base: 'text-base',
      small: 'text-sm',
      xs: 'text-xs'
    },
    fontWeights: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    }
  },

  spacing: {
    scale: {
      '0': '0',
      '1': '0.25rem',  // 4px
      '2': '0.5rem',   // 8px
      '3': '0.75rem',  // 12px
      '4': '1rem',     // 16px
      '5': '1.25rem',  // 20px
      '6': '1.5rem',   // 24px
      '8': '2rem',     // 32px
      '10': '2.5rem',  // 40px
      '12': '3rem',    // 48px
      '16': '4rem',    // 64px
      '20': '5rem',    // 80px
      '24': '6rem'     // 96px
    },
    containers: {
      page: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      section: 'py-12 md:py-16 lg:py-20',
      card: 'p-4 md:p-6'
    }
  },

  animations: {
    keyframes: {
      'accordion-down': {
        from: { height: '0' },
        to: { height: 'var(--radix-accordion-content-height)' }
      },
      'accordion-up': {
        from: { height: 'var(--radix-accordion-content-height)' },
        to: { height: '0' }
      },
      'slide-in-from-right': {
        '0%': { transform: 'translateX(100%)' },
        '100%': { transform: 'translateX(0)' }
      },
      'slide-out-to-right': {
        '0%': { transform: 'translateX(0)' },
        '100%': { transform: 'translateX(100%)' }
      },
      'fade-in': {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' }
      },
      'fade-out': {
        '0%': { opacity: '1' },
        '100%': { opacity: '0' }
      }
    },
    classes: {
      'accordion-down': 'animate-accordion-down',
      'accordion-up': 'animate-accordion-up',
      'fade-in': 'animate-fade-in',
      'fade-out': 'animate-fade-out',
      'slide-in': 'animate-slide-in-from-right',
      'slide-out': 'animate-slide-out-to-right',
      'spin': 'animate-spin',
      'pulse': 'animate-pulse',
      'bounce': 'animate-bounce'
    }
  },

  componentPatterns: {
    button: {
      base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      variants: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      sizes: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },

    card: {
      base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
      header: 'flex flex-col space-y-1.5 p-6',
      title: 'text-2xl font-semibold leading-none tracking-tight',
      description: 'text-sm text-muted-foreground',
      content: 'p-6 pt-0',
      footer: 'flex items-center p-6 pt-0'
    },

    input: {
      base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
    },

    badge: {
      base: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      variants: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground'
      }
    }
  },

  layoutPatterns: {
    sidebar: {
      width: 'w-64',
      collapsedWidth: 'w-16',
      background: 'bg-sidebar border-r border-sidebar-border',
      item: 'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      activeItem: 'bg-sidebar-accent text-sidebar-accent-foreground'
    },

    header: {
      height: 'h-16',
      background: 'border-b bg-background',
      container: 'flex h-16 items-center gap-4 px-4 md:px-6'
    },

    page: {
      container: 'flex-1 space-y-4 p-4 md:p-8 pt-6',
      header: 'flex items-center justify-between space-y-2',
      title: 'text-3xl font-bold tracking-tight'
    }
  },

  responsiveBreakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  shadows: {
    sm: 'shadow-sm',
    base: 'shadow',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
    inner: 'shadow-inner',
    none: 'shadow-none'
  },

  transitions: {
    all: 'transition-all duration-200 ease-in-out',
    colors: 'transition-colors duration-200 ease-in-out',
    opacity: 'transition-opacity duration-200 ease-in-out',
    transform: 'transition-transform duration-200 ease-in-out'
  }
};
