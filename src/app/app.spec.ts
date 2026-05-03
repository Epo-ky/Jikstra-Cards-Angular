import { TestBed } from '@angular/core/testing';
<<<<<<< HEAD
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
=======
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
>>>>>>> f6c6154836f6082cf0377f1f787c3a4c17b7a610
    }).compileComponents();
  });

  it('should create the app', () => {
<<<<<<< HEAD
    const fixture = TestBed.createComponent(AppComponent);
=======
    const fixture = TestBed.createComponent(App);
>>>>>>> f6c6154836f6082cf0377f1f787c3a4c17b7a610
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
<<<<<<< HEAD
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('JIKSTRA TCG');
=======
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, CardGameVisual');
>>>>>>> f6c6154836f6082cf0377f1f787c3a4c17b7a610
  });
});
