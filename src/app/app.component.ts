import { Component } from '@angular/core';
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
  jogoIniciado = false;
  nomeJogador = '';
  
  vidaJogador = 50;
  vidaInimigo = 50;
  
  mensagemBatalha = 'A batalha começou! Sua vez.';
  jogoTerminou = false;
  
  cartaInimigoSelecionada: Card | null = null; 

  // === VARIÁVEIS DE DECK E MÃO ===
  deckJogador: Card[] = [];
  deckOponente: Card[] = [];
  
  maoDoJogador: Card[] = [];
  maoDoOponente: Card[] = [];

  // ========================================================
  // 1. CONFIGURAÇÃO INICIAL (LOGIN E CLASSES)
  // ========================================================
  
  classeSelecionada: any = null;
  
  // Adicionei o atributo 'vida' em cada classe para fazer diferença no jogo
  classesDisponiveis = [
    { id: 'guerreiro', nome: 'Guerreiro', icone: '⚔️', desc: 'Alta Vida, Força Bruta', vida: 120 },
    { id: 'mago', nome: 'Mago', icone: '🔮', desc: 'Dano Mágico, Estratégia', vida: 80 },
    { id: 'ladino', nome: 'Ladino', icone: '⚡', desc: 'Velocidade, Críticos', vida: 90 }
  ];

  selecionarClasse(classe: any) {
    // LÓGICA DE TOGGLE: Se clicar no que já está, zera (null). Se for novo, troca.
    if (this.classeSelecionada === classe) {
      this.classeSelecionada = null;
    } else {
      this.classeSelecionada = classe;
    }
  }

  entrarNoJogo(nome: string) {
    if (nome.trim().length > 0 && this.classeSelecionada) {
      this.nomeJogador = nome.toUpperCase(); 
      this.iniciarPartida(); // CORRIGIDO: O nome da função correta é esta
    } else {
      alert('Por favor, digite seu nome e escolha uma classe!');
    }
  }

