import { Component, HostListener, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, Card } from './card/card';
import { GameService } from './game.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  constructor(
    public game: GameService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.game.setCdr(this.cdr);
  }

  // ========================================================
  // ATALHOS DE TECLADO
  // ========================================================

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'd') {
      event.preventDefault();
      this.game.mostrarDebug = !this.game.mostrarDebug;
    }
  }

  // ========================================================
  // LOGIN
  // ========================================================

  classesDisponiveis = [
    { id: 'guerreiro', nome: 'Guerreiro', icone: '⚔️', desc: 'Alta Defesa, Força Bruta' },
    { id: 'mago',      nome: 'Mago',      icone: '🔮', desc: 'Dano Mágico, Estratégia' },
    { id: 'ladino',    nome: 'Ladino',    icone: '🗡️', desc: 'Velocidade, Críticos' }
  ];

  selecionarClasse(classe: any) {
    this.game.classeSelecionada = this.game.classeSelecionada === classe ? null : classe;
  }

  entrarNoJogo(nome: string) {
    if (nome.trim().length > 0 && this.game.classeSelecionada) {
      this.game.nomeJogador = nome.toUpperCase();
      this.game.iniciarPartida();
    } else {
      alert('Por favor, digite seu nome e escolha uma classe!');
    }
  }

  // ========================================================
  // DELEGAÇÃO PARA O SERVIÇO
  // ========================================================

  selecionarCarta(carta: Card) { this.game.selecionarCarta(carta); }
  usarCartaMagica(carta: Card) { this.game.usarCartaMagica(carta); }
  pularMagia()                 { this.game.pularMagia(); }
  voltarParaLogin()            { this.game.voltarParaLogin(); }
  reiniciar()                  { this.game.limparTimers(); this.game.iniciarPartida(); }
  surrender()                  { this.game.surrender(); }
}