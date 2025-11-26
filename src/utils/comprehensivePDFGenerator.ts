import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { platformDocumentation } from '@/data/platformDocumentation';
import { databaseSchema } from '@/data/databaseSchemaDoc';
import { componentLibrary } from '@/data/componentLibraryDoc';
import { hooksDocumentation } from '@/data/hooksDocumentation';
import { pageDocumentation } from '@/data/pageByPageDoc';
import { stylingGuide } from '@/data/stylingGuide';
import { supabaseInfrastructure } from '@/data/supabaseInfraDoc';

export class ComprehensivePDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;
  private primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  private secondaryColor: [number, number, number] = [100, 100, 100]; // Gray
  private pageNumber: number = 0;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Helper Methods
  private addNewPage() {
    this.doc.addPage();
    this.currentY = this.margin;
    this.pageNumber++;
  }

  private checkPageBreak(height: number) {
    if (this.currentY + height > this.pageHeight - this.margin) {
      this.addNewPage();
    }
  }

  private drawTriangle(x: number, y: number, x2: number, y2: number, x3: number, y3: number, style: 'F' | 'S' = 'F') {
    this.doc.lines([[x2 - x, y2 - y], [x3 - x, y3 - y], [0, 0]], x, y, [1, 1], style, true);
  }

  private addTitle(text: string, size: number = 20) {
    this.checkPageBreak(15);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...this.primaryColor);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += size / 2;
  }

  private addSubtitle(text: string, size: number = 16) {
    this.checkPageBreak(12);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...this.primaryColor);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += size / 2 + 2;
  }

  private addSectionTitle(text: string, size: number = 14) {
    this.checkPageBreak(10);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += size / 2 + 2;
  }

  private addText(text: string, size: number = 10, indent: number = 0) {
    this.doc.setFontSize(size);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    const maxWidth = this.pageWidth - (2 * this.margin) - indent;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(7);
      this.doc.text(line, this.margin + indent, this.currentY);
      this.currentY += 5;
    });
    this.currentY += 2;
  }

  private addBulletPoint(text: string, indent: number = 5) {
    this.checkPageBreak(7);
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    const bulletX = this.margin + indent;
    const textX = bulletX + 5;
    const maxWidth = this.pageWidth - (2 * this.margin) - indent - 5;
    
    // Draw bullet point
    this.doc.circle(bulletX, this.currentY - 1, 0.5, 'F');
    
    // Add text
    const lines = this.doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string, index: number) => {
      if (index > 0) this.checkPageBreak(5);
      this.doc.text(line, textX, this.currentY);
      this.currentY += 5;
    });
  }

  private addSeparator() {
    this.checkPageBreak(5);
    this.doc.setDrawColor(...this.secondaryColor);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 5;
  }

  private addCodeBlock(code: string) {
    this.checkPageBreak(10);
    this.doc.setFillColor(245, 245, 245);
    const lines = code.split('\n');
    const blockHeight = (lines.length * 5) + 4;
    
    this.checkPageBreak(blockHeight);
    this.doc.rect(this.margin, this.currentY - 2, this.pageWidth - (2 * this.margin), blockHeight, 'F');
    
    this.doc.setFontSize(9);
    this.doc.setFont('courier', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    lines.forEach(line => {
      this.doc.text(line, this.margin + 2, this.currentY + 2);
      this.currentY += 5;
    });
    this.currentY += 5;
  }

  private addTable(headers: string[], rows: (string | number)[][]) {
    this.checkPageBreak(20);
    
    autoTable(this.doc, {
      head: [headers],
      body: rows,
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      theme: 'grid',
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
  }

  // Cover Page
  private addCoverPage() {
    // Logo/Title area
    this.currentY = 80;
    this.doc.setFontSize(36);
    this.doc.setTextColor(...this.primaryColor);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('STOREA', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 20;
    this.doc.setFontSize(24);
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text('Complete Technical Documentation', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 30;
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Comprehensive Platform Documentation', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 10;
    this.doc.text('Construction Project Management System', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    // Version and date
    this.currentY = this.pageHeight - 50;
    this.doc.setFontSize(12);
    this.doc.text(`Version: ${platformDocumentation.metadata.version}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 8;
    this.doc.text(`Generated: ${new Date().toLocaleDateString()}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.addNewPage();
  }

  // Table of Contents
  private addTableOfContents() {
    this.addTitle('Table of Contents', 24);
    this.currentY += 5;
    
    const sections = [
      { title: '1. Executive Summary', page: 3 },
      { title: '2. System Architecture', page: 5 },
      { title: '3. Technology Stack', page: 8 },
      { title: '4. Database Schema', page: 12 },
      { title: '5. API & Edge Functions', page: 25 },
      { title: '6. Component Library', page: 35 },
      { title: '7. Hooks & State Management', page: 50 },
      { title: '8. Page Documentation', page: 65 },
      { title: '9. Styling Guide', page: 90 },
      { title: '10. Security Implementation', page: 100 },
      { title: '11. Setup & Deployment', page: 105 }
    ];
    
    sections.forEach(section => {
      this.checkPageBreak(8);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(section.title, this.margin + 5, this.currentY);
      
      // Dotted line
      const dots = '.'.repeat(50);
      this.doc.setTextColor(...this.secondaryColor);
      this.doc.text(dots, this.margin + 80, this.currentY);
      
      // Page number
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(section.page.toString(), this.pageWidth - this.margin - 10, this.currentY);
      this.currentY += 8;
    });
    
    this.addNewPage();
  }

  // Section 1: Executive Summary
  private generateExecutiveSummary() {
    this.addTitle('1. Executive Summary');
    this.addSeparator();
    
    this.addSubtitle('Platform Overview');
    this.addText(platformDocumentation.systemOverview.description);
    this.currentY += 5;
    
    this.addSubtitle('Key Features');
    const features = [
      'Multi-role user management with granular permissions',
      'Comprehensive document management with version control',
      'RFI workflow management with email integration',
      'Tender package creation and bid comparison',
      'Financial management with progress billing',
      'Real-time team collaboration and messaging',
      'Calendar and task management',
      'Admin dashboard with system monitoring'
    ];
    features.forEach(feature => this.addBulletPoint(feature));
    this.currentY += 5;
    
    this.addSubtitle('Technology Stack');
    this.addText('STOREA is built on modern web technologies ensuring performance, scalability, and maintainability.');
    platformDocumentation.systemOverview.techStack.forEach((tech: any) => {
      this.addBulletPoint(`${tech.name}: ${tech.description}`);
    });
    
    this.addNewPage();
  }

  // Section 2: System Architecture
  private generateSystemArchitecture() {
    this.addTitle('2. System Architecture');
    this.addSeparator();
    
    this.addSubtitle('Architecture Overview');
    this.addText('STOREA follows a modern three-tier architecture:');
    this.currentY += 3;
    
    this.addSectionTitle('Frontend Layer');
    this.addBulletPoint('React 18 with TypeScript for type safety');
    this.addBulletPoint('Vite for fast development and optimized production builds');
    this.addBulletPoint('TanStack Query for server state management');
    this.addBulletPoint('React Router for client-side routing');
    this.addBulletPoint('Tailwind CSS with design system');
    this.currentY += 3;
    
    this.addSectionTitle('Backend Layer');
    this.addBulletPoint('Supabase PostgreSQL database');
    this.addBulletPoint('Row-Level Security (RLS) for data protection');
    this.addBulletPoint('Supabase Auth for authentication');
    this.addBulletPoint('Supabase Storage for file management');
    this.addBulletPoint('Real-time subscriptions for live updates');
    this.currentY += 3;
    
    this.addSectionTitle('Serverless Functions');
    this.addBulletPoint('Supabase Edge Functions (Deno runtime)');
    this.addBulletPoint('Email sending via Resend API');
    this.addBulletPoint('Weather data via Open-Meteo API');
    this.addBulletPoint('Geocoding via Nominatim');
    this.currentY += 3;
    
    this.addSubtitle('Data Flow');
    this.addText('1. User interacts with React components');
    this.addText('2. Components use custom hooks for data operations');
    this.addText('3. Hooks utilize TanStack Query for API calls');
    this.addText('4. API calls go through Supabase client');
    this.addText('5. PostgreSQL processes queries with RLS enforcement');
    this.addText('6. Real-time updates pushed via WebSocket');
    this.addText('7. Edge Functions handle external API calls and email');
    
    this.addNewPage();
  }

  // Section 3: Technology Stack
  private generateTechnologyStack() {
    this.addTitle('3. Technology Stack');
    this.addSeparator();
    
    this.addSubtitle('Frontend Dependencies');
    const frontendDeps = [
      ['React', '^18.3.1', 'UI library'],
      ['TypeScript', '^5.6.2', 'Type safety'],
      ['Vite', '^5.4.11', 'Build tool'],
      ['Tailwind CSS', '^3.4.1', 'Styling'],
      ['TanStack Query', '^5.83.0', 'Server state'],
      ['React Router', '^6.30.1', 'Routing'],
      ['Supabase JS', '^2.57.0', 'Backend client'],
      ['shadcn/ui', 'latest', 'UI components'],
      ['Lucide React', '^0.462.0', 'Icons'],
      ['jsPDF', '^3.0.2', 'PDF generation'],
      ['xlsx', '^0.18.5', 'Excel handling'],
      ['date-fns', '^4.1.0', 'Date utilities'],
      ['zod', '^3.25.76', 'Schema validation']
    ];
    
    this.addTable(['Package', 'Version', 'Purpose'], frontendDeps);
    this.currentY += 5;
    
    this.addSubtitle('Backend & Services');
    const backendServices = [
      ['Supabase', 'Cloud', 'Database & Auth'],
      ['PostgreSQL', '15.x', 'Database'],
      ['Supabase Storage', 'Cloud', 'File storage'],
      ['Resend', 'API', 'Email service'],
      ['Open-Meteo', 'API', 'Weather data'],
      ['Nominatim', 'API', 'Geocoding']
    ];
    
    this.addTable(['Service', 'Version/Type', 'Purpose'], backendServices);
    
    this.addNewPage();
  }

  // Section 4: Database Schema
  private generateDatabaseSchema() {
    this.addTitle('4. Database Schema');
    this.addSeparator();
    
    this.addSubtitle('Schema Overview');
    this.addText(`Total Tables: ${databaseSchema.overview.totalTables}`);
    this.addText('Categories:');
    databaseSchema.overview.categories.forEach(cat => this.addBulletPoint(cat));
    this.currentY += 5;
    
    // Document key tables in detail
    const keyTables = [
      'profiles',
      'projects',
      'documents',
      'document_groups',
      'rfis',
      'tenders',
      'messages',
      'line_item_budgets'
    ];
    
    keyTables.forEach(tableName => {
      const table = databaseSchema.tables[tableName as keyof typeof databaseSchema.tables];
      if (table) {
        this.addSubtitle(tableName.toUpperCase());
        this.addText(table.description);
        this.currentY += 2;
        
        // Column details (first 10 to save space)
        this.addSectionTitle('Key Columns:');
        table.columns.slice(0, 10).forEach((col: any) => {
          this.addBulletPoint(`${col.name} (${col.type}): ${col.description || 'N/A'}`);
        });
        
        if (table.columns.length > 10) {
          this.addText(`... and ${table.columns.length - 10} more columns`);
        }
        
        // RLS Policies
        if ('rlsPolicies' in table && table.rlsPolicies && (table.rlsPolicies as any[]).length > 0) {
          this.currentY += 2;
          this.addSectionTitle('Row-Level Security Policies:');
          (table.rlsPolicies as any[]).forEach((policy: any) => {
            this.addBulletPoint(`${policy.name} (${policy.command})`);
          });
        }
        
        this.currentY += 5;
        this.checkPageBreak(30);
      }
    });
    
    // Storage Buckets
    this.addNewPage();
    this.addSubtitle('Storage Buckets');
    databaseSchema.storageBuckets.forEach((bucket: any) => {
      this.addSectionTitle(bucket.name);
      this.addText(bucket.description);
      this.addText(`Public: ${bucket.public ? 'Yes' : 'No'}`);
      this.currentY += 3;
    });
    
    this.addNewPage();
  }

  // Section 5: API & Edge Functions
  private generateAPIDocumentation() {
    this.addTitle('5. API & Edge Functions');
    this.addSeparator();
    
    this.addSubtitle('Edge Functions Overview');
    this.addText('STOREA uses Supabase Edge Functions (Deno runtime) for serverless operations:');
    this.currentY += 3;
    
    (platformDocumentation.edgeFunctions.functions || []).forEach((func: any) => {
      this.addSectionTitle(func.name);
      this.addText(`Purpose: ${func.purpose}`);
      this.addText(`Trigger: ${func.trigger}`);
      this.addText(`Provider: ${func.provider}`);
      this.currentY += 2;
      
      if (func.inputs && func.inputs.length > 0) {
        this.addText('Inputs:', 10, 5);
        func.inputs.forEach((input: string) => {
          this.addBulletPoint(input, 10);
        });
      }
      
      if (func.output) {
        this.addText('Output:', 10, 5);
        this.addText(func.output, 10, 10);
      }
      
      this.currentY += 5;
      this.checkPageBreak(40);
    });
    
    this.addNewPage();
  }

  // Section 6: Component Library
  private generateComponentLibrary() {
    this.addTitle('6. Component Library');
    this.addSeparator();
    
    this.addSubtitle('Component Overview');
    this.addText(`Total Components: ${componentLibrary.overview.totalComponents}`);
    this.addText(`UI Components: ${componentLibrary.overview.uiComponents}`);
    this.addText(`Feature Components: ${componentLibrary.overview.featureComponents}`);
    this.currentY += 5;
    
    // Layout Components
    this.addSubtitle('Layout Components');
    Object.entries(componentLibrary.layoutComponents).forEach(([name, comp]: [string, any]) => {
      this.addSectionTitle(name);
      this.addText(`Path: ${comp.path}`);
      this.addText(comp.description);
      
      if (comp.props && comp.props.length > 0) {
        this.addText('Props:', 10, 5);
        comp.props.forEach((prop: any) => {
          this.addBulletPoint(`${prop.name}: ${prop.type}${prop.required ? ' (required)' : ''}`, 10);
        });
      }
      
      if (comp.features && comp.features.length > 0) {
        this.addText('Features:', 10, 5);
        comp.features.forEach((feature: string) => {
          this.addBulletPoint(feature, 10);
        });
      }
      
      this.currentY += 5;
      this.checkPageBreak(30);
    });
    
    this.addNewPage();
    
    // UI Primitives (just list them to save space)
    this.addSubtitle('UI Primitives (shadcn/ui)');
    Object.entries(componentLibrary.uiPrimitives).forEach(([name, comp]: [string, any]) => {
      this.addBulletPoint(`${name}: ${comp.description}`);
    });
    
    this.addNewPage();
  }

  // Section 7: Hooks Documentation
  private generateHooksDocumentation() {
    this.addTitle('7. Hooks & State Management');
    this.addSeparator();
    
    this.addSubtitle('Hooks Overview');
    this.addText(`Total Custom Hooks: ${hooksDocumentation.overview.totalHooks}`);
    this.currentY += 3;
    
    // Document key hooks
    const hookCategories = [
      { key: 'authHooks', title: 'Authentication Hooks' },
      { key: 'dataFetchingHooks', title: 'Data Fetching Hooks' },
      { key: 'realtimeHooks', title: 'Real-time Hooks' },
      { key: 'formHooks', title: 'Form Hooks' },
      { key: 'uiHooks', title: 'UI Hooks' },
      { key: 'adminHooks', title: 'Admin Hooks' }
    ];
    
    hookCategories.forEach(({ key, title }) => {
      this.addSubtitle(title);
      const hooks = hooksDocumentation[key as keyof typeof hooksDocumentation];
      
      Object.entries(hooks as object).forEach(([hookName, hook]: [string, any]) => {
        this.addSectionTitle(hookName);
        this.addText(`Path: ${hook.path || hook.source}`);
        this.addText(hook.description);
        
        if (hook.returns) {
          this.addText('Returns:', 10, 5);
          if (typeof hook.returns === 'object') {
            Object.entries(hook.returns).forEach(([key, value]) => {
              this.addBulletPoint(`${key}: ${value}`, 10);
            });
          } else {
            this.addText(hook.returns, 10, 10);
          }
        }
        
        if (hook.usage) {
          this.addText('Usage:', 10, 5);
          this.addCodeBlock(hook.usage);
        }
        
        this.currentY += 3;
        this.checkPageBreak(30);
      });
      
      this.addNewPage();
    });
  }

  // Section 8: Page Documentation
  private generatePageDocumentation() {
    this.addTitle('8. Page Documentation');
    this.addSeparator();
    
    this.addSubtitle('Page Overview');
    this.addText(`Total Pages: ${pageDocumentation.overview.totalPages}`);
    pageDocumentation.overview.categories.forEach(cat => this.addBulletPoint(cat));
    this.currentY += 5;
    
    // Public Pages
    this.addSubtitle('Public Pages');
    Object.entries(pageDocumentation.publicPages).forEach(([key, page]: [string, any]) => {
      this.addSectionTitle(`${page.route} - ${page.description}`);
      this.addText(`Component: ${page.component}`);
      
      if (page.sections) {
        this.addText('Sections:', 10, 5);
        page.sections.forEach((section: any) => {
          this.addBulletPoint(section.name || JSON.stringify(section), 10);
        });
      }
      
      this.currentY += 3;
      this.checkPageBreak(25);
    });
    
    this.addNewPage();
    
    // Main App Pages
    this.addSubtitle('Main Application Pages');
    Object.entries(pageDocumentation.mainAppPages).forEach(([key, page]: [string, any]) => {
      this.addSectionTitle(`${page.route} - ${page.description}`);
      this.addText(`Component: ${page.component}`);
      
      if (page.sections) {
        this.addText('Sections:', 10, 5);
        page.sections.forEach((section: any) => {
          this.addBulletPoint(`${section.name}: ${section.features ? section.features.join(', ') : ''}`, 10);
        });
      }
      
      if (page.roleVariations) {
        this.addText('Role Variations:', 10, 5);
        Object.entries(page.roleVariations).forEach(([role, desc]) => {
          this.addBulletPoint(`${role}: ${desc}`, 10);
        });
      }
      
      this.currentY += 5;
      this.checkPageBreak(40);
    });
    
    this.addNewPage();
  }

  // Section 9: Styling Guide
  private generateStylingGuide() {
    this.addTitle('9. Styling Guide');
    this.addSeparator();
    
    this.addSubtitle('Design System Overview');
    this.addText(`Framework: ${stylingGuide.overview.framework}`);
    this.addText(`Approach: ${stylingGuide.overview.approach}`);
    this.addText(`Dark Mode: ${stylingGuide.overview.darkMode}`);
    this.currentY += 5;
    
    this.addSubtitle('CSS Variables (Light Theme)');
    Object.entries(stylingGuide.cssVariables.light).slice(0, 15).forEach(([key, value]) => {
      this.addBulletPoint(`${key}: ${value}`);
    });
    this.currentY += 5;
    
    this.addSubtitle('Typography Scale');
    Object.entries(stylingGuide.typography.headings).forEach(([key, value]) => {
      this.addBulletPoint(`${key}: ${value}`);
    });
    this.currentY += 5;
    
    this.addSubtitle('Component Patterns');
    this.addSectionTitle('Button Pattern');
    this.addText('Base classes:', 10, 5);
    this.addCodeBlock(stylingGuide.componentPatterns.button.base);
    
    this.addText('Variants:', 10, 5);
    Object.entries(stylingGuide.componentPatterns.button.variants).forEach(([name, classes]) => {
      this.addBulletPoint(`${name}: ${classes}`, 10);
    });
    
    this.addNewPage();
  }

  // Section 10: Security
  private generateSecurityDocumentation() {
    this.addTitle('10. Security Implementation');
    this.addSeparator();
    
    this.addSubtitle('Authentication');
    platformDocumentation.security.authentication.forEach((item: any) => {
      this.addBulletPoint(item);
    });
    this.currentY += 5;
    
    this.addSubtitle('Authorization');
    platformDocumentation.security.authorization.forEach((item: any) => {
      this.addBulletPoint(item);
    });
    this.currentY += 5;
    
    this.addSubtitle('Data Protection');
    platformDocumentation.security.dataProtection.forEach((item: any) => {
      this.addBulletPoint(item);
    });
    this.currentY += 5;
    
    this.addSubtitle('Monitoring');
    platformDocumentation.security.monitoring.forEach((item: any) => {
      this.addBulletPoint(item);
    });
    
    this.addNewPage();
  }

  // Section 11: Setup & Deployment
  private generateSetupDocumentation() {
    this.addTitle('11. Setup & Deployment');
    this.addSeparator();
    
    this.addSubtitle('Required Secrets');
    platformDocumentation.setup.secrets.forEach((secret: any) => {
      this.addSectionTitle(secret.name);
      this.addText(secret.purpose || secret.description || 'No description');
      this.currentY += 3;
    });
    
    this.addSubtitle('Supabase Configuration');
    platformDocumentation.setup.supabaseConfig.forEach((step: any) => {
      this.addBulletPoint(step);
    });
    this.currentY += 5;
    
    this.addSubtitle('STOREA Bot Setup');
    if (Array.isArray(platformDocumentation.setup.storeaBot)) {
      platformDocumentation.setup.storeaBot.forEach((step: any) => {
        this.addBulletPoint(step);
      });
    }
    
    this.addNewPage();
  }

  // Visual Diagrams
  private drawSystemArchitectureDiagram() {
    this.addTitle('System Architecture Diagram');
    this.currentY += 10;

    const boxWidth = 50;
    const boxHeight = 20;
    const startX = this.pageWidth / 2 - boxWidth / 2;
    let currentDiagramY = this.currentY;

    // Frontend Layer
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(startX, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.text('Frontend', startX + boxWidth / 2, currentDiagramY + 8, { align: 'center' });
    this.doc.text('React + Vite + TypeScript', startX + boxWidth / 2, currentDiagramY + 13, { align: 'center' });
    
    // Arrow down
    this.doc.setDrawColor(100, 100, 100);
    this.doc.line(startX + boxWidth / 2, currentDiagramY + boxHeight, startX + boxWidth / 2, currentDiagramY + boxHeight + 10);
    this.drawTriangle(startX + boxWidth / 2, currentDiagramY + boxHeight + 10, startX + boxWidth / 2 - 2, currentDiagramY + boxHeight + 7, startX + boxWidth / 2 + 2, currentDiagramY + boxHeight + 7, 'F');
    
    currentDiagramY += boxHeight + 10;

    // Supabase Client Layer
    this.doc.setFillColor(34, 197, 94);
    this.doc.rect(startX, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('Supabase Client', startX + boxWidth / 2, currentDiagramY + 8, { align: 'center' });
    this.doc.text('@supabase/supabase-js', startX + boxWidth / 2, currentDiagramY + 13, { align: 'center' });

    // Arrow down
    this.doc.line(startX + boxWidth / 2, currentDiagramY + boxHeight, startX + boxWidth / 2, currentDiagramY + boxHeight + 10);
    this.drawTriangle(startX + boxWidth / 2, currentDiagramY + boxHeight + 10, startX + boxWidth / 2 - 2, currentDiagramY + boxHeight + 7, startX + boxWidth / 2 + 2, currentDiagramY + boxHeight + 7, 'F');
    
    currentDiagramY += boxHeight + 10;

    // Database Layer
    this.doc.setFillColor(168, 85, 247);
    this.doc.rect(startX, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('PostgreSQL Database', startX + boxWidth / 2, currentDiagramY + 8, { align: 'center' });
    this.doc.text('75+ Tables, RLS Policies', startX + boxWidth / 2, currentDiagramY + 13, { align: 'center' });

    // Side boxes for Edge Functions and Storage
    const sideX = startX - boxWidth - 10;
    this.doc.setFillColor(234, 179, 8);
    this.doc.rect(sideX, currentDiagramY - 30, boxWidth, boxHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('Edge Functions', sideX + boxWidth / 2, currentDiagramY - 22, { align: 'center' });
    this.doc.text('10 Functions', sideX + boxWidth / 2, currentDiagramY - 17, { align: 'center' });

    // Arrow from Edge Functions to Database
    this.doc.setDrawColor(100, 100, 100);
    this.doc.line(sideX + boxWidth, currentDiagramY - 20, startX, currentDiagramY + 5);

    const storageX = startX + boxWidth + 10;
    this.doc.setFillColor(239, 68, 68);
    this.doc.rect(storageX, currentDiagramY - 30, boxWidth, boxHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('Storage Buckets', storageX + boxWidth / 2, currentDiagramY - 22, { align: 'center' });
    this.doc.text('5 Buckets', storageX + boxWidth / 2, currentDiagramY - 17, { align: 'center' });

    // Arrow from Storage to Database
    this.doc.line(storageX, currentDiagramY - 20, startX + boxWidth, currentDiagramY + 5);

    // External APIs at bottom
    currentDiagramY += boxHeight + 15;
    const apiBoxWidth = 35;
    const apiStartX = this.pageWidth / 2 - apiBoxWidth;

    this.doc.setFillColor(20, 184, 166);
    this.doc.rect(apiStartX, currentDiagramY, apiBoxWidth, 15, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.text('Resend API', apiStartX + apiBoxWidth / 2, currentDiagramY + 9, { align: 'center' });

    this.doc.rect(apiStartX + apiBoxWidth + 5, currentDiagramY, apiBoxWidth, 15, 'F');
    this.doc.text('Open-Meteo API', apiStartX + apiBoxWidth + 5 + apiBoxWidth / 2, currentDiagramY + 9, { align: 'center' });

    this.currentY = currentDiagramY + 30;
    this.addNewPage();
  }

  private drawERDiagram() {
    this.addTitle('Entity Relationship Diagram - Core Tables');
    this.currentY += 10;

    const boxWidth = 40;
    const boxHeight = 15;
    let currentDiagramY = this.currentY;

    // Core cluster
    this.doc.setFillColor(59, 130, 246);
    this.doc.setTextColor(255, 255, 255);
    
    // profiles
    this.doc.rect(30, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.setFontSize(9);
    this.doc.text('profiles', 30 + boxWidth / 2, currentDiagramY + 9, { align: 'center' });

    // companies
    this.doc.rect(80, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.text('companies', 80 + boxWidth / 2, currentDiagramY + 9, { align: 'center' });

    // FK line from profiles to companies
    this.doc.setDrawColor(100, 100, 100);
    this.doc.line(70, currentDiagramY + 7.5, 80, currentDiagramY + 7.5);
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFontSize(7);
    this.doc.text('N:1', 75, currentDiagramY + 6);

    // projects
    currentDiagramY += 25;
    this.doc.setFillColor(34, 197, 94);
    this.doc.setTextColor(255, 255, 255);
    this.doc.rect(30, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.setFontSize(9);
    this.doc.text('projects', 30 + boxWidth / 2, currentDiagramY + 9, { align: 'center' });

    // project_users
    this.doc.rect(80, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.text('project_users', 80 + boxWidth / 2, currentDiagramY + 9, { align: 'center' });

    // FK line from project_users to projects
    this.doc.line(70, currentDiagramY + 7.5, 80, currentDiagramY + 7.5);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('N:1', 75, currentDiagramY + 6);

    // documents cluster
    currentDiagramY += 25;
    this.doc.setFillColor(168, 85, 247);
    this.doc.setTextColor(255, 255, 255);
    this.doc.rect(30, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.text('document_groups', 30 + boxWidth / 2, currentDiagramY + 9, { align: 'center' });

    this.doc.rect(80, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.text('document_revisions', 80 + boxWidth / 2, currentDiagramY + 9, { align: 'center' });

    // FK line
    this.doc.line(70, currentDiagramY + 7.5, 80, currentDiagramY + 7.5);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('1:N', 75, currentDiagramY + 6);

    // RFI/Tender cluster
    currentDiagramY += 25;
    this.doc.setFillColor(234, 179, 8);
    this.doc.setTextColor(255, 255, 255);
    this.doc.rect(30, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.text('rfis', 30 + boxWidth / 2, currentDiagramY + 9, { align: 'center' });

    this.doc.rect(80, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.text('tenders', 80 + boxWidth / 2, currentDiagramY + 9, { align: 'center' });

    this.doc.rect(130, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.text('tender_bids', 130 + boxWidth / 2, currentDiagramY + 9, { align: 'center' });

    // FK line from tender_bids to tenders
    this.doc.line(120, currentDiagramY + 7.5, 130, currentDiagramY + 7.5);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('N:1', 125, currentDiagramY + 6);

    this.doc.setTextColor(0, 0, 0);
    this.currentY = currentDiagramY + 25;
    this.addText('Note: This shows core relationships. Full ER diagram includes 75+ tables with complex relationships.');
    this.addNewPage();
  }

  private drawEdgeFunctionsFlowDiagram() {
    this.addTitle('Edge Functions Data Flow');
    this.currentY += 10;

    let currentDiagramY = this.currentY;
    const functions = supabaseInfrastructure.edgeFunctions;
    
    functions.forEach((func, index) => {
      if (index > 0 && index % 3 === 0) {
        currentDiagramY += 30;
        this.checkPageBreak(35);
      }

      const x = this.margin + (index % 3) * 60;
      const y = currentDiagramY;

      // Function box
      this.doc.setFillColor(59, 130, 246);
      this.doc.rect(x, y, 55, 25, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(8);
      this.doc.text(func.name, x + 27.5, y + 8, { align: 'center', maxWidth: 50 });
      this.doc.setFontSize(7);
      this.doc.text(func.authentication, x + 27.5, y + 14, { align: 'center' });
      
      if (func.integrations && func.integrations.length > 0) {
        this.doc.text(func.integrations[0].substring(0, 20), x + 27.5, y + 20, { align: 'center' });
      }
    });

    this.currentY = currentDiagramY + 40;
    this.addNewPage();
  }

  private drawStorageBucketsStructure() {
    this.addTitle('Storage Buckets Architecture');
    this.currentY += 10;

    const buckets = supabaseInfrastructure.storageBuckets;
    let currentDiagramY = this.currentY;

    buckets.forEach((bucket, index) => {
      const y = currentDiagramY + (index * 35);
      this.checkPageBreak(40);

      // Bucket box
      const color: [number, number, number] = bucket.public ? [34, 197, 94] : [239, 68, 68];
      this.doc.setFillColor(color[0], color[1], color[2]);
      this.doc.rect(this.margin, y, 80, 30, 'F');
      
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(10);
      this.doc.text(bucket.name, this.margin + 5, y + 8);
      this.doc.setFontSize(8);
      this.doc.text(bucket.public ? '🌐 Public' : '🔒 Private', this.margin + 5, y + 15);
      this.doc.text(`Policies: ${bucket.policyCount}`, this.margin + 5, y + 22);
      this.doc.text(`Limit: ${bucket.fileSizeLimit}`, this.margin + 5, y + 27);

      // Description on the right
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(bucket.description, this.margin + 85, y + 10, { maxWidth: 100 });
    });

    this.currentY = currentDiagramY + (buckets.length * 35) + 10;
    this.addNewPage();
  }

  private drawUserRolesHierarchy() {
    this.addTitle('User Roles & Permissions Hierarchy');
    this.currentY += 10;

    let currentDiagramY = this.currentY;

    // Admin role at top
    this.doc.setFillColor(239, 68, 68);
    this.doc.rect(this.pageWidth / 2 - 30, currentDiagramY, 60, 15, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.text('System Admin', this.pageWidth / 2, currentDiagramY + 9, { align: 'center' });

    currentDiagramY += 25;

    // Main user roles
    const roles: Array<{ name: string; color: [number, number, number] }> = [
      { name: 'Architect', color: [59, 130, 246] },
      { name: 'Builder', color: [34, 197, 94] },
      { name: 'Contractor', color: [234, 179, 8] },
      { name: 'Homeowner', color: [168, 85, 247] }
    ];

    roles.forEach((role, index) => {
      const x = this.margin + (index * 45);
      this.doc.setFillColor(role.color[0], role.color[1], role.color[2]);
      this.doc.rect(x, currentDiagramY, 40, 15, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(role.name, x + 20, currentDiagramY + 9, { align: 'center' });
    });

    currentDiagramY += 25;

    // Permission descriptions
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(9);
    this.addText('Role Permissions:', 0, 5);
    this.addBulletPoint('Architect: Full project control, document management, RFI coordination');
    this.addBulletPoint('Builder: Project execution, tender management, financial oversight');
    this.addBulletPoint('Contractor: Bid submission, RFI responses, document access');
    this.addBulletPoint('Homeowner: Project monitoring, milestone approval, communication');
    this.addBulletPoint('System Admin: User approval, system monitoring, security oversight');

    this.addNewPage();
  }

  private drawComponentHierarchy() {
    this.addTitle('React Component Hierarchy');
    this.currentY += 10;

    let currentDiagramY = this.currentY;

    // App root
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(this.pageWidth / 2 - 20, currentDiagramY, 40, 12, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.text('App.tsx', this.pageWidth / 2, currentDiagramY + 8, { align: 'center' });

    currentDiagramY += 18;

    // Layout layer
    const layouts = ['AppLayout', 'PublicLayout', 'AdminLayout'];
    layouts.forEach((layout, index) => {
      const x = this.margin + (index * 60);
      this.doc.setFillColor(34, 197, 94);
      this.doc.rect(x, currentDiagramY, 50, 12, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(layout, x + 25, currentDiagramY + 8, { align: 'center' });
    });

    currentDiagramY += 18;

    // Pages layer
    this.doc.setFillColor(168, 85, 247);
    this.doc.setFontSize(8);
    const pages = ['Dashboard', 'Projects', 'Documents', 'RFIs', 'Tenders', 'Messages', 'Financials'];
    pages.forEach((page, index) => {
      const x = this.margin + (index % 4) * 45;
      const y = currentDiagramY + Math.floor(index / 4) * 14;
      this.doc.rect(x, y, 40, 10, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(page, x + 20, y + 7, { align: 'center' });
    });

    currentDiagramY += 35;

    // Feature components
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(9);
    this.addText('Feature Components Layer: 200+ components', 0, 5);
    this.addBulletPoint('Document Management: DocumentCard, DocumentUpload, DocumentFilters, etc.');
    this.addBulletPoint('RFI System: RFICard, CreateRFIDialog, RFIDetailsDialog, etc.');
    this.addBulletPoint('Tender Management: TenderCard, BidSubmissionForm, TenderComparison, etc.');
    
    this.currentY += 5;
    this.addText('UI Primitives: 40+ Shadcn components (Button, Dialog, Card, etc.)');

    this.addNewPage();
  }

  private drawDataFlowDiagram() {
    this.addTitle('Data Flow Architecture');
    this.currentY += 10;

    let currentDiagramY = this.currentY;
    const boxWidth = 50;
    const boxHeight = 18;

    // User Action
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(this.margin, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.text('User Action', this.margin + boxWidth / 2, currentDiagramY + 10, { align: 'center' });

    // Arrow
    this.doc.setDrawColor(100, 100, 100);
    this.doc.line(this.margin + boxWidth, currentDiagramY + 9, this.margin + boxWidth + 10, currentDiagramY + 9);
    this.drawTriangle(this.margin + boxWidth + 10, currentDiagramY + 9, this.margin + boxWidth + 7, currentDiagramY + 7, this.margin + boxWidth + 7, currentDiagramY + 11, 'F');

    // React Hook
    this.doc.setFillColor(34, 197, 94);
    this.doc.rect(this.margin + boxWidth + 10, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('React Hook', this.margin + boxWidth * 1.5 + 10, currentDiagramY + 7, { align: 'center' });
    this.doc.setFontSize(7);
    this.doc.text('(useProjects, useRFIs)', this.margin + boxWidth * 1.5 + 10, currentDiagramY + 13, { align: 'center' });

    // Arrow
    this.doc.setFontSize(9);
    this.doc.line(this.margin + boxWidth * 2 + 10, currentDiagramY + 9, this.margin + boxWidth * 2 + 20, currentDiagramY + 9);
    this.drawTriangle(this.margin + boxWidth * 2 + 20, currentDiagramY + 9, this.margin + boxWidth * 2 + 17, currentDiagramY + 7, this.margin + boxWidth * 2 + 17, currentDiagramY + 11, 'F');

    // Supabase Client
    this.doc.setFillColor(168, 85, 247);
    this.doc.rect(this.margin + boxWidth * 2 + 20, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('Supabase Client', this.margin + boxWidth * 2.5 + 20, currentDiagramY + 10, { align: 'center' });

    currentDiagramY += boxHeight + 10;

    // RLS Policy Check
    this.doc.setFillColor(234, 179, 8);
    this.doc.rect(this.margin + boxWidth * 2 + 20, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('RLS Policy Check', this.margin + boxWidth * 2.5 + 20, currentDiagramY + 10, { align: 'center' });

    // Arrow down
    this.doc.line(this.margin + boxWidth * 2.5 + 20, currentDiagramY - 10 + boxHeight, this.margin + boxWidth * 2.5 + 20, currentDiagramY);

    currentDiagramY += boxHeight + 10;

    // Database
    this.doc.setFillColor(239, 68, 68);
    this.doc.rect(this.margin + boxWidth * 2 + 20, currentDiagramY, boxWidth, boxHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('PostgreSQL', this.margin + boxWidth * 2.5 + 20, currentDiagramY + 7, { align: 'center' });
    this.doc.text('Database', this.margin + boxWidth * 2.5 + 20, currentDiagramY + 13, { align: 'center' });

    // Return path (Real-time)
    this.doc.setDrawColor(34, 197, 94);
    this.doc.setLineWidth(2);
    const returnX = this.margin + boxWidth * 3 + 25;
    this.doc.line(returnX, currentDiagramY + 9, returnX, this.currentY + 9);
    this.doc.line(returnX, this.currentY + 9, this.margin, this.currentY + 9);
    this.doc.setLineWidth(1);

    this.doc.setTextColor(34, 197, 94);
    this.doc.setFontSize(8);
    this.doc.text('Real-time Updates', returnX - 15, this.currentY + 6);

    this.currentY = currentDiagramY + 30;
    this.doc.setTextColor(0, 0, 0);
    this.addText('Real-time subscriptions automatically update UI when database changes occur');
    this.addNewPage();
  }

  // Complete Supabase Infrastructure Documentation
  private generateSupabaseInfrastructure() {
    this.addTitle('Supabase Infrastructure');
    this.addText('Complete documentation of Supabase backend infrastructure including edge functions, storage, enums, and advanced features.');
    this.currentY += 10;

    // Edge Functions
    this.addSubtitle('Edge Functions (10 Functions)');
    supabaseInfrastructure.edgeFunctions.forEach((func: any) => {
      this.checkPageBreak(50);
      this.addSectionTitle(func.name);
      this.addText(`URL: ${func.url}`, 10, 3);
      this.addText(`Description: ${func.description}`, 10, 3);
      this.addText(`Trigger: ${func.trigger}`, 10, 3);
      this.addText(`Authentication: ${func.authentication}`, 10, 3);
      
      if (func.inputs && func.inputs.length > 0) {
        this.addText('Inputs:', 10, 3);
        func.inputs.forEach((input: string) => {
          this.addBulletPoint(input, 15);
        });
      }
      
      this.addText(`Output: ${func.output}`, 10, 3);
      
      if (func.integrations && func.integrations.length > 0) {
        this.addText('Integrations:', 10, 3);
        func.integrations.forEach((integration: string) => {
          this.addBulletPoint(integration, 15);
        });
      }
      
      this.currentY += 5;
    });

    this.addNewPage();

    // Storage Buckets
    this.addSubtitle('Storage Buckets (5 Buckets)');
    supabaseInfrastructure.storageBuckets.forEach((bucket: any) => {
      this.checkPageBreak(40);
      this.addSectionTitle(bucket.name);
      this.addText(`Public: ${bucket.public ? 'Yes' : 'No'}`, 10, 3);
      this.addText(`Description: ${bucket.description}`, 10, 3);
      this.addText(`File Size Limit: ${bucket.fileSizeLimit}`, 10, 3);
      this.addText(`Allowed MIME Types: ${bucket.allowedMimeTypes}`, 10, 3);
      this.addText(`Total Policies: ${bucket.policyCount}`, 10, 3);
      
      this.addText('Storage Policies:', 10, 3);
      bucket.policies.forEach((policy: string) => {
        this.addBulletPoint(policy, 15);
      });
      
      this.currentY += 5;
    });

    this.addNewPage();

    // Enumerated Types
    this.addSubtitle('Enumerated Types (8 Enums)');
    supabaseInfrastructure.enumeratedTypes.forEach((enumType: any) => {
      this.checkPageBreak(35);
      this.addSectionTitle(enumType.name);
      this.addText(`Description: ${enumType.description}`, 10, 3);
      this.addText(`Values: ${enumType.values.join(', ')}`, 10, 3);
      this.addText(`Usage: ${enumType.usage}`, 10, 3);
      this.currentY += 5;
    });

    this.addNewPage();

    // Database Functions
    this.addSubtitle('Key Database Functions (50+ Functions)');
    supabaseInfrastructure.keyDatabaseFunctions.forEach((func: any) => {
      this.checkPageBreak(30);
      this.addSectionTitle(func.name);
      this.addText(`Description: ${func.description}`, 10, 3);
      
      if (func.parameters) {
        this.addText(`Parameters: ${func.parameters.join(', ')}`, 10, 3);
      }
      
      if (func.returns) {
        this.addText(`Returns: ${func.returns}`, 10, 3);
      }
      
      if (func.trigger) {
        this.addText(`Trigger: ${func.trigger}`, 10, 3);
      }
      
      if (func.actions) {
        this.addText('Actions:', 10, 3);
        func.actions.forEach((action: string) => {
          this.addBulletPoint(action, 15);
        });
      }
      
      this.addText(`Usage: ${func.usage}`, 10, 3);
      this.currentY += 5;
    });

    this.addNewPage();

    // RLS Policy Summary
    this.addSubtitle('Row Level Security (RLS) Policies');
    this.addText(`Total Policies: ${supabaseInfrastructure.rlsPolicySummary.totalPolicies}`, 10, 3);
    this.currentY += 5;

    this.addText('Policies by Category:', 10, 3);
    supabaseInfrastructure.rlsPolicySummary.breakdown.forEach((item: any) => {
      this.addBulletPoint(`${item.category}: ${item.count} policies`, 10);
    });

    this.currentY += 5;
    this.addText('Key RLS Patterns:', 10, 3);
    supabaseInfrastructure.rlsPolicySummary.keyPatterns.forEach((pattern: string) => {
      this.addBulletPoint(pattern, 10);
    });

    this.addNewPage();
  }

  // Generate full PDF
  public generate(): jsPDF {
    this.addCoverPage();
    this.addTableOfContents();
    
    // Visual Diagrams Section
    this.drawSystemArchitectureDiagram();
    this.drawERDiagram();
    this.drawEdgeFunctionsFlowDiagram();
    this.drawStorageBucketsStructure();
    this.drawUserRolesHierarchy();
    this.drawComponentHierarchy();
    this.drawDataFlowDiagram();
    
    // Documentation Sections
    this.generateExecutiveSummary();
    this.generateSystemArchitecture();
    this.generateTechnologyStack();
    this.generateDatabaseSchema();
    this.generateSupabaseInfrastructure(); // New complete Supabase section
    this.generateAPIDocumentation();
    this.generateComponentLibrary();
    this.generateHooksDocumentation();
    this.generatePageDocumentation();
    this.generateStylingGuide();
    this.generateSecurityDocumentation();
    this.generateSetupDocumentation();
    
    return this.doc;
  }

  public download(filename: string = 'STOREA_Complete_Documentation.pdf') {
    this.generate();
    this.doc.save(filename);
  }

  public getBlob(): Blob {
    this.generate();
    return this.doc.output('blob');
  }
}
