import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DominioExportComponent } from './dominio-export.component';

describe('DominioExportComponent', () => {
  let component: DominioExportComponent;
  let fixture: ComponentFixture<DominioExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DominioExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DominioExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
