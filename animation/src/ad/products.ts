// Genere par tools/scan_products.py — ne pas editer a la main.
// Produits detoures, avec la couleur qu'ils portent et le fond qui la sert.

export type Product = {
  file: string;
  label: string;
  width: number;
  height: number;
  /** Couleur dominante de la piece. */
  color: string;
  /** Fond profond de meme teinte, pour la poser dessus. */
  backdrop: string;
};

export const PRODUCTS: readonly Product[] = [
  {"file": "produits/ayoka_buckethat_noir.png", "label": "Bob Noir", "width": 1021, "height": 767, "color": "#000000", "backdrop": "#F2EFE9"},
  {"file": "produits/ayoka_casquette_noire.png", "label": "Casquette Noire", "width": 772, "height": 736, "color": "#000000", "backdrop": "#D84800"},
  {"file": "produits/ayoka_hoodie_orange.png", "label": "Hoodie Orange", "width": 1686, "height": 1968, "color": "#D84800", "backdrop": "#F2EFE9"},
  {"file": "produits/ayoka_sweatshirt_vert.png", "label": "Sweatshirt Vert", "width": 1968, "height": 1955, "color": "#183018", "backdrop": "#D84800"},
  {"file": "produits/ayoka_tshirt_noir.png", "label": "T-shirt Noir", "width": 1952, "height": 1790, "color": "#181818", "backdrop": "#F2EFE9"},
];

export const COUNT = PRODUCTS.length;

/** Produit au rang demande, en bouclant. */
export const productAt = (i: number): Product =>
  PRODUCTS[((i % COUNT) + COUNT) % COUNT];
