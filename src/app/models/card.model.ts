export interface Card {
  nome: string;
  descricao: string;
  strong: number;
  speed: number;
  intelligence: number;
  imagemUrl?: string; // O ? significa que a imagem é opcional por enquanto
}