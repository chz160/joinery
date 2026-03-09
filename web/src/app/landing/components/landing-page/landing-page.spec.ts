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
    const links = compiled.querySelectorAll('.btn-secondary');
    const githubLink = Array.from(links).find((el: any) =>
      el.textContent.includes('View on GitHub')
    ) as HTMLElement | undefined;
    expect(githubLink).toBeTruthy();
    expect(githubLink!.getAttribute('href')).toBe('https://github.com/chz160/joinery');
    expect(githubLink!.getAttribute('target')).toBe('_blank');
    expect(githubLink!.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should display the workflow section with 3 steps', () => {
    const compiled = fixture.nativeElement;
    const steps = compiled.querySelectorAll('.workflow-step');
    expect(steps.length).toBe(3);
  });

  it('should display workflow step titles: Connect, Sync, Find what you need', () => {
    const compiled = fixture.nativeElement;
    const titles = compiled.querySelectorAll('.step-title');
    expect(titles.length).toBe(3);
    expect(titles[0].textContent.trim()).toBe('Connect');
    expect(titles[1].textContent.trim()).toBe('Sync');
    expect(titles[2].textContent.trim()).toContain('Find what you need');
  });

  it('should start with workflowVisible = false', () => {
    expect(component.workflowVisible).toBeFalse();
  });

  it('should display exactly 2 trust cards', () => {
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

  it('should not display "Your Team\'s Data Hub" card', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).not.toContain("Your Team's Data Hub");
  });

  it('should not display "Sign in with GitHub" button', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).not.toContain('Sign in with GitHub');
  });

  it('should not display "Learn More" button', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).not.toContain('Learn More');
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

    expect(compiled.textContent).toContain('Company');
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