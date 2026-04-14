const ExcelJS = require('exceljs');

const OUTPUT = 'C:\\Users\\vi89\\Desktop\\Icymath\\NRC_Verdsettelse.xlsx';

// Colors
const C_DARK_BLUE = "1F3864";
const C_MED_BLUE = "2E75B6";
const C_LIGHT_BLUE = "BDD7EE";
const C_PALE_BLUE = "EBF3FB";
const C_GREY = "F2F2F2";
const C_YELLOW = "FFFF00";
const C_WHITE = "FFFFFF";
const C_BLACK = "000000";

// Format helpers
const FMT_INT = '#,##0;(#,##0);"-"';
const FMT_PCT = '0.0%;(0.0%);"-"';
const FMT_MULT = '0.0x;(0.0x);"-"';
const FMT_PRICE = '#,##0.00;(#,##0.00);"-"';

function fillColor(hex) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } };
}

function headerCell(ws, row, col, text, bg = C_DARK_BLUE, merge = null) {
  const c = ws.getCell(row, col);
  c.value = text;
  c.fill = fillColor(bg);
  c.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  c.alignment = { horizontal: 'center', vertical: 'center', wrapText: false };
  c.border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };
  if (merge) {
    ws.mergeCells(row, col, row, merge);
  }
  return c;
}

function labelCell(ws, row, col, text, indent = 0, bold = false) {
  const c = ws.getCell(row, col);
  c.value = (indent > 0 ? '  '.repeat(indent) : '') + text;
  c.font = { name: 'Arial', bold: bold, color: { argb: 'FF000000' }, size: 10 };
  c.alignment = { horizontal: 'left', vertical: 'center' };
  c.border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };
  return c;
}

function inputYellowCell(ws, row, col, value, fmt = FMT_PCT) {
  const c = ws.getCell(row, col);
  c.value = value;
  c.fill = fillColor(C_YELLOW);
  c.font = { name: 'Arial', color: { argb: 'FF0000FF' }, size: 10 };
  c.numFmt = fmt;
  c.alignment = { horizontal: 'right', vertical: 'center' };
  c.border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };
  return c;
}

function formulaCell(ws, row, col, formula, fmt = FMT_INT, bold = false) {
  const c = ws.getCell(row, col);
  c.value = { formula: formula };
  c.font = { name: 'Arial', bold: bold, color: { argb: 'FF000000' }, size: 10 };
  c.numFmt = fmt;
  c.alignment = { horizontal: 'right', vertical: 'center' };
  c.border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };
  return c;
}

function numberCell(ws, row, col, value, fmt = FMT_INT, bold = false, hist = false) {
  const c = ws.getCell(row, col);
  c.value = value;
  c.font = { name: 'Arial', bold: bold, color: { argb: 'FF0000FF' }, size: 10 };
  c.numFmt = fmt;
  c.alignment = { horizontal: 'right', vertical: 'center' };
  c.border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };
  if (hist) {
    c.fill = fillColor(C_GREY);
  }
  return c;
}

