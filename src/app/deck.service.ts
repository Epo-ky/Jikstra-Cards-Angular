import { Injectable } from '@angular/core';
import { Card } from './card/card';

@Injectable({ providedIn: 'root' })
export class DeckService {

  readonly TAMANHO_MINIMO_DECK = 18;

  gerarDeckBase(): Card[] {
    const deck: Card[] = [
      { nome: 'Cavaleiro Real',    descricao: 'Esmaga ossos.',              strong: 8,  speed: 5,  intelligence: 3,  imagemUrl: 'cards/cavaleira-real.png',  tipo: 'força' },
      { nome: 'Arqueira Veloz',    descricao: 'Intocável.',                 strong: 4,  speed: 9,  intelligence: 5,  imagemUrl: 'cards/arqueira-veloz.png',  tipo: 'velocidade' },
      { nome: 'Mago Sombrio',      descricao: 'Feitiço mortal.',            strong: 2,  speed: 4,  intelligence: 10, imagemUrl: 'cards/mago-sombrio.png',    tipo: 'magia' },
      { nome: 'Dragão Roxo',       descricao: 'Fúria pura.',                strong: 10, speed: 6,  intelligence: 2,  imagemUrl: 'cards/dragao-roxo.png',     tipo: 'força' },
      { nome: 'Lix',               descricao: 'Rápido e sujo.',             strong: 3,  speed: 8,  intelligence: 4,  imagemUrl: 'cards/lix.png',             tipo: 'velocidade' },
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
      { nome: 'Thigas',            descricao: 'O Vilão.',                   strong: 10, speed: 10, intelligence: 10, imagemUrl: 'cards/thigas.png',          tipo: 'magia' },
      { nome: 'Fane',              descricao: 'A Ladra.',                   strong: 3,  speed: 8,  intelligence: 5,  imagemUrl: 'cards/fane.png',            tipo: 'velocidade' },
      { nome: 'Lifa',              descricao: 'A Lâmina.',                  strong: 7,  speed: 9,  intelligence: 3,  imagemUrl: 'cards/lifa.png',            tipo: 'velocidade' },
      { nome: 'Luan',              descricao: 'O Samurai.',                 strong: 7,  speed: 8,  intelligence: 5,  imagemUrl: 'cards/luan.png',            tipo: 'velocidade' },
      { nome: 'Ragnar',            descricao: 'O Frio.',                    strong: 3,  speed: 8,  intelligence: 6,  imagemUrl: 'cards/ragnar.png',          tipo: 'velocidade' },
      { nome: 'Mimico Falho',      descricao: 'O Mimico.',                  strong: 3,  speed: 7,  intelligence: 4,  imagemUrl: 'cards/mimico.png',          tipo: 'velocidade' },
      { nome: 'Golem',             descricao: 'O Guardião.',                strong: 8,  speed: 4,  intelligence: 6,  imagemUrl: 'cards/golem.png',           tipo: 'força' },
      { nome: 'Destor',            descricao: 'O Olho Da Destruição.',      strong: 9,  speed: 3,  intelligence: 5,  imagemUrl: 'cards/destor.png',          tipo: 'força' },
      { nome: 'Miror',             descricao: 'O Reflexo Majestoso.',       strong: 9,  speed: 6,  intelligence: 7,  imagemUrl: 'cards/miror.png',           tipo: 'força' },
      { nome: 'Rabisco',           descricao: 'Oque não deve ser.',         strong: 8,  speed: 9,  intelligence: 4,  imagemUrl: 'cards/rabisco.png',         tipo: 'força' },
      // Cartas Mágicas
      { nome: 'Poção de Cura',       descricao: 'Recupera 10 HP.',               strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'cura' },
      { nome: 'Poção de Cura Maior', descricao: 'Recupera 20 HP.',               strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'cura maior' },
      { nome: 'Olho de Espelho',     descricao: 'Revela a carta do oponente.',   strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'espelho' },
      { nome: 'Fúria Dobrada',       descricao: 'Dobra seu atributo principal.', strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'dobro' },
      { nome: 'Sabotagem Arcana',    descricao: 'Enfraquece o oponente.',        strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'sabotagem' },
      { nome: 'Burn',                descricao: 'Causa 10 de dano ao oponente.', strong: 0, speed: 0, intelligence: 0, imagemUrl: '', tipo: 'magica', efeito: 'burn' },
    ];

    while (deck.length < this.TAMANHO_MINIMO_DECK) {
      deck.push({ ...deck[deck.length % 32] });
    }
    return deck;
  }

  gerarDeckOponente(): Card[] {
    return this.gerarDeckBase().filter(c => c.tipo !== 'magica');
  }

  embaralhar(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  puxarDoTopo(deck: Card[]): Card | undefined {
    return deck.shift();
  }
}