// Agrupa categorias por tipo pra sempre deixar explícito no select se é
// receita ou despesa (via <optgroup>), em vez de uma lista plana ambígua.
export function groupCategoriesByType(categories) {
  return {
    income: categories.filter((category) => category.type === 'income'),
    expense: categories.filter((category) => category.type === 'expense'),
  }
}
