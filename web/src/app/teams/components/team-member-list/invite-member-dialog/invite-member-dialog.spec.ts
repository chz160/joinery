import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { InviteMemberDialog, InviteMemberDialogData } from './invite-member-dialog';

describe('InviteMemberDialog', () => {
  let component: InviteMemberDialog;
  let fixture: ComponentFixture<InviteMemberDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<InviteMemberDialog>>;

  const dialogData: InviteMemberDialogData = {
    teamId: '1',
    teamName: 'Data Science'
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [InviteMemberDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InviteMemberDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have team name in data', () => {
    expect(component.data.teamName).toBe('Data Science');
  });

  it('should add a valid email', () => {
    component.emailInput = 'test@example.com';
    component.addEmail();
    expect(component.emails).toContain('test@example.com');
    expect(component.emailInput).toBe('');
  });

  it('should not add an invalid email', () => {
    component.emailInput = 'notanemail';
    component.addEmail();
    expect(component.emails.length).toBe(0);
    expect(component.emailError).toBeTruthy();
  });

  it('should not add duplicate email', () => {
    component.emailInput = 'test@example.com';
    component.addEmail();
    component.emailInput = 'test@example.com';
    component.addEmail();
    expect(component.emails.length).toBe(1);
    expect(component.emailError).toBeTruthy();
  });

  it('should not add empty email', () => {
    component.emailInput = '';
    component.addEmail();
    expect(component.emails.length).toBe(0);
  });

  it('should remove an email', () => {
    component.emailInput = 'test@example.com';
    component.addEmail();
    component.removeEmail('test@example.com');
    expect(component.emails.length).toBe(0);
  });

  it('should default to member role', () => {
    expect(component.selectedRole).toBe('member');
  });

  it('cancel should close dialog without result', () => {
    component.cancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('invite should not close if no emails', () => {
    component.invite();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('invite should close with result when emails exist', () => {
    component.emailInput = 'alice@example.com';
    component.addEmail();
    component.emailInput = 'bob@example.com';
    component.addEmail();
    component.selectedRole = 'admin';
    component.invite();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      emails: ['alice@example.com', 'bob@example.com'],
      role: 'admin'
    });
  });

  it('trackByEmail should return the email', () => {
    expect(component.trackByEmail(0, 'test@example.com')).toBe('test@example.com');
  });

  it('trackByRoleOption should return the role value', () => {
    expect(component.trackByRoleOption(0, { value: 'admin' as any })).toBe('admin');
  });

  it('should have 3 role options', () => {
    expect(component.roleOptions.length).toBe(3);
  });

  it('onKeydown with Enter should add email', () => {
    component.emailInput = 'enter@example.com';
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(event, 'preventDefault');
    component.onKeydown(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.emails).toContain('enter@example.com');
  });
});
