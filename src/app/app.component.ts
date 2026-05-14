import { Component, NgZone, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, Card } from './card/card';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {}

  readonly VIDA_INICIAL = 60;
  readonly DANO_DERROTA = 10;
  readonly TAMANHO_MINIMO_DECK = 18;
  readonly TEMPO_ESCOLHA_MS = 30000;
  readonly TEMPO_IA_MS = 1000;

  jogoIniciado = false;
  nomeJogador = '';
  vidaJogador = this.VIDA_INICIAL;
  vidaInimigo = this.VIDA_INICIAL;
  mensagemBatalha = '';
  jogoTerminou = false;
  faseAtual: 'draw' | 'main' | 'battle' | 'end' = 'draw';
  cartaJogadorSelecionada: Card | null = null;
  cartaInimigoSelecionada: Card | null = null;
  deckJogador: Card[] = [];
  deckOponente: Card[] = [];
  maoDoJogador: Card[] = [];
  maoDoOponente: Card[] = [];

  private timerJogador: ReturnType<typeof setTimeout> | null = null;
  private timerIA: ReturnType<typeof setTimeout> | null = null;

  // ========================================================
  // DEBUG — Ctrl+D
  // ========================================================
  mostrarDebug = false;
  debugLog: string[] = [];
  rodadaAtual = 0;

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'd') {
      event.preventDefault();
      this.mostrarDebug = !this.mostrarDebug;
    }
  }

  private log(msg: string) {
    const ts = new Date().toLocaleTimeString('pt-BR');
    this.debugLog.unshift(`[${ts}] ${msg}`);
    if (this.debugLog.length > 60) this.debugLog.pop();
  }

  // Helper central: atualiza estado E força o Angular a ver a mudança
  private atualizar(fn: () => void) {
    fn();
    this.cdr.detectChanges();
  }

  // ========================================================
  // LOGIN
  // ========================================================
  classeSelecionada: any = null;
  classesDisponiveis = [
    { id: 'guerreiro', nome: 'Guerreiro', icone: '⚔️', desc: 'Alta Defesa, Força Bruta' },
    { id: 'mago',      nome: 'Mago',      icone: '🔮', desc: 'Dano Mágico, Estratégia' },
    { id: 'ladino',    nome: 'Ladino',    icone: '⚡', desc: 'Velocidade, Críticos' }
  ];

  selecionarClasse(classe: any) {
    this.classeSelecionada = this.classeSelecionada === classe ? null : classe;
  }

  entrarNoJogo(nome: string) {
    if (nome.trim().length > 0 && this.classeSelecionada) {
      this.nomeJogador = nome.toUpperCase();
      this.iniciarPartida();
    } else {
      alert('Por favor, digite seu nome e escolha uma classe!');
    }
  }

  iniciarPartida() {
    this.limparTimers();
    this.jogoIniciado = true;
    this.vidaJogador = this.VIDA_INICIAL;
    this.vidaInimigo = this.VIDA_INICIAL;
    this.jogoTerminou = false;
    this.cartaJogadorSelecionada = null;
    this.cartaInimigoSelecionada = null;
    this.debugLog = [];
    this.rodadaAtual = 0;

    this.deckJogador = this.gerarDeckBase();
    this.deckOponente = this.gerarDeckBase();
    this.embaralhar(this.deckJogador);
    this.embaralhar(this.deckOponente);
    this.maoDoJogador = [];
    this.maoDoOponente = [];

    for (let i = 0; i < 3; i++) {
      this.comprarCarta('jogador');
      this.comprarCarta('oponente');
    }

    this.log(`=== PARTIDA INICIADA === Jogador: ${this.nomeJogador}`);
    this.log(`Mão inicial: ${this.maoDoJogador.map(c => c.nome).join(', ')}`);

    this.drawPhase();
  }

  // ========================================================
  // FASES — toda mudança de estado passa pelo atualizar()
  // ========================================================

  drawPhase() {
    this.atualizar(() => {
      this.faseAtual = 'draw';
      this.rodadaAtual++;
      this.mensagemBatalha = '📥 Draw Phase';
      this.comprarCarta('jogador');
      this.comprarCarta('oponente');
      this.log(`--- RODADA ${this.rodadaAtual} ---`);
      this.log(`DRAW: Mão jogador: ${this.maoDoJogador.map(c => c.nome).join(', ')}`);
    });

    setTimeout(() => this.mainPhase(), 500);
  }

  mainPhase() {
    this.atualizar(() => {
      this.faseAtual = 'main';
      this.cartaJogadorSelecionada = null;
      this.cartaInimigoSelecionada = null;
      this.mensagemBatalha = '⚔️ Main Phase — escolha sua carta! (5s)';
      this.log(`MAIN: Aguardando jogador (${this.TEMPO_ESCOLHA_MS / 1000}s)`);
    });

    // Timer do jogador — 5s para escolher, senão auto-seleciona
    this.timerJogador = setTimeout(() => {
      this.atualizar(() => {
        if (!this.cartaJogadorSelecionada && this.faseAtual === 'main') {
          const index = Math.floor(Math.random() * this.maoDoJogador.length);
          this.cartaJogadorSelecionada = this.maoDoJogador[index];
          this.mensagemBatalha = `⏱️ Auto: ${this.cartaJogadorSelecionada.nome}`;
          this.log(`MAIN: Auto-selecionado → ${this.cartaJogadorSelecionada.nome} (${this.cartaJogadorSelecionada.tipo})`);
        }
      });
      this.verificarProntoParaBatalha();
    }, this.TEMPO_ESCOLHA_MS);

    // IA escolhe após 1s
    this.timerIA = setTimeout(() => {
      this.atualizar(() => {
        if (this.faseAtual === 'main') {
          if (this.maoDoOponente.length === 0) this.comprarCarta('oponente');
          const index = Math.floor(Math.random() * this.maoDoOponente.length);
          this.cartaInimigoSelecionada = this.maoDoOponente[index];
          this.log(`MAIN: IA escolheu → ${this.cartaInimigoSelecionada.nome} (${this.cartaInimigoSelecionada.tipo})`);
        }
      });
      this.verificarProntoParaBatalha();
    }, this.TEMPO_IA_MS);
  }

  selecionarCarta(carta: Card) {
    if (this.jogoTerminou || this.faseAtual !== 'main') return;
    if (this.cartaJogadorSelecionada) return;

    this.limparTimerJogador();
    this.atualizar(() => {
      this.cartaJogadorSelecionada = carta;
      this.mensagemBatalha = `✅ ${carta.nome} selecionada!`;
      this.log(`MAIN: Jogador escolheu → ${carta.nome} (${carta.tipo})`);
    });
    this.verificarProntoParaBatalha();
  }

  private verificarProntoParaBatalha() {
    if (this.cartaJogadorSelecionada && this.cartaInimigoSelecionada) {
      this.limparTimers();
      this.log(`MAIN: Ambos prontos → Battle em 400ms`);
      setTimeout(() => this.battlePhase(), 400);
    } else {
      this.log(`MAIN: Aguardando... Jogador: ${this.cartaJogadorSelecionada?.nome ?? 'null'} | IA: ${this.cartaInimigoSelecionada?.nome ?? 'null'}`);
    }
  }

  battlePhase() {
    this.atualizar(() => {
      this.faseAtual = 'battle';
      this.mensagemBatalha = '💥 Battle Phase!';
      this.log(`BATTLE: ${this.cartaJogadorSelecionada!.nome} vs ${this.cartaInimigoSelecionada!.nome}`);

      this.resolverCombate(this.cartaJogadorSelecionada!, this.cartaInimigoSelecionada!);
      this.removerDaMao(this.maoDoJogador, this.cartaJogadorSelecionada!);
      this.removerDaMao(this.maoDoOponente, this.cartaInimigoSelecionada!);

      this.log(`BATTLE: Resultado — ${this.mensagemBatalha}`);
      this.log(`VIDA: Jogador ${this.vidaJogador} | Inimigo ${this.vidaInimigo}`);
      this.checkFimDeJogo();
    });

    if (!this.jogoTerminou) {
      setTimeout(() => this.endPhase(), 1500);
    }
  }

  endPhase() {
    this.atualizar(() => {
      this.faseAtual = 'end';
      this.mensagemBatalha = '🔄 End Phase...';
      this.cartaJogadorSelecionada = null;
      this.cartaInimigoSelecionada = null;
      this.log(`END: Campo limpo → próxima rodada`);
    });

    setTimeout(() => this.drawPhase(), 400);
  }

  // ========================================================
  // COMBATE
  // ========================================================

  resolverCombate(cartaJ: Card, cartaE: Card) {
    const tipoJ = cartaJ.tipo;
    const tipoE = cartaE.tipo;
    let jogadorVenceu = false;
    let empate = false;

    if (tipoJ === tipoE) {
      let valorJ = 0, valorE = 0;
      if (tipoJ === 'força')      { valorJ = cartaJ.strong;       valorE = cartaE.strong; }
      if (tipoJ === 'velocidade') { valorJ = cartaJ.speed;        valorE = cartaE.speed; }
      if (tipoJ === 'magia')      { valorJ = cartaJ.intelligence; valorE = cartaE.intelligence; }

      if (valorJ > valorE) jogadorVenceu = true;
      else if (valorJ === valorE) empate = true;
      this.mensagemBatalha = empate
        ? '⚖️ EMPATE!'
        : (jogadorVenceu
            ? `🏆 Vitória! ${tipoJ} (${valorJ}) > (${valorE})`
            : `💀 Derrota! ${tipoE} (${valorE}) > (${valorJ})`);
    } else {
      const vence = (tipoJ === 'velocidade' && tipoE === 'magia') ||
                    (tipoJ === 'magia'      && tipoE === 'força')  ||
                    (tipoJ === 'força'      && tipoE === 'velocidade');
      jogadorVenceu = vence;
      this.mensagemBatalha = vence
        ? `🏆 VENCEU! ${tipoJ} bate ${tipoE}`
        : `💀 PERDEU! ${tipoE} bate ${tipoJ}`;
    }

    if (!empate) {
      jogadorVenceu ? this.vidaInimigo -= this.DANO_DERROTA : this.vidaJogador -= this.DANO_DERROTA;
    }
  }

  checkFimDeJogo() {
    if (this.vidaInimigo <= 0) {
      this.vidaInimigo = 0;
      this.mensagemBatalha = '🏆 VITÓRIA SUPREMA!';
      this.jogoTerminou = true;
      this.log(`FIM: Jogador VENCEU na rodada ${this.rodadaAtual}`);
    }
    if (this.vidaJogador <= 0) {
      this.vidaJogador = 0;
      this.mensagemBatalha = '💀 GAME OVER...';
      this.jogoTerminou = true;
      this.log(`FIM: Jogador PERDEU na rodada ${this.rodadaAtual}`);
    }
  }

  // ========================================================
  // DECK E MÃO
  // ========================================================

  gerarDeckBase(): Card[] {
    const deck: Card[] = [
      { nome: 'Cavaleiro Real',    descricao: 'Esmaga ossos.',         strong: 8,  speed: 5,  intelligence: 3,  imagemUrl: 'cards/cavaleira-real.png', tipo: 'força' },
      { nome: 'Arqueira Veloz',    descricao: 'Intocável.',            strong: 4,  speed: 9,  intelligence: 5,  imagemUrl: 'cards/arqueira-veloz.png', tipo: 'velocidade' },
      { nome: 'Mago Sombrio',      descricao: 'Feitiço mortal.',       strong: 2,  speed: 4,  intelligence: 10, imagemUrl: 'cards/mago-sombrio.png', tipo: 'magia' },
      { nome: 'Dragão Roxo',   descricao: 'Fúria pura.',           strong: 10, speed: 6,  intelligence: 2,  imagemUrl: 'cards/dragao-roxo.png', tipo: 'força' },
      { nome: 'Lix',     descricao: 'Rápido e sujo.',        strong: 3,  speed: 8,  intelligence: 4,  imagemUrl: 'cards/lix.png', tipo: 'velocidade' },
      { nome: 'Brok',     descricao: 'Pequeno e Monstro.',    strong: 9,  speed: 4,  intelligence: 3,  imagemUrl: 'cards/chapeu-vermelho.png', tipo: 'força' },
      { nome: 'Diabo das Sombras', descricao: 'Pacto de sangue.',      strong: 8,  speed: 7,  intelligence: 5,  imagemUrl: 'cards/zenen.png', tipo: 'força' },
      { nome: 'Sapo Monge',        descricao: 'O caminho do charco.',  strong: 5,  speed: 8,  intelligence: 6,  imagemUrl: 'cards/sapo-monge.png', tipo: 'velocidade' },
      { nome: 'Lib, a Ligeira',    descricao: 'Bater de asas sônico.', strong: 2,  speed: 10, intelligence: 2,  imagemUrl: 'cards/lib.png', tipo: 'velocidade' },
      { nome: 'Nante, A Mística',    descricao: 'Olhar amaldiçoado.',    strong: 3,  speed: 5,  intelligence: 9,  imagemUrl: 'cards/nante.png', tipo: 'magia' },
      { nome: 'Água Viva Astral',  descricao: 'Choque etéreo.',        strong: 1,  speed: 3,  intelligence: 9,  imagemUrl: 'cards/aguaviva-astral.png', tipo: 'magia' },
      { nome: 'Coruja Sábia',      descricao: 'Vê tudo.',              strong: 2,  speed: 6,  intelligence: 8,  imagemUrl: 'cards/coruja-sabia.png', tipo: 'magia' },
      { nome: 'Soncericyan',       descricao: 'Ilusão fatal.',         strong: 4,  speed: 4,  intelligence: 9,  imagemUrl: 'cards/soncericyan.png', tipo: 'magia' },
      { nome: 'Lyan',           descricao: 'A Maga.',               strong: 2,  speed: 4,  intelligence: 10, imagemUrl: 'cards/lyan.png', tipo: 'magia' },
      { nome: 'Bomb', descricao: 'Fúria da gigante verde.', strong: 10, speed: 6, intelligence: 2, imagemUrl: 'cards/bomb.png', tipo: 'força' },
      { nome: 'Zunis', descricao: 'Delinquente dos mares.', strong: 5, speed: 4, intelligence: 7, imagemUrl: 'cards/zunis.png', tipo: 'inteligência' },
      { nome: 'Lucius', descricao: 'O conhecimento é poder.', strong: 2, speed: 5, intelligence: 8, imagemUrl: 'cards/lucius.png', tipo: 'magia' },
      { nome: 'Dylan', descricao: 'O lobo guerreiro.', strong: 7, speed: 6, intelligence: 3, imagemUrl: 'cards/dylan.png', tipo: 'força' },
      { nome: 'Siegfried', descricao: 'O Caçador', strong: 7, speed: 9, intelligence: 5, imagemUrl: 'cards/siegfried.png', tipo: 'speed' },
      { nome: 'Bramstep', descricao: 'O Constructor BattleMage', strong: 7, speed: 3, intelligence: 8, imagemUrl: 'cards/bramstep.png', tipo: 'magia' },
      { nome: 'Thorn', descricao: 'O Exilado', strong: 7, speed: 8, intelligence: 5, imagemUrl: 'cards/thorn.png', tipo: 'speed' },
      { nome: 'Pamine', descricao: 'A Fada Preguiçosa', strong: 2, speed: 6, intelligence: 9, imagemUrl: 'cards/pamine.png', tipo: 'magia' },
    ];

    deck.push({ ...deck[5] }, { ...deck[1] }, { ...deck[7] }, { ...deck[2] }, { ...deck[9] });
    while (deck.length < this.TAMANHO_MINIMO_DECK) {
      deck.push({ ...deck[deck.length % 14] });
    }
    return deck;
  }

  embaralhar(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  comprarCarta(quem: 'jogador' | 'oponente'): boolean {
    if (quem === 'jogador') {
      if (this.deckJogador.length === 0) { this.deckJogador = this.gerarDeckBase(); this.embaralhar(this.deckJogador); }
      const carta = this.puxarDoTopo(this.deckJogador);
      if (carta) { this.maoDoJogador.push(carta); return true; }
    } else {
      if (this.deckOponente.length === 0) { this.deckOponente = this.gerarDeckBase(); this.embaralhar(this.deckOponente); }
      const carta = this.puxarDoTopo(this.deckOponente);
      if (carta) { this.maoDoOponente.push(carta); return true; }
    }
    return false;
  }

  puxarDoTopo(deck: Card[]): Card | undefined { return deck.shift(); }

  removerDaMao(mao: Card[], carta: Card) {
    const index = mao.indexOf(carta);
    if (index > -1) mao.splice(index, 1);
  }

  private limparTimerJogador() {
    if (this.timerJogador) { clearTimeout(this.timerJogador); this.timerJogador = null; }
  }

  private limparTimers() {
    this.limparTimerJogador();
    if (this.timerIA) { clearTimeout(this.timerIA); this.timerIA = null; }
  }

  voltarParaLogin() {
    this.limparTimers();
    this.jogoIniciado = false;
    this.nomeJogador = '';
    this.classeSelecionada = null;
  }

  reiniciar() {
    this.limparTimers();
    this.iniciarPartida();
  }
}