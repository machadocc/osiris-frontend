export function groupCategoriesByType(categories) {
  return {
    income: categories.filter((category) => category.type === 'income'),
    expense: categories.filter((category) => category.type === 'expense'),
  }
}
