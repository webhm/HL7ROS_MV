import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Asegurados } from './asegurados';

describe('Asegurados', () => {
  let component: Asegurados;
  let fixture: ComponentFixture<Asegurados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Asegurados]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Asegurados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
