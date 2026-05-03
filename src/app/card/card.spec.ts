import { ComponentFixture, TestBed } from '@angular/core/testing';

<<<<<<< HEAD
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
=======
import { Card } from './card';

describe('Card', () => {
  let component: Card;
  let fixture: ComponentFixture<Card>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Card]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Card);
    component = fixture.componentInstance;
>>>>>>> f6c6154836f6082cf0377f1f787c3a4c17b7a610
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
<<<<<<< HEAD
});
=======
});
>>>>>>> f6c6154836f6082cf0377f1f787c3a4c17b7a610
