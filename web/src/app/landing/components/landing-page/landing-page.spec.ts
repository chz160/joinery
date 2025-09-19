import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage, RouterTestingModule, NoopAnimationsModule]
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

  it('should display the demo section', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('See Joinery in Action');
    expect(compiled.textContent).toContain('Watch how teams collaborate seamlessly on data queries and insights');
  });

  it('should display all three demo steps', () => {
    const compiled = fixture.nativeElement;
    const steps = compiled.querySelectorAll('.demo-step');
    expect(steps.length).toBe(3);
    expect(steps[0].textContent).toContain('Create & Share Queries');
    expect(steps[1].textContent).toContain('Team Collaboration');
    expect(steps[2].textContent).toContain('Track History & Insights');
  });

  it('should show step 1 as active by default', () => {
    const compiled = fixture.nativeElement;
    const activeStep = compiled.querySelector('.demo-step.active');
    expect(activeStep).toBeTruthy();
    expect(activeStep.textContent).toContain('Create & Share Queries');
  });

  it('should change active step when clicked', () => {
    const compiled = fixture.nativeElement;
    const step2 = compiled.querySelectorAll('.demo-step')[1];
    
    step2.click();
    fixture.detectChanges();
    
    expect(component.currentStep).toBe(2);
    expect(step2.classList).toContain('active');
  });

  it('should display correct screen title for each step', () => {
    expect(component.getScreenTitle()).toBe('Joinery Query Editor');
    
    component.setStep(2);
    expect(component.getScreenTitle()).toBe('Team Collaboration Hub');
    
    component.setStep(3);
    expect(component.getScreenTitle()).toBe('Analytics & History Dashboard');
  });

  it('should display demo benefits section', () => {
    const compiled = fixture.nativeElement;
    const benefits = compiled.querySelectorAll('.benefit');
    expect(benefits.length).toBe(3);
    expect(benefits[0].textContent).toContain('Enhanced Team Productivity');
    expect(benefits[1].textContent).toContain('Enterprise Security');
    expect(benefits[2].textContent).toContain('Data-Driven Insights');
  });

  it('should display benefits section', () => {
    const compiled = fixture.nativeElement;
    const benefitCards = compiled.querySelectorAll('.benefit-card');
    expect(benefitCards.length).toBe(3);
    expect(compiled.textContent).toContain('For Organizations');
    expect(compiled.textContent).toContain('For Educational Teams');
    expect(compiled.textContent).toContain('Repository Integration');
  });

  it('should display How Joinery Works section', () => {
    const compiled = fixture.nativeElement;
    const section = compiled.querySelector('.how-it-works-section');
    expect(section).toBeTruthy();
    expect(compiled.textContent).toContain('How Joinery Works');
    expect(compiled.textContent).toContain('Powerful features designed for team collaboration, security, and workflow management');
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
    expect(repoLink.getAttribute('href')).toBe('https://github.com/chz160/joinery-web');
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

  it('should display feature highlights for each feature card', () => {
    const compiled = fixture.nativeElement;
    
    // Query Sharing highlights
    expect(compiled.textContent).toContain('Role-based access control');
    expect(compiled.textContent).toContain('Private team workspaces');
    expect(compiled.textContent).toContain('Secure query execution');
    
    // Team Management highlights
    expect(compiled.textContent).toContain('Multi-level team structure');
    expect(compiled.textContent).toContain('SSO integration ready');
    expect(compiled.textContent).toContain('Centralized user management');
    
    // Audit Trail highlights
    expect(compiled.textContent).toContain('Full query version history');
    expect(compiled.textContent).toContain('User activity tracking');
    expect(compiled.textContent).toContain('Compliance reporting');
    
    // Extension Support highlights
    expect(compiled.textContent).toContain('GitHub/GitLab integration');
    expect(compiled.textContent).toContain('REST API access');
    expect(compiled.textContent).toContain('Custom workflow support');
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
    
    // Company section  
    expect(compiled.textContent).toContain('Company');
    expect(compiled.textContent).toContain('Privacy Policy');
    expect(compiled.textContent).toContain('How It Works');
    expect(compiled.textContent).toContain('Contact');
    
    // Community section
    expect(compiled.textContent).toContain('Community');
    expect(compiled.textContent).toContain('GitHub');
    expect(compiled.textContent).toContain('Discussions');
    expect(compiled.textContent).toContain('Contribute');
  });

  it('should have correct external links in footer', () => {
    const compiled = fixture.nativeElement;
    
    // Documentation link
    const docLink = compiled.querySelector('a[href="https://github.com/chz160/joinery-web/wiki"]');
    expect(docLink).toBeTruthy();
    expect(docLink.textContent).toContain('Documentation');
    
    // Support link
    const supportLink = compiled.querySelector('a[href="https://github.com/chz160/joinery-web/issues"]');
    expect(supportLink).toBeTruthy();
    expect(supportLink.textContent).toContain('Support');
    
    // GitHub link
    const githubLink = compiled.querySelector('a[href="https://github.com/chz160/joinery-web"]');
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