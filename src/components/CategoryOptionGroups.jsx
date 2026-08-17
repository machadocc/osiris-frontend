import { groupCategoriesByType } from '../utils/categoryGroups.js'

// Usar como filhos diretos de um <select>, junto com a <option value=""> de placeholder.
export default function CategoryOptionGroups({ categories }) {
  const { income, expense } = groupCategoriesByType(categories)

  return (
    <>
      {expense.length > 0 && (
        <optgroup label="Despesa">
          {expense.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </optgroup>
      )}
      {income.length > 0 && (
        <optgroup label="Receita">
          {income.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </optgroup>
      )}
    </>
  )
}