async function main() {
  const wb = new ExcelJS.Workbook();

  // Sheet 1: Forutsetninger
  const wsFort = wb.addWorksheet('Forutsetninger');
  wsFort.tabColor = C_DARK_BLUE;
  wsFort.views = [{ state: 'frozen', ySplit: 2 }];
  wsFort.columns = [
    { width: 40 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  headerCell(wsFort, 1, 1, 'NRC Group ASA – Verdsettelsesmodell  |  NOK millioner  |  April 2026', C_DARK_BLUE, 7);

  // Driftsforutsetninger
  headerCell(wsFort, 3, 1, 'A. DRIFTSFORUTSETNINGER (Innsatsverdier – Gule celler kan endres)', C_MED_BLUE, 7);
  headerCell(wsFort, 4, 1, 'Parameter', C_MED_BLUE);
  ['2026E', '2027E', '2028E', '2029E', '2030E'].forEach((y, i) => headerCell(wsFort, 4, 2+i, y, C_MED_BLUE));

  const params = [
    ['Omsetningsvekst (%)', [0.145, 0.120, 0.100, 0.080, 0.060], FMT_PCT],
    ['EBITDA-margin (%)', [0.065, 0.075, 0.085, 0.090, 0.095], FMT_PCT],
    ['D&A (% av omsetning)', [0.032, 0.030, 0.028, 0.027, 0.026], FMT_PCT],
    ['Skattesats (%)', [0.22, 0.22, 0.22, 0.22, 0.22], FMT_PCT],
    ['Capex (% av omsetning)', [0.015, 0.015, 0.015, 0.015, 0.015], FMT_PCT],
    ['Δ Arbeidskapital (% av omsetn)', [0.005, 0.005, 0.005, 0.005, 0.005], FMT_PCT],
  ];

  params.forEach((p, i) => {
    const r = 5 + i;
    labelCell(wsFort, r, 1, p[0], 1);
    p[1].forEach((v, j) => inputYellowCell(wsFort, r, 2+j, v, p[2]));
  });

  // WACC section
  headerCell(wsFort, 12, 1, 'B. WACC-KALKULATOR', C_MED_BLUE, 3);
  const waccRows = [
    ['Risikofri rente (10-årig norsk stat)', 0.035, FMT_PCT],
    ['Beta (egenkapital)', 1.20, FMT_INT],
    ['Egenkapitalrisikopremie (ERP)', 0.055, FMT_PCT],
    ['Kostnad egenkapital (CAPM)', null, FMT_PCT],
    ['Gjeldskostnad (pre-tax)', 0.060, FMT_PCT],
    ['Skattesats', 0.22, FMT_PCT],
    ['Gjeldskostnad (post-tax)', null, FMT_PCT],
    ['Egenkapitalandel E/(D+E)', 0.65, FMT_PCT],
    ['Gjeldsandel D/(D+E)', null, FMT_PCT],
    ['WACC', null, FMT_PCT],
  ];

  let waccRow = 13;
  waccRows.forEach((r, i) => {
    const row = waccRow + i;
    labelCell(wsFort, row, 1, r[0], 1, i === waccRows.length - 1);
    if (r[1] !== null) {
      inputYellowCell(wsFort, row, 2, r[1], r[2]);
    } else if (i === 3) {
      // CAPM
      formulaCell(wsFort, row, 2, '=B13+B14*B15', FMT_PCT);
    } else if (i === 6) {
      // Post-tax debt cost
      formulaCell(wsFort, row, 2, '=B18*(1-B19)', FMT_PCT);
    } else if (i === 8) {
      // D/(D+E)
      formulaCell(wsFort, row, 2, '=1-B21', FMT_PCT);
    } else if (i === 9) {
      // WACC
      formulaCell(wsFort, row, 2, '=B21*B16+B22*B20', FMT_PCT, true);
      wsFort.getCell(row, 2).fill = fillColor(C_LIGHT_BLUE);
    }
  });

  const waccCell = 'B23';  // WACC formula
  const termGCell = 'B26'; // Terminal growth
  const sharesCell = 'B30'; // Shares
  const netdebtCell = 'B31'; // Net debt
  const priceCell = 'B32'; // Current price

  // Terminal growth
  headerCell(wsFort, 25, 1, 'C. TERMINALVERDI', C_MED_BLUE, 3);
  labelCell(wsFort, 26, 1, 'Terminal vekstrate (g)', 1);
  inputYellowCell(wsFort, 26, 2, 0.020, FMT_PCT);

  // Aksjeinfo
  headerCell(wsFort, 28, 1, 'D. AKSJEINFO OG MARKEDSDATA', C_MED_BLUE, 3);
  labelCell(wsFort, 30, 1, 'Antall aksjer (millioner)', 1);
  inputYellowCell(wsFort, 30, 2, 173.0, FMT_PRICE);

  labelCell(wsFort, 31, 1, 'Netto rentebærende gjeld (NOKm)', 1);
  inputYellowCell(wsFort, 31, 2, 752, FMT_INT);

  labelCell(wsFort, 32, 1, 'Dagens aksjekurs (NOK)', 1);
  inputYellowCell(wsFort, 32, 2, 8.82, FMT_PRICE);

  labelCell(wsFort, 33, 1, 'Markedsverdi (NOKm)', 1);
  formulaCell(wsFort, 33, 2, `=${sharesCell}*${priceCell}`, FMT_INT, true);

  // Sheet 2: Historisk
  const wsHist = wb.addWorksheet('Historisk');
  wsHist.tabColor = C_MED_BLUE;
  wsHist.views = [{ state: 'frozen', ySplit: 2 }];
  wsHist.columns = [
    { width: 38 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 40 },
  ];

  headerCell(wsHist, 1, 1, 'NRC Group ASA – Historiske Regnskapstall (NOK millioner)', C_DARK_BLUE, 6);

  // Simple structure for historical data
  headerCell(wsHist, 3, 1, 'RESULTATREGNSKAP', C_MED_BLUE, 5);
  headerCell(wsHist, 4, 1, '', C_MED_BLUE);
  ['2022A', '2023A', '2024A', '2025A'].forEach((y, i) => headerCell(wsHist, 4, 2+i, y, C_MED_BLUE));

  const isData = [
    ['Omsetning', [7030, 6732, 6892, 6553], FMT_INT],
    ['  Vekst (%)', [null, -0.042, 0.024, -0.049], FMT_PCT],
    ['EBITDA', [400, 380, -689, 339], FMT_INT],
    ['  EBITDA-margin', [null, null, null, null], FMT_PCT],
    ['EBIT (justert)', [150, 121, -93, 135], FMT_INT],
    ['  EBIT-margin', [null, null, null, null], FMT_PCT],
    ['Netto finanskostnader', [-62, -85, -84, -84], FMT_INT],
    ['EBT', [-313, 45, -919, 51], FMT_INT],
    ['Skatt', [51, 8, 81, 26], FMT_INT],
    ['Årsresultat', [-363, 38, -1000, 25], FMT_INT],
    ['Nettomarginal', [null, null, null, null], FMT_PCT],
  ];

  let hRow = 5;
  isData.forEach((item, i) => {
    const r = hRow + i;
    labelCell(wsHist, r, 1, item[0]);
    item[1].forEach((v, j) => {
      if (v !== null) {
        numberCell(wsHist, r, 2+j, v, item[2], false, true);
      }
    });
  });

  // Sheet 3: DCF (simplified version with key metrics)
  const wsDCF = wb.addWorksheet('DCF');
  wsDCF.tabColor = '1F3864';
  wsDCF.views = [{ state: 'frozen', ySplit: 2 }];
  wsDCF.columns = [
    { width: 42 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  headerCell(wsDCF, 1, 1, 'NRC Group ASA – DCF Verdivurdering (NOK millioner)', C_DARK_BLUE, 7);

  headerCell(wsDCF, 3, 1, 'Parameter', C_MED_BLUE);
  ['2025A', '2026E', '2027E', '2028E', '2029E', '2030E'].forEach((y, i) => headerCell(wsDCF, 3, 2+i, y, C_MED_BLUE));

  headerCell(wsDCF, 4, 1, 'INNTEKTSMODELL', C_MED_BLUE, 7);
  labelCell(wsDCF, 5, 1, 'Omsetning (NOKm)', 0, true);
  numberCell(wsDCF, 5, 2, 6553, FMT_INT, true, true);
  [7503, 8403, 9244, 9983, 10582].forEach((v, i) => {
    const c = wsDCF.getCell(5, 3+i);
    c.value = v;
    c.numFmt = FMT_INT;
    c.font = { name: 'Arial', bold: true, color: { argb: 'FF000000' } };
    c.fill = fillColor(C_PALE_BLUE);
    c.alignment = { horizontal: 'right' };
    c.border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };
  });

  labelCell(wsDCF, 6, 1, 'EBITDA (NOKm)', 0, true);
  numberCell(wsDCF, 6, 2, 339, FMT_INT, true, true);
  [488, 630, 786, 898, 1005].forEach((v, i) => {
    const c = wsDCF.getCell(6, 3+i);
    c.value = v;
    c.numFmt = FMT_INT;
    c.font = { name: 'Arial', bold: true, color: { argb: 'FF000000' } };
    c.fill = fillColor(C_PALE_BLUE);
    c.alignment = { horizontal: 'right' };
    c.border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };
  });

  labelCell(wsDCF, 7, 1, 'EBIT (NOKm)', 0, true);
  numberCell(wsDCF, 7, 2, 135, FMT_INT, true, true);
  [248, 378, 527, 629, 730].forEach((v, i) => {
    const c = wsDCF.getCell(7, 3+i);
    c.value = v;
    c.numFmt = FMT_INT;
    c.font = { name: 'Arial', bold: true, color: { argb: 'FF000000' } };
    c.fill = fillColor(C_PALE_BLUE);
    c.alignment = { horizontal: 'right' };
    c.border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };
  });

  labelCell(wsDCF, 8, 1, 'FCF (FCFF) (NOKm)', 0, true);
  numberCell(wsDCF, 8, 2, 64, FMT_INT, true, true);
  [282, 379, 485, 560, 632].forEach((v, i) => {
    const c = wsDCF.getCell(8, 3+i);
    c.value = v;
    c.numFmt = FMT_INT;
    c.font = { name: 'Arial', bold: true, color: { argb: 'FF000000' } };
    c.fill = fillColor(C_PALE_BLUE);
    c.alignment = { horizontal: 'right' };
    c.border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };
  });

  // DCF Summary
  headerCell(wsDCF, 10, 1, 'DCF RESULTAT', C_MED_BLUE, 7);
  labelCell(wsDCF, 11, 1, 'Sum PV av FCF', 1, true);
  formulaCell(wsDCF, 11, 2, '=SUM(C8:G8)', FMT_INT, true);
  wsDCF.getCell(11, 2).fill = fillColor(C_GREY);

  labelCell(wsDCF, 12, 1, 'PV av Terminalverdi', 1, true);
  wsDCF.getCell(12, 2).value = 6892;
  wsDCF.getCell(12, 2).numFmt = FMT_INT;
  wsDCF.getCell(12, 2).font = { bold: true };
  wsDCF.getCell(12, 2).alignment = { horizontal: 'right' };
  wsDCF.getCell(12, 2).fill = fillColor(C_GREY);

  labelCell(wsDCF, 13, 1, 'Enterprise Value', 1, true);
  formulaCell(wsDCF, 13, 2, '=B11+B12', FMT_INT, true);
  wsDCF.getCell(13, 2).fill = fillColor(C_LIGHT_BLUE);

  labelCell(wsDCF, 14, 1, '- Netto gjeld', 1);
  formulaCell(wsDCF, 14, 2, `=-Forutsetninger!${netdebtCell}`, FMT_INT);

  labelCell(wsDCF, 15, 1, 'Equity Value', 1, true);
  formulaCell(wsDCF, 15, 2, '=B13+B14', FMT_INT, true);
  wsDCF.getCell(15, 2).fill = fillColor(C_LIGHT_BLUE);

  labelCell(wsDCF, 16, 1, 'Antall aksjer (mill)', 1);
  formulaCell(wsDCF, 16, 2, `=Forutsetninger!${sharesCell}`, FMT_PRICE);

  labelCell(wsDCF, 17, 1, 'Intrinsic Value per aksje (NOK)', 1, true);
  formulaCell(wsDCF, 17, 2, '=B15/B16', FMT_PRICE, true);
  wsDCF.getCell(17, 2).fill = fillColor('C6EFCE');
  wsDCF.getCell(17, 2).font = { bold: true, color: { argb: 'FF375623' }, size: 12 };

  labelCell(wsDCF, 18, 1, 'Dagens kurs', 1);
  formulaCell(wsDCF, 18, 2, `=Forutsetninger!${priceCell}`, FMT_PRICE);

  labelCell(wsDCF, 19, 1, 'Oppside / (Nedside)', 1, true);
  formulaCell(wsDCF, 19, 2, '=B17/B18-1', FMT_PCT, true);
  wsDCF.getCell(19, 2).fill = fillColor('C6EFCE');
  wsDCF.getCell(19, 2).font = { bold: true, color: { argb: 'FF375623' }, size: 11 };

  // Sheet 4: Peer Multiple
  const wsPeer = wb.addWorksheet('Peer Multippel');
  wsPeer.tabColor = C_MED_BLUE;
  wsPeer.views = [{ state: 'frozen', ySplit: 2 }];
  for (let i = 1; i <= 12; i++) {
    wsPeer.getColumn(i).width = i === 1 ? 22 : 13;
  }

  headerCell(wsPeer, 1, 1, 'NRC Group ASA – Peer Multippelanalyse (Per April 2026)', C_DARK_BLUE, 12);

  headerCell(wsPeer, 3, 1, 'NORDISKE PEERS – INFRASTRUKTUR', C_MED_BLUE, 12);
  headerCell(wsPeer, 4, 1, 'Selskap', C_MED_BLUE);
  ['Ticker', 'Mkt Cap (mkr)', 'EV/EBITDA', 'P/E (TTM)', 'Fwd P/E', 'P/S', 'P/B'].forEach((h, i) => {
    headerCell(wsPeer, 4, 2+i, h, C_MED_BLUE);
  });

  const peers = [
    ['NRC Group ASA', 'OSL:NRC', 1524, 6.3, 57.4, 12.8, 0.21, 0.78],
    ['Veidekke ASA', 'OSL:VEI', 26600, 8.0, 17.1, 15.0, 0.62, 7.08],
    ['AF Gruppen', 'OSL:AFG', 20200, 8.4, 17.9, 15.5, 0.63, 5.12],
    ['Skanska AB', 'STO:SKA.B', 105900, 11.0, 18.6, 16.0, 0.60, 1.71],
    ['NCC AB', 'STO:NCC.B', 22000, 7.6, 155.6, 14.8, 0.40, 2.78],
    ['Peab AB', 'STO:PEAB-B', 24000, 6.5, 11.3, 10.5, 0.30, 1.20],
  ];

  peers.forEach((p, i) => {
    const r = 5 + i;
    const c1 = wsPeer.getCell(r, 1);
    c1.value = p[0];
    c1.font = { bold: i === 0, color: { argb: 'FF000000' } };
    c1.alignment = { horizontal: 'left' };
    c1.border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };

    wsPeer.getCell(r, 2).value = p[1];
    wsPeer.getCell(r, 2).font = { size: 9 };
    wsPeer.getCell(r, 2).alignment = { horizontal: 'center' };
    wsPeer.getCell(r, 2).border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };

    for (let j = 2; j < p.length; j++) {
      const cell = wsPeer.getCell(r, 2+j);
      cell.value = p[j];
      cell.numFmt = (j === 2) ? FMT_INT : FMT_MULT;
      cell.font = { color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: 'right' };
      cell.border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };
    }
  });

  // Sheet 5: Multiple Valuation
  const wsMult = wb.addWorksheet('Multippel Verdivurdering');
  wsMult.tabColor = '1F4E79';
  wsMult.views = [{ state: 'frozen', ySplit: 2 }];
  wsMult.columns = [
    { width: 38 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 30 },
  ];

  headerCell(wsMult, 1, 1, 'NRC Group ASA – Multippelbasert Verdivurdering (Gule celler = input)', C_DARK_BLUE, 5);

  headerCell(wsMult, 3, 1, 'MULTIPPEL SIMULATOR', C_MED_BLUE, 5);

  // P/E section
  headerCell(wsMult, 4, 1, 'P/E VERDIVURDERING', C_MED_BLUE, 5);
  labelCell(wsMult, 5, 1, 'EPS 2026E (NOK)', 1);
  wsMult.getCell(5, 2).value = 1.12;
  wsMult.getCell(5, 2).numFmt = FMT_PRICE;
  wsMult.getCell(5, 2).fill = fillColor(C_GREY);
  wsMult.getCell(5, 2).alignment = { horizontal: 'right' };
  wsMult.getCell(5, 2).border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };

  labelCell(wsMult, 6, 1, 'P/E multippel (input)', 1, true);
  inputYellowCell(wsMult, 6, 2, 12.0, FMT_MULT);

  labelCell(wsMult, 7, 1, 'Implisert kurs (NOK)', 1, true);
  formulaCell(wsMult, 7, 2, '=B5*B6', FMT_PRICE, true);
  wsMult.getCell(7, 2).fill = fillColor('C6EFCE');
  wsMult.getCell(7, 2).font = { bold: true, color: { argb: 'FF375623' } };

  labelCell(wsMult, 8, 1, 'Oppside vs. 8.82', 1);
  formulaCell(wsMult, 8, 2, '=B7/8.82-1', FMT_PCT);

  // EV/EBITDA section
  headerCell(wsMult, 10, 1, 'EV/EBITDA VERDIVURDERING (2026E)', C_MED_BLUE, 5);
  labelCell(wsMult, 11, 1, 'EBITDA 2026E (NOKm)', 1);
  wsMult.getCell(11, 2).value = 488;
  wsMult.getCell(11, 2).numFmt = FMT_INT;
  wsMult.getCell(11, 2).fill = fillColor(C_GREY);
  wsMult.getCell(11, 2).alignment = { horizontal: 'right' };
  wsMult.getCell(11, 2).border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };

  labelCell(wsMult, 12, 1, 'EV/EBITDA multippel (input)', 1, true);
  inputYellowCell(wsMult, 12, 2, 7.0, FMT_MULT);

  labelCell(wsMult, 13, 1, 'Implisert EV (NOKm)', 1);
  formulaCell(wsMult, 13, 2, '=B11*B12', FMT_INT);

  labelCell(wsMult, 14, 1, '- Netto gjeld (NOKm)', 1);
  wsMult.getCell(14, 2).value = -720;
  wsMult.getCell(14, 2).numFmt = FMT_INT;
  wsMult.getCell(14, 2).fill = fillColor(C_PALE_BLUE);
  wsMult.getCell(14, 2).alignment = { horizontal: 'right' };
  wsMult.getCell(14, 2).border = { left: {style:'thin'}, right: {style:'thin'}, top: {style:'thin'}, bottom: {style:'thin'} };

  labelCell(wsMult, 15, 1, 'Implisert Equity Value (NOKm)', 1, true);
  formulaCell(wsMult, 15, 2, '=B13+B14', FMT_INT, true);
  wsMult.getCell(15, 2).fill = fillColor(C_PALE_BLUE);

  labelCell(wsMult, 16, 1, 'Implisert kurs (NOK)', 1, true);
  formulaCell(wsMult, 16, 2, '=B15/173', FMT_PRICE, true);
  wsMult.getCell(16, 2).fill = fillColor('C6EFCE');
  wsMult.getCell(16, 2).font = { bold: true, color: { argb: 'FF375623' } };

  labelCell(wsMult, 17, 1, 'Oppside vs. 8.82', 1);
  formulaCell(wsMult, 17, 2, '=B16/8.82-1', FMT_PCT);

  // Summary
  headerCell(wsMult, 19, 1, 'VALUATION SAMMENDRAG (2026E)', C_MED_BLUE, 5);
  labelCell(wsMult, 20, 1, 'DCF Intrinsic Value', 1, true);
  formulaCell(wsMult, 20, 2, '=DCF!B17', FMT_PRICE, true);
  labelCell(wsMult, 21, 1, 'P/E basert verdi', 1, true);
  formulaCell(wsMult, 21, 2, '=B7', FMT_PRICE, true);
  labelCell(wsMult, 22, 1, 'EV/EBITDA basert verdi', 1, true);
  formulaCell(wsMult, 22, 2, '=B16', FMT_PRICE, true);

  // Save
  await wb.xlsx.writeFile(OUTPUT);
  console.log(`Excel file created: ${OUTPUT}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
