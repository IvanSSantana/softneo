// Estado compartilhado entre as funcionalidades do frontend.
// Os módulos importam o mesmo objeto; não criamos cópias independentes.
export const state = {
  products: [],
  displayedProducts: [],
  clients: [],
  sellers: [],
  transactions: [],
  draftItems: []
};
