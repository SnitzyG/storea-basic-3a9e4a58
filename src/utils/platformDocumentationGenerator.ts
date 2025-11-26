import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { platformDocumentation } from '@/data/platformDocumentation';

export class PlatformDocumentationGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;
  private primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  private accentColor: [number, number, number] = [147, 51, 234]; // Purple
  private textColor: [number, number, number] = [30, 41, 59]; // Dark gray

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private addNewPage() {
    this.doc.addPage();
    this.currentY = this.margin;
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
    this.currentY += size / 2 + 5;
  }

  private addSubtitle(text: string, size: number = 14) {
    this.checkPageBreak(10);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...this.accentColor);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += size / 2 + 3;
  }

  private addText(text: string, size: number = 10, indent: number = 0) {
    this.doc.setFontSize(size);
    this.doc.setTextColor(...this.textColor);
    this.doc.setFont('helvetica', 'normal');
    
    const maxWidth = this.pageWidth - (2 * this.margin) - indent;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(7);
      this.doc.text(line, this.margin + indent, this.currentY);
      this.currentY += 6;
    });
  }

  private addBulletPoint(text: string, indent: number = 5) {
    this.checkPageBreak(7);
    this.doc.setFontSize(10);
    this.doc.setTextColor(...this.textColor);
    this.doc.setFont('helvetica', 'normal');
    
    const maxWidth = this.pageWidth - (2 * this.margin) - indent - 5;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    // Draw bullet
    this.doc.circle(this.margin + indent, this.currentY - 1, 0.5, 'F');
    
    lines.forEach((line: string, index: number) => {
      this.doc.text(line, this.margin + indent + 5, this.currentY);
      this.currentY += 6;
      if (index < lines.length - 1) {
        this.checkPageBreak(6);
      }
    });
  }

  private addSeparator() {
    this.checkPageBreak(5);
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8;
  }

  private addTable(headers: string[], rows: (string | number)[][]) {
    this.checkPageBreak(20);
    
    autoTable(this.doc, {
      head: [headers],
      body: rows,
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addCoverPage() {
    // Background accent
    this.doc.setFillColor(...this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 80, 'F');
    
    // Logo area (placeholder)
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('STOREA', this.pageWidth / 2, 40, { align: 'center' });
    
    // Main title
    this.doc.setFontSize(28);
    this.doc.setTextColor(...this.textColor);
    this.doc.text(platformDocumentation.metadata.title, this.pageWidth / 2, 100, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(16);
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(platformDocumentation.metadata.subtitle, this.pageWidth / 2, 115, { align: 'center' });
    
    // Version and date
    const date = new Date(platformDocumentation.metadata.lastUpdated);
    this.doc.setFontSize(12);
    this.doc.text(`Version ${platformDocumentation.metadata.version}`, this.pageWidth / 2, 140, { align: 'center' });
    this.doc.text(`Generated: ${date.toLocaleDateString()}`, this.pageWidth / 2, 148, { align: 'center' });
    
    // Footer
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 116, 139);
    this.doc.text('Construction Project Management Platform', this.pageWidth / 2, this.pageHeight - 30, { align: 'center' });
    this.doc.text('www.storea.com.au', this.pageWidth / 2, this.pageHeight - 22, { align: 'center' });
  }

  private addTableOfContents() {
    this.addNewPage();
    this.addTitle('Table of Contents', 24);
    this.currentY += 5;
    
    const sections = [
      { title: '1. System Overview', page: 3 },
      { title: '2. External APIs & Integrations', page: 4 },
      { title: '3. Database Schema', page: 6 },
      { title: '4. User Roles & Permissions', page: 8 },
      { title: '5. User Experience by Page', page: 10 },
      { title: '6. Security Implementation', page: 18 },
      { title: '7. Required Setup & Configuration', page: 19 },
    ];

    this.doc.setFontSize(12);
    sections.forEach(section => {
      this.doc.setTextColor(...this.textColor);
      this.doc.text(section.title, this.margin + 5, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${section.page}`, this.pageWidth - this.margin - 10, this.currentY);
      this.currentY += 8;
    });
  }

  private generateSystemOverview() {
    this.addNewPage();
    this.addTitle('1. System Overview');
    this.addText(platformDocumentation.systemOverview.description);
    this.currentY += 5;
    
    this.addSubtitle('Technology Stack');
    const stackRows = platformDocumentation.systemOverview.techStack.map(item => [
      item.name,
      item.technology,
      item.description,
    ]);
    this.addTable(['Component', 'Technology', 'Description'], stackRows);
  }

  private generateIntegrations() {
    this.addNewPage();
    this.addTitle('2. External APIs & Integrations');
    
    platformDocumentation.integrations.services.forEach(service => {
      this.addSubtitle(service.name);
      this.addText(`Purpose: ${service.purpose}`, 10, 0);
      this.currentY += 2;
      
      if (service.features) {
        this.addText('Features:', 10, 0);
        service.features.forEach(feature => {
          this.addBulletPoint(feature, 5);
        });
      }
      
      if ('setup' in service && service.setup) {
        this.addText(`Setup: ${service.setup}`, 9, 0);
      }
      
      if (service.cost) {
        this.addText(`Cost: ${service.cost}`, 9, 0);
      }
      
      this.currentY += 5;
    });

    this.addSeparator();
    this.addSubtitle('Supabase Edge Functions');
    
    const functionsTable = platformDocumentation.edgeFunctions.functions.map(fn => [
      fn.name,
      fn.purpose,
      fn.trigger,
    ]);
    this.addTable(['Function Name', 'Purpose', 'Trigger'], functionsTable);
  }

  private generateDatabaseSchema() {
    this.addNewPage();
    this.addTitle('3. Database Schema');
    this.addText(platformDocumentation.database.description);
    this.currentY += 5;
    
    platformDocumentation.database.categories.forEach(category => {
      this.addSubtitle(category.name);
      this.addText(category.description);
      this.addText(`Tables: ${category.tables.join(', ')}`, 9, 0);
      this.currentY += 5;
    });
  }

  private generateUserRoles() {
    this.addNewPage();
    this.addTitle('4. User Roles & Permissions');
    
    platformDocumentation.userRoles.roles.forEach(role => {
      this.addSubtitle(role.title);
      this.addText(role.description);
      this.addText('Capabilities:', 10, 0);
      role.capabilities.forEach(capability => {
        this.addBulletPoint(capability, 5);
      });
      this.currentY += 5;
    });

    this.addNewPage();
    this.addSubtitle('Permission Matrix');
    const matrixHeaders = ['Feature', 'Architect', 'Builder', 'Contractor', 'Homeowner'];
    const matrixRows = platformDocumentation.userRoles.permissionMatrix.map(perm => [
      perm.feature,
      perm.architect ? '✓' : '✗',
      perm.builder ? '✓' : '✗',
      perm.contractor ? '✓' : '✗',
      perm.homeowner ? '✓' : '✗',
    ]);
    this.addTable(matrixHeaders, matrixRows);
  }

  private generateUserExperience() {
    this.addNewPage();
    this.addTitle('5. User Experience by Page');
    
    this.addSubtitle('Public Pages');
    platformDocumentation.userExperience.publicPages.forEach(page => {
      this.addText(`${page.path} - ${page.name}`, 11, 0);
      this.addText(page.description, 10, 5);
      if (page.sections) {
        page.sections.forEach(section => {
          this.addBulletPoint(section, 10);
        });
      }
      this.currentY += 3;
    });

    this.addNewPage();
    this.addSubtitle('Authentication Flow');
    platformDocumentation.userExperience.authFlow.steps.forEach((step, index) => {
      this.addText(`Step ${index + 1}: ${step.step}`, 11, 0);
      this.addText(step.description, 10, 5);
      if ('fields' in step && step.fields) {
        step.fields.forEach(field => {
          this.addBulletPoint(field, 10);
        });
      }
      if (step.nextStep) {
        this.addText(`Next: ${step.nextStep}`, 9, 5);
      }
      this.currentY += 3;
    });

    // Authenticated pages (selected key pages)
    const keyPages = platformDocumentation.userExperience.authenticatedPages.filter(
      p => ['Dashboard', 'Projects', 'Documents', 'Tenders & Procurement', 'RFIs / Mail', 'Financials'].includes(p.name)
    );

    keyPages.forEach(page => {
      this.addNewPage();
      this.addSubtitle(page.name);
      this.addText(page.description);
      this.currentY += 3;

      if ('widgets' in page && page.widgets) {
        this.addText('Key Widgets:', 10, 0);
        page.widgets.forEach(widget => {
          this.addBulletPoint(`${widget.name} - ${widget.description}`, 5);
        });
      }

      if ('features' in page) {
        if (typeof page.features === 'object' && 'architect' in page.features) {
          // Role-specific features
          Object.entries(page.features).forEach(([role, features]) => {
            if (Array.isArray(features)) {
              this.addText(`${role.charAt(0).toUpperCase() + role.slice(1)}:`, 10, 0);
              features.forEach(feature => {
                this.addBulletPoint(feature, 5);
              });
            }
          });
        } else if (typeof page.features === 'object') {
          // General features object
          Object.entries(page.features).forEach(([key, value]) => {
            if (typeof value === 'string') {
              this.addText(`${key}: ${value}`, 10, 0);
            } else if (Array.isArray(value)) {
              this.addText(`${key}:`, 10, 0);
              value.forEach(item => this.addBulletPoint(item, 5));
            }
          });
        }
      }

      if ('tabs' in page && Array.isArray(page.tabs)) {
        this.addText('Tabs:', 10, 0);
        page.tabs.forEach(tab => {
          this.addText(`• ${tab.name}`, 10, 5);
          if (tab.features) {
            tab.features.forEach(feature => {
              this.addBulletPoint(feature, 10);
            });
          }
        });
      }
    });
  }

  private generateSecurity() {
    this.addNewPage();
    this.addTitle('6. Security Implementation');
    
    this.addSubtitle('Authentication');
    platformDocumentation.security.authentication.forEach(item => {
      this.addBulletPoint(item, 5);
    });
    
    this.currentY += 5;
    this.addSubtitle('Authorization');
    platformDocumentation.security.authorization.forEach(item => {
      this.addBulletPoint(item, 5);
    });
    
    this.currentY += 5;
    this.addSubtitle('Data Protection');
    platformDocumentation.security.dataProtection.forEach(item => {
      this.addBulletPoint(item, 5);
    });
    
    this.currentY += 5;
    this.addSubtitle('Monitoring');
    platformDocumentation.security.monitoring.forEach(item => {
      this.addBulletPoint(item, 5);
    });
  }

  private generateSetup() {
    this.addNewPage();
    this.addTitle('7. Required Setup & Configuration');
    
    this.addSubtitle('Environment Secrets');
    platformDocumentation.setup.secrets.forEach(secret => {
      this.addText(secret.name, 11, 0);
      this.addText(`Purpose: ${secret.purpose}`, 10, 5);
      this.addText(`Required: ${secret.required ? 'Yes' : 'No'}`, 10, 5);
      if ('value' in secret) {
        this.addText(`Value: ${secret.value}`, 9, 5);
      }
      if (secret.setup) {
        this.addText('Setup:', 10, 5);
        secret.setup.split('\n').forEach(line => {
          this.addBulletPoint(line, 10);
        });
      }
      this.currentY += 3;
    });

    this.addSubtitle('Supabase Configuration');
    platformDocumentation.setup.supabaseConfig.forEach(item => {
      this.addBulletPoint(item, 5);
    });
    
    this.currentY += 5;
    this.addSubtitle('STOREA Bot Setup');
    platformDocumentation.setup.storeaBot.forEach(item => {
      this.addBulletPoint(item, 5);
    });
    
    this.currentY += 5;
    this.addSubtitle('Deployment');
    platformDocumentation.setup.deployment.forEach(item => {
      this.addBulletPoint(item, 5);
    });
  }

  private addPageNumbers() {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(9);
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  public generate(): jsPDF {
    // Generate all sections
    this.addCoverPage();
    this.addTableOfContents();
    this.generateSystemOverview();
    this.generateIntegrations();
    this.generateDatabaseSchema();
    this.generateUserRoles();
    this.generateUserExperience();
    this.generateSecurity();
    this.generateSetup();
    
    // Add page numbers to all pages
    this.addPageNumbers();
    
    return this.doc;
  }

  public download(filename: string = 'STOREA_Platform_Documentation.pdf') {
    const doc = this.generate();
    doc.save(filename);
  }

  public getBlob(): Blob {
    const doc = this.generate();
    return doc.output('blob');
  }
}