iniciarPartida() {
    this.jogoIniciado = true;
    
    // AQUI ESTAVA O PERIGO: Usamos a vida da classe ou 100 como segurança
    this.vidaJogador = this.classeSelecionada ? this.classeSelecionada.vida : 100;
    this.vidaInimigo = 100;
    
    this.jogoTerminou = false;
    this.cartaInimigoSelecionada = null;
    this.mensagemBatalha = "Turno 1: Fase de Compra!";

    // ... (o resto da função continua igual) ...

    // 1. Cria os Decks (18 cartas cada)
    this.deckJogador = this.gerarDeckBase();
    this.deckOponente = this.gerarDeckBase();

    // 2. Embaralha
    this.embaralhar(this.deckJogador);
    this.embaralhar(this.deckOponente);

    // 3. Limpa as mãos
    this.maoDoJogador = [];
    this.maoDoOponente = [];

    // 4. DRAW PHASE INICIAL: Compra 3 cartas para começar
    for (let i = 0; i < 3; i++) {
      this.comprarCarta('jogador');
      this.comprarCarta('oponente');
    }
  }

  // ========================================================
  // 2. SISTEMA DE COMBATE E TURNOS
  // ========================================================

  atacar(cartaJogador: Card) {
    if (this.jogoTerminou) return;

    // --- PASSO 1: Oponente escolhe carta da mão dele ---
    if (this.maoDoOponente.length === 0) {
       // Tenta comprar uma de emergência
       const comprou = this.comprarCarta('oponente');
       if(!comprou) {
          this.mensagemBatalha = "Oponente sem cartas! Vitória por W.O.";
          this.jogoTerminou = true;
          return;
       }
    }

    const indexInimigo = Math.floor(Math.random() * this.maoDoOponente.length);
    const cartaInimigo = this.maoDoOponente[indexInimigo];
    this.cartaInimigoSelecionada = cartaInimigo;

    // --- PASSO 2: Resolução do Combate ---
    this.resolverCombate(cartaJogador, cartaInimigo);

    // --- PASSO 3: Descarte ---
    this.removerDaMao(this.maoDoJogador, cartaJogador);
    this.removerDaMao(this.maoDoOponente, cartaInimigo);

    // --- PASSO 4: Verificar se alguém morreu ---
    this.checkFimDeJogo();
    if (this.jogoTerminou) return;

    // --- PASSO 5: FASE DE COMPRA AUTOMÁTICA ---
    setTimeout(() => {
      this.faseDeCompra();
    }, 1500);
  }

  faseDeCompra() {
    this.cartaInimigoSelecionada = null; // Esconde a carta do inimigo
    
    // Tenta comprar 1 carta para VOCÊ
    const comprouJ = this.comprarCarta('jogador');
    
    // Tenta comprar 1 carta para o INIMIGO
    const comprouO = this.comprarCarta('oponente');

    if (comprouJ) {
      this.mensagemBatalha = "Sua vez! (Nova carta comprada)";
    } else {
      this.mensagemBatalha = "Recarregando Deck..."; 
    }

    // Se mesmo tentando recarregar o deck der erro (muito raro com a nova logica)
    if (!comprouJ && this.maoDoJogador.length === 0) {
        this.mensagemBatalha = "Sem cartas! Você perdeu por fadiga.";
        this.jogoTerminou = true;
    }
  }

  // ========================================================
  // 3. LÓGICA AUXILIAR
  // ========================================================

  gerarDeckBase(): Card[] {
    const deck: Card[] = [
      // === AS CLÁSSICAS ===
      { nome: 'Cavaleiro Real', descricao: 'Esmaga ossos.', strong: 8, speed: 5, intelligence: 3, imagemUrl: 'https://i.pinimg.com/736x/52/71/da/5271da77ea6d3a37a8236bcbd912678f.jpg', tipo: 'força' },
      { nome: 'Arqueira Veloz', descricao: 'Intocável.', strong: 4, speed: 9, intelligence: 5, imagemUrl: 'https://i.pinimg.com/736x/4c/f7/24/4cf72418bab3f83cd0d509296d65734d.jpg', tipo: 'velocidade' },
      { nome: 'Mago Sombrio', descricao: 'Feitiço mortal.', strong: 2, speed: 4, intelligence: 10, imagemUrl: 'https://i.pinimg.com/736x/2d/26/2a/2d262afffcf387217d0a71d8bc9e907c.jpg', tipo: 'magia' },
      { nome: 'Dragão Vermelho', descricao: 'Fúria pura.', strong: 10, speed: 6, intelligence: 2, imagemUrl: 'https://i.pinimg.com/736x/8b/cb/28/8bcb28564bee88cf7a164ef26180da12.jpg', tipo: 'força' },
      { nome: 'Goblin Ladino', descricao: 'Rápido e sujo.', strong: 3, speed: 8, intelligence: 4, imagemUrl: 'https://i.pinimg.com/736x/60/6c/95/606c95f5267f8080912e1b36744ede36.jpg', tipo: 'velocidade' },

      // === AS NOVAS (FORÇA) ===
      { nome: 'Gnomo Maromba', descricao: 'Pequeno e Monstro.', strong: 9, speed: 4, intelligence: 3, imagemUrl: 'https://i.pinimg.com/736x/91/a3/5c/91a35c59c134769e4c986143f277cbe9.jpg', tipo: 'força' },
      { nome: 'Diabo das Sombras', descricao: 'Pacto de sangue.', strong: 8, speed: 7, intelligence: 5, imagemUrl: 'https://i.pinimg.com/1200x/0d/39/f5/0d39f5a0abe78c3bf7b9022e684e5faa.jpg', tipo: 'força' },

      // === AS NOVAS (VELOCIDADE) ===
      { nome: 'Sapo Monge', descricao: 'O caminho do charco.', strong: 5, speed: 8, intelligence: 6, imagemUrl: 'https://i.pinimg.com/1200x/b6/81/b7/b681b770b3ef3f8198ff412a687091f9.jpg', tipo: 'velocidade' },
      { nome: 'Lib, a Ligeira', descricao: 'Bater de asas sônico.', strong: 2, speed: 10, intelligence: 2, imagemUrl: 'https://i.pinimg.com/736x/b3/9c/42/b39c42d011ef2f1a0130f45281722a1f.jpg', tipo: 'velocidade' },

      // === AS NOVAS (MAGIA) ===
      { nome: 'Black Eye Girl', descricao: 'Olhar amaldiçoado.', strong: 3, speed: 5, intelligence: 9, imagemUrl: 'https://i.pinimg.com/736x/bd/9d/82/bd9d8263e6604ef7f5eba3ae259e2e19.jpg', tipo: 'magia' },
      { nome: 'Água Viva Astral', descricao: 'Choque etéreo.', strong: 1, speed: 3, intelligence: 9, imagemUrl: 'https://i.pinimg.com/1200x/cb/de/40/cbde40f83aa1528aaef5ff3405faf5a6.jpg', tipo: 'magia' },
      { nome: 'Coruja Sábia', descricao: 'Vê tudo.', strong: 2, speed: 6, intelligence: 8, imagemUrl: 'https://i.pinimg.com/1200x/dd/13/a0/dd13a0e6f097517cb7466673337553c0.jpg', tipo: 'magia' },
      { nome: 'Soncericyan', descricao: 'Ilusão fatal.', strong: 4, speed: 4, intelligence: 9, imagemUrl: 'https://i.pinimg.com/736x/98/58/94/985894fd3c01473c1687232ae346afb8.jpg', tipo: 'magia' },
      { nome: 'Frieren', descricao: 'A Maga.', strong: 2, speed: 4, intelligence: 10, imagemUrl: 'https://i.pinimg.com/736x/3e/a2/77/3ea27726a1525cd55c5754afae791ac6.jpg', tipo: 'magia' },
    ];

    // DUPLICATAS PARA FECHAR 18 CARTAS
    deck.push({ ...deck[5] });
    deck.push({ ...deck[1] });
    deck.push({ ...deck[7] });
    deck.push({ ...deck[2] });
    deck.push({ ...deck[9] });

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
      if (this.deckJogador.length === 0) {
        this.deckJogador = this.gerarDeckBase();
        this.embaralhar(this.deckJogador);
      }
      const carta = this.deckJogador.pop();
      if (carta) {
        this.maoDoJogador.push(carta);
        return true; 
      }
    } else {
      if (this.deckOponente.length === 0) {
        this.deckOponente = this.gerarDeckBase();
        this.embaralhar(this.deckOponente);
      }
      const carta = this.deckOponente.pop();
      if (carta) {
        this.maoDoOponente.push(carta);
        return true;
      }
    }
    return false;
  }

  removerDaMao(mao: Card[], cartaParaRemover: Card) {
    const index = mao.indexOf(cartaParaRemover);
    if (index > -1) {
      mao.splice(index, 1);
    }
  }

  resolverCombate(cartaJ: Card, cartaE: Card) {
    const tipoJ = cartaJ.tipo;
    const tipoE = cartaE.tipo;
    let jogadorVenceu = false;
    let empate = false;

    if (tipoJ === tipoE) {
      let valorJ = 0, valorE = 0;
      if (tipoJ === 'força') { valorJ = cartaJ.strong; valorE = cartaE.strong; }
      if (tipoJ === 'velocidade') { valorJ = cartaJ.speed; valorE = cartaE.speed; }
      if (tipoJ === 'magia') { valorJ = cartaJ.intelligence; valorE = cartaE.intelligence; }
      
      if (valorJ > valorE) jogadorVenceu = true;
      else if (valorJ < valorE) jogadorVenceu = false;
      else empate = true;
      this.mensagemBatalha = empate ? "EMPATE!" : (jogadorVenceu ? "Vitória no poder!" : "Derrota no poder!");
    } else {
      if ((tipoJ === 'velocidade' && tipoE === 'magia') || (tipoJ === 'magia' && tipoE === 'força') || (tipoJ === 'força' && tipoE === 'velocidade')) {
        jogadorVenceu = true;
        this.mensagemBatalha = `VENCEU! ${tipoJ} bate ${tipoE}`;
      } else {
        jogadorVenceu = false;
        this.mensagemBatalha = `PERDEU! ${tipoE} bate ${tipoJ}`;
      }
    }

    if (!empate) {
      jogadorVenceu ? this.vidaInimigo -= 30 : this.vidaJogador -= 30;
    }
  }

  checkFimDeJogo() {
    if (this.vidaInimigo <= 0) { 
        this.vidaInimigo = 0; 
        this.mensagemBatalha = "VITÓRIA SUPREMA!"; 
        this.jogoTerminou = true; 
    }
    
    if (this.vidaJogador <= 0) { 
        this.vidaJogador = 0; 
        this.mensagemBatalha = "GAME OVER..."; 
        this.jogoTerminou = true; 
    }
  }

  voltarParaLogin() {
    this.jogoIniciado = false;
    this.nomeJogador = '';
    this.classeSelecionada = null; // Reseta a classe também
  }
  
  reiniciar() {
    this.iniciarPartida();
  }
}