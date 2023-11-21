///////////////////////////////
// Criar o elemento textarea
    
  let tableData;

document.getElementById('inputFile').addEventListener('change', handleFile);

function handleFile(e) {
  const file = e.target.files[0];

  if (file) {
    const fileType = file.type;
    if (fileType === 'text/csv' || fileType === 'application/vnd.ms-excel') {
      readCSV(file);
    } else {
      alert('Por favor, selecione um arquivo CSV.');
    }
  }
}

function readCSV(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = e.target.result;
    tableData = Papa.parse(data, { header: true, skipEmptyLines: true }).data;

    renderTable(tableData);
  };

  reader.readAsText(file);
}

function renderTable(data) {
  const tableHead = document.querySelector('#dataTable thead tr');
  const tableBody = document.querySelector('#dataTable tbody');

  tableHead.innerHTML = '';
  tableBody.innerHTML = '';

  Object.keys(data[0]).forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    tableHead.appendChild(th);
  });

  data.forEach(row => {
    const tableRow = document.createElement('tr');

    Object.values(row).forEach(cellValue => {
      const td = document.createElement('td');
      td.textContent = cellValue;
      td.contentEditable = false;
      tableRow.appendChild(td);
    });

    tableBody.appendChild(tableRow);
  });
}

function checkExpiredDates() {

  if (!tableData || tableData.length < 2) {
    console.error("A tabela está vazia ou não possui dados suficientes.");
    return;
  }

  moment.tz.add('America/Sao_Paulo|BRT BRST|30 20|0101010101010101010101010101010101010101010101010101010101010101|-2P0o0 11Wq0 1o00 11B0');

  const thisYear = moment().tz("America/Sao_Paulo").format('YYYY');
  const todayString = moment().tz("America/Sao_Paulo").format('DD/MM/YYYY');
  const colunasProxima = ["PRÓXIMA A", "PRÓXIMA B", "PRÓXIMA C", "PRÓXIMA A+", "PRÓXIMA Calibração"];

  const expiredItemsTextArea = document.getElementById('expiredItemsTextArea');
  expiredItemsTextArea.value = '';
  expiredItemsTextArea.classList.remove('vencido', 'vence-hoje', 'vence-15-dias'); 

  Object.keys(tableData[0]).forEach(column => {
    if (colunasProxima.includes(column)) {
      console.log(`Verificando a coluna ${column}`);

      tableData.slice(1).forEach((row, rowIndex) => {
        const rawDate = row[column];
        const sapValue = row[Object.keys(row)[0]]; //  (SAP)

        if (rawDate && rawDate.trim() !== "") {
          try {
            const proximaDate = moment(rawDate, 'DD/MM/YYYY', true).tz("America/Sao_Paulo");

            if (!proximaDate.isValid()) {
              throw new Error(`Data inválida na linha ${rowIndex + 2}, coluna ${column}`);
            }

            console.log(`Comparando: data atual (${todayString}) com data na coluna ${column} na linha ${rowIndex + 2} (${rawDate})`);

            const daysDifference = proximaDate.diff(moment().tz("America/Sao_Paulo"), 'days');

            if (daysDifference < 0 && proximaDate.format('YYYY') === thisYear) {
              expiredItemsTextArea.value += `VENCIDO - SAP:  ${sapValue} Linha: ${rowIndex + 2} Data de Vencimento: ${proximaDate.format('DD/MM/YYYY')}\n`;
              expiredItemsTextArea.classList.add('vencido');
            } else if (daysDifference === 0 && proximaDate.format('YYYY') === thisYear) {
              expiredItemsTextArea.value += `VENCE HOJE - SAP:	 ${sapValue}, Linha: ${rowIndex + 2}, Data de Vencimento: ${proximaDate.format('DD/MM/YYYY')}\n`;
              expiredItemsTextArea.classList.add('vence-hoje');
            } else if (daysDifference <= 15 && proximaDate.format('YYYY') === thisYear) {
              expiredItemsTextArea.value += `VENDE DENTRO DE 15 DIAS - SAP:  ${sapValue}, Linha: ${rowIndex + 2}, Data de Vencimento: ${proximaDate.format('DD/MM/YYYY')}\n`;
              expiredItemsTextArea.classList.add('vence-15-dias');
            }
          } catch (error) {
            console.error(error.message);
          }
        } else {
          console.log(`Valor vazio ou inválido na coluna ${column} na linha ${rowIndex + 2}`);
        }
      });
    }
  });

  console.log("Verificação de datas concluída.");
}


function checkExpired() {
  checkExpiredDates();
}

