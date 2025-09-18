import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueryBrowser } from './query-browser';

describe('QueryBrowser', () => {
  let component: QueryBrowser;
  let fixture: ComponentFixture<QueryBrowser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueryBrowser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QueryBrowser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
