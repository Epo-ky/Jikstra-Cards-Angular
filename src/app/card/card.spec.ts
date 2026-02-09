import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardComponent } from './card';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    component.cardData = {
      nome: 'Teste',
      descricao: 'Carta de teste',
      strong: 1,
      speed: 1,
      intelligence: 1,
      imagemUrl: 'https://example.com/teste.jpg',
      tipo: 'força'
    };
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
