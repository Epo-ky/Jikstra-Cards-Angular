import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Card {
  nome: string;
  descricao: string;
  strong: number;
  speed: number;
  intelligence: number;
  imagemUrl: string;
  tipo: string;
}

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" 
         [ngClass]="{
           'force': cardData.tipo === 'força', 
           'speed': cardData.tipo === 'velocidade', 
           'magic': cardData.tipo === 'magia',
           'enemy-mode': isEnemy
         }">
      
      <div class="card-inner">
        <div class="card-header">
          <span class="card-name">{{ cardData.nome }}</span>
          <span class="card-icon">
            {{ cardData.tipo === 'força' ? '⚔️' : (cardData.tipo === 'velocidade' ? '🦶' : '🔮') }}
          </span>
        </div>

        <div class="card-image" [style.backgroundImage]="'url(' + cardData.imagemUrl + ')'"></div>

        <div class="card-body">
          <p>{{ cardData.descricao }}</p>
        </div>

        <div class="card-stats">
          <div class="stat strong"><strong>👊</strong> {{ cardData.strong }}</div>
          <div class="stat speed"><strong>⚡</strong> {{ cardData.speed }}</div>
          <div class="stat int"><strong>🧠</strong> {{ cardData.intelligence }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Estilo Base da Carta */
    .card {
      width: 160px;
      height: 240px;
      border-radius: 12px;
      background: #1e1e1e;
      color: white;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      border: 3px solid #444;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      font-family: 'Segoe UI', sans-serif;
    }

    .card:hover {
      transform: translateY(-10px) scale(1.05);
      box-shadow: 0 10px 20px rgba(0,0,0,0.7);
      z-index: 10;
    }

    /* Cores por Tipo */
    .card.force { border-color: #e74c3c; box-shadow: 0 0 10px rgba(231, 76, 60, 0.3); }
    .card.speed { border-color: #f1c40f; box-shadow: 0 0 10px rgba(241, 196, 15, 0.3); }
    .card.magic { border-color: #9b59b6; box-shadow: 0 0 10px rgba(155, 89, 182, 0.3); }
    
    /* Estilo Inimigo (se precisar diferenciar visualmente depois) */
    .card.enemy-mode {
      border-color: #ff0000;
    }

    .card-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 8px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
      font-size: 0.8rem;
      font-weight: bold;
      text-transform: uppercase;
    }

    .card-image {
      flex-grow: 1;
      background-size: cover;
      background-position: center;
      border-radius: 6px;
      margin-bottom: 5px;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .card-body p {
      font-size: 0.7rem;
      color: #ccc;
      margin: 0;
      line-height: 1.2;
      text-align: center;
      margin-bottom: 5px;
      font-style: italic;
    }

    .card-stats {
      display: flex;
      justify-content: space-around;
      background: rgba(0,0,0,0.4);
      padding: 4px;
      border-radius: 20px;
    }

    .stat {
      font-size: 0.8rem;
      font-weight: bold;
    }
  `]
})
export class CardComponent {
  @Input() cardData!: Card;
  
  // AQUI ESTAVA O QUE FALTAVA:
  @Input() isEnemy: boolean = false; 
}