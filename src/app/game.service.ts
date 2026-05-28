import { Injectable, ChangeDetectorRef } from '@angular/core';
import { Card } from './card/card';
import { DeckService } from './deck.service';

export type FaseAtual = 'draw' | 'magic' | 'main' | 'battle' | 'end';

@Injectable({ providedIn: 'root' })
export class GameService {

  readonly VIDA_INICIAL = 60;
  readonly DANO_DERROTA = 10;
  readonly TEMPO_ESCOLHA_MS = 30000;
  readonly TEMPO_IA_MS = 1000;

  // Estado do jogo
  jogoIniciado = false;
  nomeJogador = '';
  classeSelecionada: any = null;
  vidaJogador = this.VIDA_INICIAL;
  vidaInimigo = this.VIDA_INICIAL;
  mensagemBatalha = '';
  jogoTerminou = false;
  faseAtual: FaseAtual = 'draw';

  // Cartas
  cartaJogadorSelecionada: Card | null = null;
  cartaInimigoSelecionada: Card | null = null;
  deckJogador: Card[] = [];
  deckOponente: Card[] = [];
  maoDoJogador: Card[] = [];
  maoDoOponente: Card[] = [];

  // Efeitos mágicos
  espelhoAtivo = false;
  dobrarAtributoAtivo = false;
  sabotagemAtiva = false;

  // Debug
  mostrarDebug = false;
  debugLog: string[] = [];
  rodadaAtual = 0;

  private timerJogador: ReturnType<typeof setTimeout> | null = null;
  private timerIA: ReturnType<typeof setTimeout> | null = null;
  private cdr!: ChangeDetectorRef;

  constructor(private deckService: DeckService) {}

  setCdr(cdr: ChangeDetectorRef) {
    this.cdr = cdr;
  }

  // ========================================================
  // GETTERS
  // ========================================================

  get cartasMagicasNaMao(): Card[] {
    return this.maoDoJogador.filter(c => c.tipo === 'magica');
  }

  get cartasMonstroNaMao(): Card[] {
    return this.maoDoJogador.filter(c => c.tipo !== 'magica');
  }

  // ========================================================
  // HELPERS
  // ========================================================

  log(msg: string) {
    const ts = new Date().toLocaleTimeString('pt-BR');
    this.debugLog.unshift(`[${ts}] ${msg}`);
    if (this.debugLog.length > 60) this.debugLog.pop();
  }

  atualizar(fn: () => void) {
    fn();
    this.cdr?.detectChanges();
  }

  // ========================================================
  // PARTIDA
  // ========================================================

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

    this.deckJogador = this.deckService.gerarDeckBase();
    this.deckOponente = this.deckService.gerarDeckOponente();
    this.deckService.embaralhar(this.deckJogador);
    this.deckService.embaralhar(this.deckOponente);
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

  voltarParaLogin() {
    this.limparTimers();
    this.jogoIniciado = false;
    this.nomeJogador = '';
    this.classeSelecionada = null;
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
          this.mensagemBatalha = `💚 Cura Maior! +20 HP → ${this.vidaJogador} HP`;
          this.log(`MAGIC: Cura Maior → Vida: ${this.vidaJogador}`);
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

    const monstros = this.cartasMonstroNaMao;
    if (monstros.length === 0) {
      this.atualizar(() => {
        this.mensagemBatalha = '💀 Sem monstros na mão! Você sofreu dano!';
        this.log('MAIN: Jogador sem monstros → derrota automática da rodada');
        this.vidaJogador -= this.DANO_DERROTA;
        this.checkFimDeJogo();
      });
      if (!this.jogoTerminou) setTimeout(() => this.endPhase(), 1500);
      return;
    }

    this.atualizar(() => {
      this.mensagemBatalha = this.espelhoAtivo
        ? `🪞 Espelho ativo! Oponente usará ${this.cartaInimigoSelecionada?.nome}. Escolha sua carta!`
        : '⚔️ Main Phase — escolha sua carta!';
    });

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

  verificarProntoParaBatalha() {
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

    if (!this.jogoTerminou) setTimeout(() => this.endPhase(), 1500);
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
        : jogadorVenceu
          ? `🏆 Vitória! ${tipoJ} (${valorJ}) > (${valorE})`
          : `💀 Derrota! ${tipoE} (${valorE}) > (${valorJ})`;
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
      this.mensagemBatalha = '⚔️ Os fracos são esquecidos. Você não será.';
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

  comprarCarta(quem: 'jogador' | 'oponente'): boolean {
    if (quem === 'jogador') {
      if (this.deckJogador.length === 0) {
        this.deckJogador = this.deckService.gerarDeckBase();
        this.deckService.embaralhar(this.deckJogador);
      }
      const carta = this.deckService.puxarDoTopo(this.deckJogador);
      if (carta) { this.maoDoJogador.push(carta); return true; }
    } else {
      if (this.deckOponente.length === 0) {
        this.deckOponente = this.deckService.gerarDeckOponente();
        this.deckService.embaralhar(this.deckOponente);
      }
      const carta = this.deckService.puxarDoTopo(this.deckOponente);
      if (carta) { this.maoDoOponente.push(carta); return true; }
    }
    return false;
  }

  removerDaMao(mao: Card[], carta: Card) {
    const index = mao.indexOf(carta);
    if (index > -1) mao.splice(index, 1);
  }

  limparTimerJogador() {
    if (this.timerJogador) { clearTimeout(this.timerJogador); this.timerJogador = null; }
  }

  limparTimers() {
    this.limparTimerJogador();
    if (this.timerIA) { clearTimeout(this.timerIA); this.timerIA = null; }
  }
}