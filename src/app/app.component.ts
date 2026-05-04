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
      { nome: 'Cavaleiro Real',    descricao: 'Esmaga ossos.',         strong: 8,  speed: 5,  intelligence: 3,  imagemUrl: 'https://i.pinimg.com/736x/52/71/da/5271da77ea6d3a37a8236bcbd912678f.jpg', tipo: 'força' },
      { nome: 'Arqueira Veloz',    descricao: 'Intocável.',            strong: 4,  speed: 9,  intelligence: 5,  imagemUrl: 'https://i.pinimg.com/736x/4c/f7/24/4cf72418bab3f83cd0d509296d65734d.jpg', tipo: 'velocidade' },
      { nome: 'Mago Sombrio',      descricao: 'Feitiço mortal.',       strong: 2,  speed: 4,  intelligence: 10, imagemUrl: 'https://i.pinimg.com/736x/2d/26/2a/2d262afffcf387217d0a71d8bc9e907c.jpg', tipo: 'magia' },
      { nome: 'Dragão Vermelho',   descricao: 'Fúria pura.',           strong: 10, speed: 6,  intelligence: 2,  imagemUrl: 'https://i.pinimg.com/736x/8b/cb/28/8bcb28564bee88cf7a164ef26180da12.jpg', tipo: 'força' },
      { nome: 'Goblin Ladino',     descricao: 'Rápido e sujo.',        strong: 3,  speed: 8,  intelligence: 4,  imagemUrl: 'https://i.pinimg.com/736x/60/6c/95/606c95f5267f8080912e1b36744ede36.jpg', tipo: 'velocidade' },
      { nome: 'Gnomo Maromba',     descricao: 'Pequeno e Monstro.',    strong: 9,  speed: 4,  intelligence: 3,  imagemUrl: 'https://i.pinimg.com/736x/91/a3/5c/91a35c59c134769e4c986143f277cbe9.jpg', tipo: 'força' },
      { nome: 'Diabo das Sombras', descricao: 'Pacto de sangue.',      strong: 8,  speed: 7,  intelligence: 5,  imagemUrl: 'https://i.pinimg.com/1200x/0d/39/f5/0d39f5a0abe78c3bf7b9022e684e5faa.jpg', tipo: 'força' },
      { nome: 'Sapo Monge',        descricao: 'O caminho do charco.',  strong: 5,  speed: 8,  intelligence: 6,  imagemUrl: 'https://i.pinimg.com/1200x/b6/81/b7/b681b770b3ef3f8198ff412a687091f9.jpg', tipo: 'velocidade' },
      { nome: 'Lib, a Ligeira',    descricao: 'Bater de asas sônico.', strong: 2,  speed: 10, intelligence: 2,  imagemUrl: 'https://i.pinimg.com/736x/b3/9c/42/b39c42d011ef2f1a0130f45281722a1f.jpg', tipo: 'velocidade' },
      { nome: 'Black Eye Girl',    descricao: 'Olhar amaldiçoado.',    strong: 3,  speed: 5,  intelligence: 9,  imagemUrl: 'https://i.pinimg.com/736x/bd/9d/82/bd9d8263e6604ef7f5eba3ae259e2e19.jpg', tipo: 'magia' },
      { nome: 'Água Viva Astral',  descricao: 'Choque etéreo.',        strong: 1,  speed: 3,  intelligence: 9,  imagemUrl: 'https://i.pinimg.com/1200x/cb/de/40/cbde40f83aa1528aaef5ff3405faf5a6.jpg', tipo: 'magia' },
      { nome: 'Coruja Sábia',      descricao: 'Vê tudo.',              strong: 2,  speed: 6,  intelligence: 8,  imagemUrl: 'https://i.pinimg.com/1200x/dd/13/a0/dd13a0e6f097517cb7466673337553c0.jpg', tipo: 'magia' },
      { nome: 'Soncericyan',       descricao: 'Ilusão fatal.',         strong: 4,  speed: 4,  intelligence: 9,  imagemUrl: 'https://i.pinimg.com/736x/98/58/94/985894fd3c01473c1687232ae346afb8.jpg', tipo: 'magia' },
      { nome: 'Frieren',           descricao: 'A Maga.',               strong: 2,  speed: 4,  intelligence: 10, imagemUrl: 'https://i.pinimg.com/736x/3e/a2/77/3ea27726a1525cd55c5754afae791ac6.jpg', tipo: 'magia' },
      { nome: 'Bomb', descricao: 'Fúria da gigante verde.', strong: 10, speed: 6, intelligence: 2, imagemUrl: 'cards/bomb.png', tipo: 'força' },
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