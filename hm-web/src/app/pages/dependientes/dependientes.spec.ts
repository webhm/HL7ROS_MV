import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dependientes } from './dependientes';

describe('Dependientes', () => {
  let component: Dependientes;
  let fixture: ComponentFixture<Dependientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dependientes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dependientes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
