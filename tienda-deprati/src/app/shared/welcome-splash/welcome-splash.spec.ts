import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeSplashComponent } from './welcome-splash';

describe('WelcomeSplash', () => {
  let component: WelcomeSplashComponent;
  let fixture: ComponentFixture<WelcomeSplashComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeSplashComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WelcomeSplashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
