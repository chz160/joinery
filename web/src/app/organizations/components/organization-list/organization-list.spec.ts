import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationList } from './organization-list';

describe('OrganizationList', () => {
  let component: OrganizationList;
  let fixture: ComponentFixture<OrganizationList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
