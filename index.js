$(document).ready(function () {
  // 初始化变量 - 跟踪数据列数量
  let dataColumnCount = 2;

  // 添加行
  $('#addRowBtn').click(function () {
    addNewRow();
  });

  // 添加列
  $('#addColumnBtn').click(function () {
    addNewColumn();
  });

  // 对比数据
  $('#compareBtn').click(function () {
    compareData();
  });

  // 导出数据
  $('#exportBtn').click(function () {
    exportData();
  });

  $('#importFile').on('change', function (event) {
    const files = event.target.files; // 获取文件列表
    console.log('files', files);
    if (files.length > 0) importData();
  });

  // 删除列事件委托
  $(document).on('click', '.delete-column-btn', function () {
    const index = parseInt($(this).data('index'));

    // 确保至少保留一列数据
    if (dataColumnCount <= 1) {
      alert('至少需要保留一列数据');
      return;
    }

    // 删除表头
    $(this).closest('th').remove();

    // 删除所有行中的对应列
    $('#dataTable tbody tr').each(function () {
      $(this).find(`.data-input[data-index="${index}"]`).closest('td').remove();
    });

    dataColumnCount--;
    // 重新编号剩余列
    renumberColumns();
  });

  // 添加新行
  function addNewRow() {
    let dataCells = '';
    for (let i = 1; i <= dataColumnCount; i++) {
      dataCells += `<td><input type="number" class="data-input" data-index="${i}"></td>`;
    }

    const newRow = `
                    <tr>
                        <td><input type="text" class="name-input"></td>
                        ${dataCells}
                        <td><button class="delete-btn">❌</button></td>
                    </tr>
                `;
    $('#dataTable tbody').append(newRow);
    bindDeleteEvents();
  }

  // 添加新列
  function addNewColumn() {
    dataColumnCount++;
    const newColumnIndex = dataColumnCount;

    // 添加表头
    const headerHtml = `
                    <th>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <input type="text" class="header-input" value="数据${newColumnIndex}">
                            <button class="delete-column-btn" data-index="${newColumnIndex}">❌</button>
                        </div>
                    </th>
                `;
    // 插入到操作列前面
    $('#dataTable thead tr th:last-child').before(headerHtml);

    // 为每一行添加新的数据单元格
    $('#dataTable tbody tr').each(function () {
      const cellHtml = `<td><input type="number" class="data-input" data-index="${newColumnIndex}"></td>`;
      $(this).find('td:last-child').before(cellHtml);
    });
  }

  // 重新编号列
  function renumberColumns() {
    // 更新表头
    const headerInputs = $('#dataTable thead .header-input');
    headerInputs.each(function (index) {
      const newIndex = index + 1;
      $(this).closest('th').find('.delete-column-btn').data('index', newIndex).attr('data-index', newIndex);
      // 如果是默认名称则更新，否则保持用户输入
      if ($(this).val().startsWith('数据')) {
        $(this).val(`数据${newIndex}`);
      }
    });

    // 更新数据单元格
    $('#dataTable tbody .data-input').each(function (index) {
      const newIndex = index + 1;
      $(this).data('index', newIndex).attr('data-index', newIndex);
    });
  }

  // 对比数据
  function compareData() {
    // 清除所有背景色
    $('.data-input').css('background-color', '');

    // 遍历每一行
    $('#dataTable tbody tr').each(function () {
      const row = $(this);
      const inputs = row.find('.data-input');
      let maxValue = -Infinity;
      // let maxInput = null;
      // 找到最大值
      inputs.each(function () {
        const value = parseFloat($(this).val()) || 0;
        if (value > maxValue) maxValue = value;
      });

      // 设置最大值背景色
      inputs.each(function () {
        const value = parseFloat($(this).val()) || 0;
        if (value === maxValue) $(this).css('background-color', '#90ee90');
      });
    });
  }

  // 绑定删除行事件
  function bindDeleteEvents() {
    $('.delete-btn').off('click').click(function () {
      $(this).closest('tr').remove();
    });
  }

  // 导出数据
  function exportData() {
    // 收集表头
    const headers = {};
    $('#dataTable thead .header-input').each(function (index) {
      headers[`data${index + 1}`] = $(this).val();
    });

    // 收集行数据
    const tableData = [];
    $('#dataTable tbody tr').each(function () {
      const rowData = {
        name: $(this).find('.name-input').val()
      };

      $(this).find('.data-input').each(function (index) {
        const value = parseFloat($(this).val());
        rowData[`data${index + 1}`] = isNaN(value) ? null : value;
      });

      tableData.push(rowData);
    });

    // 构建导出数据
    const exportData = {
      headers: headers,
      data: tableData,
      columnCount: dataColumnCount,
      exportTime: new Date().toISOString()
    };

    // 下载JSON文件
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table_data_' + new Date().getTime() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }




  // 导入数据
  function importData() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files || fileInput.files.length === 0) {
      alert('请先选择要导入的JSON文件');
      return;
    }

    const file = fileInput.files[0];
    console.log('file', file);
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const importData = JSON.parse(e.target.result);

        if (!importData.headers || !importData.data || !importData.columnCount) {
          throw new Error('导入的文件格式不正确');
        }

        // 先清除现有列，保留基础结构
        const headerCells = $('#dataTable thead tr th');
        // 保留"名称"和"操作"列，删除中间的数据列
        for (let i = headerCells.length - 2; i > 0; i--) {
          headerCells.eq(i).remove();
        }

        // 清除行数据列
        $('#dataTable tbody tr').each(function () {
          const cells = $(this).find('td');
          for (let i = cells.length - 2; i > 0; i--) {
            cells.eq(i).remove();
          }
        });

        // 重置列计数
        dataColumnCount = 0;

        // 添加导入的列
        for (let i = 1; i <= importData.columnCount; i++) {
          addNewColumn();
          // 设置表头值
          if (importData.headers[`data${i}`]) {
            $(`#dataTable thead .header-input`).eq(i - 1).val(importData.headers[`data${i}`]);
          }
        }

        // 清空现有行
        $('#dataTable tbody').empty();

        // 添加导入的行
        if (Array.isArray(importData.data)) {
          importData.data.forEach(item => {
            addNewRow();
            const rows = $('#dataTable tbody tr');
            const lastRow = rows.eq(rows.length - 1);

            if (item.name) lastRow.find('.name-input').val(item.name);

            // 设置数据值
            for (let i = 1; i <= dataColumnCount; i++) {
              if (item[`data${i}`] !== undefined && item[`data${i}`] !== null) {
                lastRow.find(`.data-input[data-index="${i}"]`).val(item[`data${i}`]);
              }
            }
          });
        }
        fileInput.value = '';
      } catch (error) {
        alert('导入失败: ' + error.message);
      }
    };

    reader.readAsText(file);
  }

  // 初始绑定删除事件
  bindDeleteEvents();
});