function exportToCSV() {
  const tableBodyRows = document.querySelectorAll('#dataTable tbody tr');
  const editedData = [];

  tableBodyRows.forEach(row => {
    const rowData = {};
    row.querySelectorAll('td').forEach((cell, index) => {
      const columnName = document.querySelector(`#dataTable thead th:nth-child(${index + 1})`).textContent;
      rowData[columnName] = cell.textContent;
    });
    editedData.push(rowData);
  });

  const csvContent = Papa.unparse(editedData);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (navigator.msSaveBlob) { 
    navigator.msSaveBlob(blob, 'table.csv');
  } else {
    link.href = URL.createObjectURL(blob);
    link.target = '_blank';
    link.download = 'table.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}


function mergeWithExistingData() {
  const mergeFileInput = document.createElement('input');
  mergeFileInput.type = 'file';

  mergeFileInput.addEventListener('change', function (e) {
    const mergeFile = e.target.files[0];

    if (mergeFile) {
      const fileType = mergeFile.type;

      if (fileType === 'text/csv' || fileType === 'application/vnd.ms-excel') {
        readCSVForMerge(mergeFile);
      } else {
        alert('Por favor, selecione um arquivo CSV.');
      }
    }
  });

  mergeFileInput.click();

  function readCSVForMerge(mergeFile) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const newData = Papa.parse(e.target.result, { header: true, skipEmptyLines: true }).data;

      const mergedData = mergeData(tableData, newData);

      // Atualiza a tabela com os novos dados mesclados
      renderTable(mergedData);

      // Atualiza o expiredItemsTextArea 
      updateExpiredItemsTextArea(tableData, newData, mergedData);
    };

    reader.readAsText(mergeFile);
  }

  function mergeData(existingData, newData) {
    const mergedData = [];

    existingData.forEach((existingRow, rowIndex) => {
      const sapValue = existingRow[Object.keys(existingRow)[0]];
      const matchingNewRow = newData.find(newRow => newRow[Object.keys(newRow)[0]] === sapValue);

      if (matchingNewRow) {
        const mergedRow = { ...existingRow, ...matchingNewRow };
        mergedData.push(mergedRow);
        newData = newData.filter(row => row !== matchingNewRow);
      } else {
        mergedData.push(existingRow);
      }
    });

    // Adiciona novas linhas 
    mergedData.push(...newData);

    return mergedData;
  }

  function updateExpiredItemsTextArea(oldData, newData, mergedData) {
  const expiredItemsTextArea = document.getElementById('expiredItemsTextArea');
  expiredItemsTextArea.value = '';
  expiredItemsTextArea.classList.remove('vencido', 'vence-hoje', 'vence-15-dias');

  let newItemsAdded = false; // itens foram adicionados

  mergedData.forEach((mergedRow, rowIndex) => {
    const sapValue = mergedRow[Object.keys(mergedRow)[0]];
    const oldRow = oldData.find(row => row[Object.keys(row)[0]] === sapValue);
    const newRow = newData.find(row => row[Object.keys(row)[0]] === sapValue);

    if (oldRow && newRow) {
      Object.keys(mergedRow).forEach(column => {
        if (oldRow[column] !== newRow[column]) {
          expiredItemsTextArea.value += `Alterado - SAP: ${sapValue}, Linha: ${rowIndex + 2}, Coluna: ${column}, Valor Antigo: ${oldRow[column]}, Novo Valor: ${newRow[column]}\n`;
        }
      });
    } else if (newRow) {
      newItemsAdded = true;
    }
  });

  if (newItemsAdded) {
    expiredItemsTextArea.value += '\nNovos itens foram adicionados durante a mesclagem.';
    alert('Novos itens foram adicionados durante a mesclagem.');
  }

  console.log("Mesclagem concluída.");
}

}

function markAsUnavailable() {
  const expiredItemsTextArea = document.getElementById('expiredItemsTextArea');
  expiredItemsTextArea.value = '';
  expiredItemsTextArea.classList.remove('vencido', 'vence-hoje', 'vence-15-dias');

  if (!tableData || tableData.length < 2) {
    console.error("A tabela está vazia ou não possui dados suficientes.");
    return;
  }

  moment.tz.add('America/Sao_Paulo|BRT BRST|30 20|0101010101010101010101010101010101010101010101010101010101010101|-2P0o0 11Wq0 1o00 11B0');

  const thisYear = moment().tz("America/Sao_Paulo").format('YYYY');
  const todayString = moment().tz("America/Sao_Paulo").format('DD/MM/YYYY');
  const colunasProxima = ["PRÓXIMA A", "PRÓXIMA B", "PRÓXIMA C", "PRÓXIMA A+", "PRÓXIMA Calibração"];

  const changedItems = []; //marcados como indisponíveis

  Object.keys(tableData[0]).forEach(column => {
    if (colunasProxima.includes(column)) {
      console.log(`Verificando a coluna ${column}`);

      tableData.slice(1).forEach((row, rowIndex) => {
        const rawDate = row[column];
        const sapValue = row[Object.keys(row)[0]]; // (SAP)

        // Verificar se é INDISPONIVEL
        if (row.STATUS.toUpperCase() !== 'INDISPONIVEL' && rawDate && rawDate.trim() !== "") {
          try {
            const proximaDate = moment(rawDate, 'DD/MM/YYYY', true).tz("America/Sao_Paulo");

            if (!proximaDate.isValid()) {
              throw new Error(`Data inválida na linha ${rowIndex + 2}, coluna ${column}`);
            }

            console.log(`Comparando: data atual (${todayString}) com data na coluna ${column} na linha ${rowIndex + 2} (${rawDate})`);

            const daysDifference = proximaDate.diff(moment().tz("America/Sao_Paulo"), 'days');

            if (daysDifference < 0 && proximaDate.format('YYYY') === thisYear) {
              row.STATUS = 'INDISPONIVEL';
              row.CONDIÇÃO = 'MANUTENÇÃO'; // Adiciona a condição MANUTENÇÃO
              changedItems.push({ SAP: sapValue, Linha: rowIndex + 2 });
              expiredItemsTextArea.value += `Marcado como INDISPONIVEL - SAP: ${sapValue}, Linha: ${rowIndex + 2}, Data Expirada: ${proximaDate.format('DD/MM/YYYY')}\n`;
              expiredItemsTextArea.classList.add('vencido');
            }
          } catch (error) {
            console.error(error.message);
          }
        } else {
          console.log(`Item já marcado como INDISPONIVEL ou valor vazio/inválido na coluna ${column} na linha ${rowIndex + 2}`);
        }
      });
    }
  });

  renderTable(tableData);

  if (changedItems.length > 0) {
    alert('Itens marcados como INDISPONIVEL:\n' + JSON.stringify(changedItems));
  }

  console.log("Marcação como INDISPONIVEL concluída.");
}


