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
  faseAtual: 'draw' | 'magic' | 'main' | 'battle' | 'end' = 'draw';
  cartaJogadorSelecionada: Card | null = null;
  cartaInimigoSelecionada: Card | null = null;
  deckJogador: Card[] = [];
  deckOponente: Card[] = [];
  maoDoJogador: Card[] = [];
  maoDoOponente: Card[] = [];

  espelhoAtivo = false;
  dobrarAtributoAtivo = false;
  sabotagemAtiva = false;

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

  private atualizar(fn: () => void) {
    fn();
    this.cdr.detectChanges();
  }

  get cartasMagicasNaMao(): Card[] {
    return this.maoDoJogador.filter(c => c.tipo === 'magica');
  }

  get cartasMonstroNaMao(): Card[] {
    return this.maoDoJogador.filter(c => c.tipo !== 'magica');
  }

  // ========================================================
  // LOGIN
  // ========================================================
  classeSelecionada: any = null;
  classesDisponiveis = [
    { id: 'guerreiro', nome: 'Guerreiro', icone: '⚔️', desc: 'Alta Defesa, Força Bruta' },
    { id: 'mago',      nome: 'Mago',      icone: '🔮', desc: 'Dano Mágico, Estratégia' },
    { id: 'ladino',    nome: 'Ladino',    icone: '🗡️', desc: 'Velocidade, Críticos' }
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
    this.espelhoAtivo = false;
    this.dobrarAtributoAtivo = false;
    this.sabotagemAtiva = false;
    this.debugLog = [];
    this.rodadaAtual = 0;

    this.deckJogador = this.gerarDeckBase();
    this.deckOponente = this.gerarDeckOponente();
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
  // FASES
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

    setTimeout(() => this.magicPhase(), 500);
  }

  magicPhase() {
    const temMagia = this.cartasMagicasNaMao.length > 0;

    if (!temMagia) {
      this.mainPhase();
      return;
    }

    this.atualizar(() => {
      this.faseAtual = 'magic';
      this.mensagemBatalha = '✨ Magic Phase — use uma carta mágica ou pule! (5s)';
      this.log(`MAGIC: Jogador tem ${this.cartasMagicasNaMao.length} carta(s) mágica(s)`);
    });

    // Auto-skip após 5s
    this.timerJogador = setTimeout(() => {
      if (this.faseAtual === 'magic') {
        this.log('MAGIC: Auto-pulado');
        this.mainPhase();
      }
    }, 5000);
  }

  usarCartaMagica(carta: Card) {
    if (this.faseAtual !== 'magic') return;
    this.limparTimerJogador();

    this.atualizar(() => {
      switch (carta.efeito) {
        case 'cura':
          this.vidaJogador = Math.min(this.VIDA_INICIAL, this.vidaJogador + 10);
          this.mensagemBatalha = `💚 Cura! +10 HP → ${this.vidaJogador} HP`;
          this.log(`MAGIC: Cura → Vida: ${this.vidaJogador}`);
          break;
        case 'cura maior':
          this.vidaJogador = Math.min(this.VIDA_INICIAL, this.vidaJogador + 20);
          this.mensagemBatalha = `💚 Cura! +20 HP → ${this.vidaJogador} HP`;
          this.log(`MAGIC: Cura → Vida: ${this.vidaJogador}`);
          break;  
        case 'espelho':
          this.espelhoAtivo = true;
          if (this.maoDoOponente.length === 0) this.comprarCarta('oponente');
          const idx = Math.floor(Math.random() * this.maoDoOponente.length);
          this.cartaInimigoSelecionada = this.maoDoOponente[idx];
          this.mensagemBatalha = `🪞 Espelho! Oponente vai usar: ${this.cartaInimigoSelecionada.nome}`;
          this.log(`MAGIC: Espelho → Oponente: ${this.cartaInimigoSelecionada.nome}`);
          break;
        case 'dobro':
          this.dobrarAtributoAtivo = true;
          this.mensagemBatalha = `⚡ Dobro ativado! Seu atributo principal será dobrado!`;
          this.log('MAGIC: Dobro ativado');
          break;
        case 'burn':
          this.vidaInimigo = Math.max(0, this.vidaInimigo - 10);
          this.mensagemBatalha = `🔥 Burn! Oponente perde 10 HP → ${this.vidaInimigo} HP`;
          this.log(`MAGIC: Burn → Vida Inimigo: ${this.vidaInimigo}`);
          break;
        case 'sabotagem':
          this.sabotagemAtiva = true;
          this.mensagemBatalha = `💀 Sabotagem! Oponente ficará mais fraco!`;
          this.log('MAGIC: Sabotagem ativada');
          break;
      }
      this.removerDaMao(this.maoDoJogador, carta);
    });

    setTimeout(() => this.mainPhase(), 900);
  }

  pularMagia() {
    this.limparTimerJogador();
    this.log('MAGIC: Pulado');
    this.mainPhase();
  }

  mainPhase() {
  this.atualizar(() => {
    this.faseAtual = 'main';
    this.cartaJogadorSelecionada = null;
    if (!this.espelhoAtivo) this.cartaInimigoSelecionada = null;
    this.log(`MAIN: Aguardando jogador`);
  });

  // Verifica imediatamente se jogador tem monstros
  const monstros = this.cartasMonstroNaMao;
  if (monstros.length === 0) {
    this.atualizar(() => {
      this.mensagemBatalha = '💀 Sem monstros na mão! Você sofreu dano!';
      this.log('MAIN: Jogador sem monstros → derrota automática da rodada');
      this.vidaJogador -= this.DANO_DERROTA;
      this.checkFimDeJogo();
    });
    if (!this.jogoTerminou) {
      setTimeout(() => this.endPhase(), 1500);
    }
    return;
  }

  this.atualizar(() => {
    this.mensagemBatalha = this.espelhoAtivo
      ? `🪞 Espelho ativo! Oponente usará ${this.cartaInimigoSelecionada?.nome}. Escolha sua carta!`
      : '⚔️ Main Phase — escolha sua carta!';
  });

  // Auto-select do jogador após 30s
  this.timerJogador = setTimeout(() => {
    this.atualizar(() => {
      if (!this.cartaJogadorSelecionada && this.faseAtual === 'main') {
        const m = this.cartasMonstroNaMao;
        const index = Math.floor(Math.random() * m.length);
        this.cartaJogadorSelecionada = m[index];
        this.mensagemBatalha = `⏱️ Auto: ${this.cartaJogadorSelecionada.nome}`;
        this.log(`MAIN: Auto-selecionado → ${this.cartaJogadorSelecionada.nome}`);
      }
    });
    this.verificarProntoParaBatalha();
  }, this.TEMPO_ESCOLHA_MS);

  // IA escolhe após 1s (se espelho não ativou)
  if (!this.espelhoAtivo) {
    this.timerIA = setTimeout(() => {
      this.atualizar(() => {
        if (this.faseAtual === 'main') {
          if (this.maoDoOponente.length === 0) this.comprarCarta('oponente');
          const index = Math.floor(Math.random() * this.maoDoOponente.length);
          this.cartaInimigoSelecionada = this.maoDoOponente[index];
          this.log(`MAIN: IA escolheu → ${this.cartaInimigoSelecionada.nome}`);
        }
      });
      this.verificarProntoParaBatalha();
    }, this.TEMPO_IA_MS);
  } else {
    setTimeout(() => this.verificarProntoParaBatalha(), 100);
  }
}

  selecionarCarta(carta: Card) {
    if (this.jogoTerminou || this.faseAtual !== 'main') return;
    if (this.cartaJogadorSelecionada) return;
    if (carta.tipo === 'magica') return;

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
      const temmonstro = this.cartaJogadorSelecionada && this.cartaInimigoSelecionada && this.maoDoJogador.some(carta => carta.tipo !== 'magica');


      // Derrota caso não tenha monstro
      if (!temmonstro) {
        console.log('Suas defesas falharam! Você perdeu 10 HP.');
        this.vidaJogador = Math.max(0, this.vidaJogador - this.DANO_DERROTA);
        this.mensagemBatalha = '💀 Falha! Carta inválida. Você perdeu 10 HP.';
        this.checkFimDeJogo();
        this.log('BATTLE: Falha → Carta inválida');
        return;
      }
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
      this.espelhoAtivo = false;
      this.dobrarAtributoAtivo = false;
      this.sabotagemAtiva = false;
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

      if (this.dobrarAtributoAtivo) valorJ *= 2;
      if (this.sabotagemAtiva) valorE = Math.floor(valorE / 2);

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

    this.dobrarAtributoAtivo = false;
    this.sabotagemAtiva = false;
    this.espelhoAtivo = false;

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
      { nome: 'Cavaleiro Real',    descricao: 'Esmaga ossos.',              strong: 8,  speed: 5,  intelligence: 3,  imagemUrl: 'cards/cavaleira-real.png',  tipo: 'força' },
      { nome: 'Arqueira Veloz',    descricao: 'Intocável.',                 strong: 4,  speed: 9,  intelligence: 5,  imagemUrl: 'cards/arqueira-veloz.png',  tipo: 'velocidade' },
      { nome: 'Mago Sombrio',      descricao: 'Feitiço mortal.',            strong: 2,  speed: 4,  intelligence: 10, imagemUrl: 'cards/mago-sombrio.png',    tipo: 'magia' },
      { nome: 'Dragão Roxo',       descricao: 'Fúria pura.',                strong: 10, speed: 6,  intelligence: 2,  imagemUrl: 'cards/dragao-roxo.png',     tipo: 'força' },
      { nome: 'Lix',               descricao: 'Rápido e sujo.',             strong: 3,  speed: 8,  intelligence: 4,  imagemUrl: 'cards/Lix.png',             tipo: 'velocidade' },
      { nome: 'Brok',              descricao: 'Pequeno e Monstro.',         strong: 9,  speed: 4,  intelligence: 3,  imagemUrl: 'cards/chapeu-vermelho.png', tipo: 'força' },
      { nome: 'Diabo das Sombras', descricao: 'Pacto de sangue.',           strong: 8,  speed: 7,  intelligence: 5,  imagemUrl: 'cards/zenen.png',           tipo: 'força' },
      { nome: 'Sapo Monge',        descricao: 'O caminho do charco.',       strong: 5,  speed: 8,  intelligence: 6,  imagemUrl: 'cards/sapo-monge.png',      tipo: 'velocidade' },
      { nome: 'Lib, a Ligeira',    descricao: 'Bater de asas sônico.',      strong: 2,  speed: 10, intelligence: 2,  imagemUrl: 'cards/lib.png',             tipo: 'velocidade' },
      { nome: 'Nante, A Mística',  descricao: 'Olhar amaldiçoado.',         strong: 3,  speed: 5,  intelligence: 9,  imagemUrl: 'cards/nante.png',           tipo: 'magia' },
      { nome: 'Água Viva Astral',  descricao: 'Choque etéreo.',             strong: 1,  speed: 3,  intelligence: 9,  imagemUrl: 'cards/aguaviva-astral.png', tipo: 'magia' },
      { nome: 'Coruja Sábia',      descricao: 'Vê tudo.',                   strong: 2,  speed: 6,  intelligence: 8,  imagemUrl: 'cards/coruja-sabia.png',    tipo: 'magia' },
      { nome: 'Soncericyan',       descricao: 'Ilusão fatal.',              strong: 4,  speed: 4,  intelligence: 9,  imagemUrl: 'cards/soncericyan.png',     tipo: 'magia' },
      { nome: 'Lyan',              descricao: 'A Maga.',                    strong: 2,  speed: 4,  intelligence: 10, imagemUrl: 'cards/lyan.png',            tipo: 'magia' },
      { nome: 'Bomb',              descricao: 'Fúria da gigante verde.',    strong: 10, speed: 6,  intelligence: 2,  imagemUrl: 'cards/bomb.png',            tipo: 'força' },
      { nome: 'Zunis',             descricao: 'Delinquente dos mares.',     strong: 5,  speed: 4,  intelligence: 7,  imagemUrl: 'cards/zunis.png',           tipo: 'magia' },
      { nome: 'Lucius',            descricao: 'O conhecimento é poder.',    strong: 2,  speed: 5,  intelligence: 8,  imagemUrl: 'cards/lucius.png',          tipo: 'magia' },
      { nome: 'Dylan',             descricao: 'O lobo guerreiro.',          strong: 7,  speed: 6,  intelligence: 3,  imagemUrl: 'cards/dylan.png',           tipo: 'força' },
      { nome: 'Siegfried',         descricao: 'O Caçador.',                 strong: 7,  speed: 9,  intelligence: 5,  imagemUrl: 'cards/siegfried.png',       tipo: 'velocidade' },
      { nome: 'Bramstep',          descricao: 'O Constructor BattleMage.',  strong: 7,  speed: 3,  intelligence: 8,  imagemUrl: 'cards/bramstep.png',        tipo: 'magia' },
      { nome: 'Thorn',             descricao: 'O Exilado.',                 strong: 7,  speed: 8,  intelligence: 5,  imagemUrl: 'cards/thorn.png',           tipo: 'velocidade' },
      { nome: 'Pamine',            descricao: 'A Fada Preguiçosa.',         strong: 2,  speed: 6,  intelligence: 9,  imagemUrl: 'cards/pamine.png',          tipo: 'magia' },
      { nome: 'Thigas',            descricao: 'O Vilão.',                   strong: 10,  speed: 10,  intelligence: 10,  imagemUrl: 'cards/thigas.png',          tipo: 'magia' },
      { nome: 'Fane',             descricao: 'A Ladra.',                    strong: 3,  speed: 8,  intelligence: 5,  imagemUrl: 'cards/fane.png',           tipo: 'velocidade' },
  

      // Cartas Mágicas
      { nome: 'Poção de Cura',     descricao: 'Recupera 10 HP.',               strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'cura' },
      { nome: 'Poção de Cura Maior', descricao: 'Recupera 20 HP.',               strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'cura maior' },
      { nome: 'Olho de Espelho',   descricao: 'Revela a carta do oponente.',   strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'espelho' },
      { nome: 'Fúria Dobrada',     descricao: 'Dobra seu atributo principal.', strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'dobro' },
      { nome: 'Sabotagem Arcana',  descricao: 'Enfraquece o oponente.',        strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'sabotagem' },
      { nome: 'Burn',              descricao: 'Causa 10 de dano ao oponente.', strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'burn' }
    ];

    while (deck.length < this.TAMANHO_MINIMO_DECK) {
      deck.push({ ...deck[deck.length % 22] });
    }
    return deck;
  }

  gerarDeckOponente(): Card[] {
    return this.gerarDeckBase().filter(c => c.tipo !== 'magica');
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
      if (this.deckOponente.length === 0) { this.deckOponente = this.gerarDeckOponente(); this.embaralhar(this.deckOponente); }
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

  surrender() {
  this.limparTimers();
  this.atualizar(() => {
    this.vidaJogador = 0;
    this.mensagemBatalha = '🏳️ Você se rendeu...';
    this.jogoTerminou = true;
    this.log('FIM: Jogador se rendeu');
  });
}
}