function getIndex(column, row, columns, rows) {
  const insideArea = column >= 0 && column < columns &&
    row >= 0 && row < rows

  if (!insideArea)
    return null

  return row * columns + column
}

function getIndexWrapped(column, row, columns, rows) {
  if (column < 0)
    column = columns + column

  if (row < 0)
    row = rows + row

  if (column >= columns)
    column = column - columns

  if (row >= rows)
    row = row - rows

  return getIndex(column, row, columns, rows)
 }

export default function applyLifeRules(data, columns, rows, wrap) {
  let updatedData = [...data]
  const getIndexFn = wrap ? getIndexWrapped : getIndex

  for (let column = 0; column < columns; ++column) {
    for (let row = 0; row < rows; ++row) {
      let neighbourCount = 0;

      for (let neighbourColumn = column - 1; neighbourColumn < column + 2; ++neighbourColumn) {
        for (let neighbourRow = row - 1; neighbourRow < row + 2; ++neighbourRow) {
          if (neighbourColumn === column && neighbourRow === row) continue;

          const neighbourIdx = getIndexFn(neighbourColumn, neighbourRow, columns, rows)

          if (neighbourIdx !== null && data[neighbourIdx]) {
            ++neighbourCount
          }
        }
      }

      const dead = false
      const alive = true

      const idx = getIndex(column, row, columns, rows)
      console.assert(idx !== null) // TODO: remove asserts in production

      if (data[idx] && neighbourCount < 2) {
        updatedData[idx] = dead
      } else if (data[idx] && neighbourCount > 3) {
        updatedData[idx] = dead
      } else if (!data[idx] && neighbourCount === 3) {
        updatedData[idx] = alive
      }
    }
  }

  return updatedData
}
