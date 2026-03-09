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

  it('should display the Joinery brand', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.logo-text').textContent).toContain('Joinery');
  });

  it('should display the tagline', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.tagline').textContent).toContain('Secure, collaborative query sharing for teams');
  });

  it('should display the main value proposition heading', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h2').textContent).toContain('Streamline your team\'s data workflow');
  });

  it('should have Sign in with GitHub button', () => {
    const compiled = fixture.nativeElement;
    const githubButton = compiled.querySelector('.primary-cta');
    expect(githubButton.textContent).toContain('Sign in with GitHub');
  });

  it('should have Learn More button', () => {
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
    const section = compiled.querySelector('.how-it-works-section');
    expect(section).toBeTruthy();
    expect(compiled.textContent).toContain('How Joinery Works');
    expect(compiled.textContent).toContain('Powerful features designed for team collaboration, security, and workflow management');
  });

  it('should display Trust, Security, and Open Source section', () => {
    const compiled = fixture.nativeElement;
    const trustSection = compiled.querySelector('.trust-security-section');
    expect(trustSection).toBeTruthy();
    
    expect(compiled.textContent).toContain('Built with Trust, Security, and Transparency');
    expect(compiled.textContent).toContain('Your data security and privacy are our top priorities');
  });

  it('should display all three trust feature cards', () => {
    const compiled = fixture.nativeElement;
    const trustFeatureCards = compiled.querySelectorAll('.trust-feature-card');
    expect(trustFeatureCards.length).toBe(3);
    
    expect(compiled.textContent).toContain('Secure Authentication');
    expect(compiled.textContent).toContain('Data Privacy First');
    expect(compiled.textContent).toContain('Open Source Transparency');
  });

  it('should display OAuth provider icons', () => {
    const compiled = fixture.nativeElement;
    const oauthProviders = compiled.querySelectorAll('.oauth-provider');
    expect(oauthProviders.length).toBe(2);
    
    expect(compiled.textContent).toContain('GitHub');
    expect(compiled.textContent).toContain('Microsoft');
  });

  it('should have GitHub repository link', () => {
    const compiled = fixture.nativeElement;
    const repoLink = compiled.querySelector('.repo-link');
    expect(repoLink).toBeTruthy();
    expect(repoLink.getAttribute('href')).toBe('https://github.com/chz160/joinery');
    expect(repoLink.getAttribute('target')).toBe('_blank');
    expect(repoLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(repoLink.textContent).toContain('View on GitHub');
  });

  it('should display open source badge', () => {
    const compiled = fixture.nativeElement;
    const opensourceBadge = compiled.querySelector('.opensource-badge');
    expect(opensourceBadge).toBeTruthy();
    expect(opensourceBadge.textContent).toContain('MIT Licensed');
  });

  it('should display feature descriptions for each feature card', () => {
    const compiled = fixture.nativeElement;

    expect(compiled.textContent).toContain('Share SQL queries and data insights with granular permissions.');
    expect(compiled.textContent).toContain('Organize users into teams with hierarchical permissions.');
    expect(compiled.textContent).toContain('Complete visibility into query usage and modifications.');
    expect(compiled.textContent).toContain('Connect with your existing tools and workflows.');
  });

  // Footer Tests
  it('should display footer on landing page', () => {
    const compiled = fixture.nativeElement;
    const footer = compiled.querySelector('.landing-footer');
    expect(footer).toBeTruthy();
  });

  it('should display footer brand section', () => {
    const compiled = fixture.nativeElement;
    const footerBrand = compiled.querySelector('.footer-brand');
    expect(footerBrand).toBeTruthy();
    
    const footerLogo = compiled.querySelector('.footer-logo');
    expect(footerLogo).toBeTruthy();
    expect(footerLogo.textContent).toContain('Joinery');
    
    const footerTagline = compiled.querySelector('.footer-tagline');
    expect(footerTagline.textContent).toContain('Secure, collaborative query sharing for teams');
  });

  it('should display footer navigation links', () => {
    const compiled = fixture.nativeElement;
    
    // Resources section
    expect(compiled.textContent).toContain('Resources');
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
    expect(compiled.textContent).toContain('Discussions');
    expect(compiled.textContent).toContain('Contribute');
  });

  it('should have correct external links in footer', () => {
    const compiled = fixture.nativeElement;
    
    // Documentation link
    const docLink = compiled.querySelector('a[href="https://github.com/chz160/joinery/wiki"]');
    expect(docLink).toBeTruthy();
    expect(docLink.textContent).toContain('Documentation');
    
    // Support link
    const supportLink = compiled.querySelector('a[href="https://github.com/chz160/joinery/issues"]');
    expect(supportLink).toBeTruthy();
    expect(supportLink.textContent).toContain('Support');
    
    // GitHub link
    const githubLink = compiled.querySelector('a[href="https://github.com/chz160/joinery"]');
    expect(githubLink).toBeTruthy();
    expect(githubLink.textContent).toContain('GitHub');
    
    // Contact link
    const contactLink = compiled.querySelector('a[href="mailto:support@joinery.dev"]');
    expect(contactLink).toBeTruthy();
    expect(contactLink.textContent).toContain('Contact');
  });

  it('should display footer bottom section', () => {
    const compiled = fixture.nativeElement;
    const footerBottom = compiled.querySelector('.footer-bottom');
    expect(footerBottom).toBeTruthy();
    
    const copyright = compiled.querySelector('.footer-copyright');
    expect(copyright.textContent).toContain('© 2024 Joinery. Open source under MIT License.');
    
    const legal = compiled.querySelector('.footer-legal');
    expect(legal.textContent).toContain('Built for teams and educational organizations');
  });

  it('should have proper accessibility attributes on footer links', () => {
    const compiled = fixture.nativeElement;
    
    // Check external links have proper rel attributes
    const externalLinks = compiled.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach((link: any) => {
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('should not reference public query exploration in footer', () => {
    const compiled = fixture.nativeElement;
    const footerText = compiled.querySelector('.landing-footer').textContent.toLowerCase();
    
    // Ensure no references to public query exploration
    expect(footerText).not.toContain('public query');
    expect(footerText).not.toContain('explore queries');
    expect(footerText).not.toContain('public database');
    expect(footerText).not.toContain('browse queries');
  });

  it('should focus on team/organization audience in footer', () => {
    const compiled = fixture.nativeElement;
    const footerText = compiled.querySelector('.landing-footer').textContent.toLowerCase();
    
    // Ensure focus on teams and organizations
    expect(footerText).toContain('teams');
    expect(footerText).toContain('organizations');
  });
});