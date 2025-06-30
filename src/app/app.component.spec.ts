import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter, ActivatedRoute } from '@angular/router';


describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { 
          provide: ActivatedRoute, 
          useValue: { 
            snapshot: { 
              paramMap: {
                get: () => null
              }
            },
            queryParamMap: { subscribe: (fn: any) => fn({ get: () => null }) }
          }
        }
      ],
      imports: [AppComponent],
    }).compileComponents();
  });


  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have as title "mainfrontend"', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('mainfrontend');
  });

  it('should render router-outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});

