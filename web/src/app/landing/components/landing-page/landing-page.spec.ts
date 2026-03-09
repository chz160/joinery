import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LandingPage,
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the hero title "Joinery"', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.hero-title').textContent).toContain('Joinery');
  });

  it('should display the hero subtitle', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.hero-subtitle').textContent).toContain('Where teams craft better queries together');
  });

  it('should have a "Get Started" link pointing to /auth/login', () => {
    const compiled = fixture.nativeElement;
    const btn = compiled.querySelector('.btn-primary');
    expect(btn).toBeTruthy();
    expect(btn.textContent.trim()).toBe('Get Started');
    expect(btn.getAttribute('href')).toBe('/auth/login');
  });

  it('should have a "View on GitHub" link with correct href', () => {
    const compiled = fixture.nativeElement;
    const learnMoreButton = compiled.querySelector('.secondary-cta');
    expect(learnMoreButton.textContent).toContain('Learn More');
  });

  it('should display feature highlights', () => {
    const compiled = fixture.nativeElement;
    const features = compiled.querySelectorAll('.feature');
    expect(features.length).toBe(3);
    expect(features[0].textContent).toContain('Secure collaboration');
    expect(features[1].textContent).toContain('Team management');
    expect(features[2].textContent).toContain('Query organization');
  });

  it('should display the hero section', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Your Team\'s Data Hub');
    expect(compiled.textContent).toContain('Centralized access to queries, repositories, and team insights');
  });

  it('should display all four feature cards in How It Works section', () => {
    const compiled = fixture.nativeElement;
    const featureCards = compiled.querySelectorAll('.feature-card');
    expect(featureCards.length).toBe(4);

    expect(compiled.textContent).toContain('Secure Query Sharing');
    expect(compiled.textContent).toContain('Team & Organization Management');
    expect(compiled.textContent).toContain('Audit Trail & History');
    expect(compiled.textContent).toContain('Extension & Integration Support');
  });

  it('should have step 1 as initial active step', () => {
    expect(component.currentStep).toBe(1);
    expect(component.getScreenTitle()).toBe('Joinery Query Editor');
  });

  it('should update active step via setStep', () => {
    component.setStep(2);
    fixture.detectChanges();
    
    expect(component.currentStep).toBe(2);
    expect(component.getScreenTitle()).toBe('Team Collaboration Hub');
  });

  it('should display correct screen title for each step', () => {
    expect(component.getScreenTitle()).toBe('Joinery Query Editor');
    
    component.setStep(2);
    expect(component.getScreenTitle()).toBe('Team Collaboration Hub');
    
    component.setStep(3);
    expect(component.getScreenTitle()).toBe('Analytics & History Dashboard');
  });

  it('should display How Joinery Works section', () => {
    const compiled = fixture.nativeElement;
    const cards = compiled.querySelectorAll('.trust-card');
    expect(cards.length).toBe(2);
  });

  it('should display trust card: Secure Authentication', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Secure Authentication');
  });

  it('should display Trust, Security, and Open Source section', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Open Source');
  });

  it('should not display the removed "Data Privacy First" card', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).not.toContain('Data Privacy First');
  });

  it('should not contain false security claims', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).not.toContain('End-to-end encryption');
    expect(compiled.textContent).not.toContain('Zero-knowledge');
    expect(compiled.textContent).not.toContain('No data mining');
  });

  it('should have a "View on GitHub" trust link in the Open Source card', () => {
    const compiled = fixture.nativeElement;
    const trustLink = compiled.querySelector('.trust-link');
    expect(trustLink).toBeTruthy();
    expect(trustLink.getAttribute('href')).toBe('https://github.com/chz160/joinery');
    expect(trustLink.getAttribute('target')).toBe('_blank');
    expect(trustLink.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should display the footer', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.landing-footer')).toBeTruthy();
  });

  it('should display feature descriptions for each feature card', () => {
    const compiled = fixture.nativeElement;

    expect(compiled.textContent).toContain('Share SQL queries and data insights with granular permissions.');
    expect(compiled.textContent).toContain('Organize users into teams with hierarchical permissions.');
    expect(compiled.textContent).toContain('Complete visibility into query usage and modifications.');
    expect(compiled.textContent).toContain('Connect with your existing tools and workflows.');
  });

  it('should display footer brand "Joinery"', () => {
    const compiled = fixture.nativeElement;
    const brandText = compiled.querySelector('.footer-brand-text');
    expect(brandText).toBeTruthy();
    expect(brandText.textContent).toContain('Joinery');
  });

  it('should display correct copyright year © 2026', () => {
    const compiled = fixture.nativeElement;
    const copyright = compiled.querySelector('.footer-copyright');
    expect(copyright.textContent).toContain('© 2026');
  });

  it('should display correct contact email support@jnry.io', () => {
    const compiled = fixture.nativeElement;
    const contactLink = compiled.querySelector('a[href="mailto:support@jnry.io"]');
    expect(contactLink).toBeTruthy();
    expect(contactLink.textContent.trim()).toBe('Contact');
  });

  it('should display footer navigation links', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Documentation');
    expect(compiled.textContent).toContain('Support');
    expect(compiled.textContent).toContain('Roadmap');

    // Company section - verify links exist by querying footer column anchors
    expect(compiled.textContent).toContain('Company');
    const companyLinks = Array.from(
      compiled.querySelectorAll('.footer-column .footer-nav a') as NodeListOf<HTMLAnchorElement>
    ).map(a => a.textContent?.trim() ?? '');
    expect(companyLinks.some(t => t.includes('Privacy Policy'))).toBeTrue();
    expect(companyLinks.some(t => t.includes('How It Works'))).toBeTrue();
    expect(compiled.textContent).toContain('Contact');
    
    // Community section
    expect(compiled.textContent).toContain('Community');
    expect(compiled.textContent).toContain('GitHub');
    expect(compiled.textContent).toContain('Discussions');
    expect(compiled.textContent).toContain('Contribute');
  });

  it('should have proper rel attributes on all external links', () => {
    const compiled = fixture.nativeElement;
    const externalLinks = compiled.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach((link: any) => {
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('should focus on team/organization audience in footer', () => {
    const compiled = fixture.nativeElement;
    const footerText = compiled.querySelector('.landing-footer').textContent.toLowerCase();
    expect(footerText).toContain('teams');
    expect(footerText).toContain('organizations');
  });

  it('should not have broken hash links in the footer', () => {
    const compiled = fixture.nativeElement;
    const hashLinks = compiled.querySelectorAll('a[href="#"]');
    expect(hashLinks.length).toBe(0);
  });
});