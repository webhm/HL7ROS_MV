import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoAutorizado } from './no-autorizado';

describe('NoAutorizado', () => {
  let component: NoAutorizado;
  let fixture: ComponentFixture<NoAutorizado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoAutorizado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoAutorizado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
