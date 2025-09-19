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
});