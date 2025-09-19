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
});