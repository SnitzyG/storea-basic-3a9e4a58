import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'sans': ['Outfit', 'Calibri', 'system-ui', 'sans-serif'],
				'display': ['Montserrat', 'Outfit', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					subtle: 'hsl(var(--accent-subtle))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
				},
				'construction-warning': 'hsl(var(--construction-warning))',
				'construction-success': 'hsl(var(--construction-success))',
				'construction-info': 'hsl(var(--construction-info))'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-gold': 'var(--gradient-gold)',
				'gradient-subtle': 'var(--gradient-subtle)',
			},
			boxShadow: {
				'elegant': 'var(--shadow-elegant)',
				'glow': 'var(--shadow-glow)',
			},
			transitionTimingFunction: {
				'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
				'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fadeInUp': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fadeIn': {
					'0%': {
						opacity: '0'
					},
					'100%': {
						opacity: '1'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-6px)'
					}
				},
				'shimmer': {
					'0%': {
						backgroundPosition: '-1000px 0'
					},
					'100%': {
						backgroundPosition: '1000px 0'
					}
				},
				'slideInLeft': {
					'from': {
						opacity: '0',
						transform: 'translateX(-30px)'
					},
					'to': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'slideInRight': {
					'from': {
						opacity: '0',
						transform: 'translateX(30px)'
					},
					'to': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'scaleIn': {
					'from': {
						opacity: '0',
						transform: 'scale(0.9)'
					},
					'to': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'buildUp': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px) scaleY(0.8)',
						transformOrigin: 'bottom'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0) scaleY(1)'
					}
				},
				'constructionPulse': {
					'0%, 100%': {
						boxShadow: '0 0 0 0 hsl(var(--accent) / 0.4)'
					},
					'50%': {
						boxShadow: '0 0 0 10px hsl(var(--accent) / 0)'
					}
				},
				'stackBlocks': {
					'0%': {
						transform: 'translateY(100%)',
						opacity: '0'
					},
					'60%': {
						transform: 'translateY(-10%)'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'shimmer': 'shimmer 2s linear infinite',
				'slide-in-left': 'slideInLeft 0.5s ease-out',
				'slide-in-right': 'slideInRight 0.5s ease-out',
				'scale-in': 'scaleIn 0.3s ease-out',
				'build-up': 'buildUp 0.6s ease-out',
				'construction-pulse': 'constructionPulse 2s ease-in-out infinite',
				'stack-blocks': 'stackBlocks 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
