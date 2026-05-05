import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroAsegurado } from './registro-asegurado';

describe('RegistroAsegurado', () => {
  let component: RegistroAsegurado;
  let fixture: ComponentFixture<RegistroAsegurado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroAsegurado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroAsegurado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
