import { appendFileSync } from "fs";

export const exportToCsv = (fileName: string, data: any[], columns: string[], withHeader = true) => {
  if (withHeader) {
    const header = columns.reduce((result, column) => `${result},${column}`, '').slice(1);
    appendFileSync(fileName, `${header}\n`)
  }

  data.forEach(row => {
    const csvLine = columns.reduce((result, column) => `${result},${row[column]}`, '').slice(1);
    appendFileSync(fileName, `${csvLine}\n`);
  })
}