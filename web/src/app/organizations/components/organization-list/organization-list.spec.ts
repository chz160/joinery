import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { OrganizationList } from './organization-list';
import { OrganizationService } from '../../../shared/services/organization.service';
import { ProviderService } from '../../../shared/services/provider.service';
import { Organization } from '../../../shared/models';

describe('OrganizationList', () => {
  let component: OrganizationList;
  let fixture: ComponentFixture<OrganizationList>;
  let organizationServiceSpy: jasmine.SpyObj<OrganizationService>;

  const mockOrganizations: Organization[] = [
    {
      id: '1',
      name: 'Acme Corp',
      description: 'Main corporate organization',
      ownerId: '42',
      members: [],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-01')
    }
  ];

  beforeEach(async () => {
    organizationServiceSpy = jasmine.createSpyObj('OrganizationService', ['getOrganizations']);
    organizationServiceSpy.getOrganizations.and.returnValue(of(mockOrganizations));

    await TestBed.configureTestingModule({
      imports: [OrganizationList, RouterTestingModule],
      providers: [
        { provide: OrganizationService, useValue: organizationServiceSpy },
        ProviderService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load organizations on init', () => {
    expect(organizationServiceSpy.getOrganizations).toHaveBeenCalled();
    expect(component.organizations).toEqual(mockOrganizations);
  });

  it('should set loading to false after organizations load', () => {
    expect(component.loading).toBeFalse();
  });

  it('should set errorMessage on load failure', () => {
    spyOn(console, 'error');
    organizationServiceSpy.getOrganizations.and.returnValue(throwError(() => new Error('Network error')));
    component.loadOrganizations();
    expect(component.errorMessage).toBeTruthy();
    expect(component.loading).toBeFalse();
  });
});
