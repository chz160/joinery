import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MemberRoleDialog, MemberRoleDialogData } from './member-role-dialog';
import { TeamMember } from '../../../../shared/models';

describe('MemberRoleDialog', () => {
  let component: MemberRoleDialog;
  let fixture: ComponentFixture<MemberRoleDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<MemberRoleDialog>>;

  const mockMember: TeamMember = {
    id: '2', userId: '43', email: 'alice@example.com', name: 'Alice Smith',
    role: 'admin', status: 'active', joinedAt: new Date('2024-01-20')
  };

  const dialogData: MemberRoleDialogData = {
    member: mockMember,
    teamName: 'Data Science'
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [MemberRoleDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MemberRoleDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current member role', () => {
    expect(component.selectedRole).toBe('admin');
  });

  it('cancel should close dialog without result', () => {
    component.cancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('save should close dialog without result if role unchanged', () => {
    component.save();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('save should close dialog with new role when changed', () => {
    component.selectedRole = 'member';
    component.save();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ role: 'member' });
  });

  it('should have 3 role options', () => {
    expect(component.roleOptions.length).toBe(3);
  });

  it('trackByRoleOption should return role value', () => {
    expect(component.trackByRoleOption(0, { value: 'viewer' as any })).toBe('viewer');
  });

  it('should display member name from data', () => {
    expect(component.data.member.name).toBe('Alice Smith');
  });
});
