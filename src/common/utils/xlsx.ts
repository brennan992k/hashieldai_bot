import axios from 'axios';
import * as path from 'path';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export class XLSXUtils {
  constructor() {
    if (!XLSXUtils._instance) {
      XLSXUtils._instance = this;
    }
    return XLSXUtils._instance;
  }

  private static _instance: XLSXUtils;

  public static get instance(): XLSXUtils {
    if (!XLSXUtils._instance) {
      XLSXUtils._instance = new XLSXUtils();
    }
    return XLSXUtils._instance;
  }

  public async createFile(
    name: string,
    header: Array<{ title: string; key: string }>,
    data: Array<any>,
  ): Promise<string> {
    // Create a worksheet using the custom headers along with the data
    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: header.map((h) => h.key),
    });

    // Add the custom headers array at the beginning of the worksheet
    header.forEach((header, index) => {
      worksheet[XLSX.utils.encode_cell({ r: 0, c: index })] = {
        v: header.title,
        t: 's',
      }; // Row 0 (header row)
    });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Generate and download the Excel file
    const outputFilePath = path.join(__dirname, `${name}.xlsx`);

    XLSX.writeFile(workbook, outputFilePath);

    return outputFilePath;
  }

  public async readFileFromURL(url: string) {
    const tempFilePath = path.join(__dirname, `${uuidv4()}.xlsx`);

    // Download the CSV file from the URL
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    fs.writeFileSync(tempFilePath, response.data); // Save the file temporarily

    // Read the CSV file using XLSX
    const workbook = XLSX.readFile(tempFilePath, { type: 'array' });
    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    const worksheet = workbook.Sheets[sheetName]; // Get the first sheet's data

    // Convert the sheet to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet); // Set header: 1 to treat the first row as headers

    fs.unlinkSync(tempFilePath); // Cleanup - Delete the temporary file

    return rawData;
  }
}
