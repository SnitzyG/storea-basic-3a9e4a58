import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { platformDocumentation } from '@/data/platformDocumentation';
import { databaseSchema } from '@/data/databaseSchemaDoc';
import { componentLibrary } from '@/data/componentLibraryDoc';
import { hooksDocumentation } from '@/data/hooksDocumentation';
import { pageDocumentation } from '@/data/pageByPageDoc';
import { stylingGuide } from '@/data/stylingGuide';

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
      
      this.addText('Input:', 10, 5);
      this.addCodeBlock(JSON.stringify(func.input, null, 2));
      
      this.addText('Output:', 10, 5);
      this.addCodeBlock(JSON.stringify(func.output, null, 2));
      
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
      this.addText(secret.description);
      this.addText(`Purpose: ${secret.purpose}`);
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

  // Generate full PDF
  public generate(): jsPDF {
    this.addCoverPage();
    this.addTableOfContents();
    this.generateExecutiveSummary();
    this.generateSystemArchitecture();
    this.generateTechnologyStack();
    this.generateDatabaseSchema();
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
