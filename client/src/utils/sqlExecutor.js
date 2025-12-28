/**
 * Client-side SQL query processor
 * Handles SELECT statements with filtering, sorting, joins, and aggregations
 */

const processSQLQuery = (sqlQuery, dataSource) => {
  try {
    const cleanedQuery = sqlQuery.trim().replace(/\s+/g, ' ');
    const queryUpper = cleanedQuery.toUpperCase();

    // Validate query type
    if (!queryUpper.startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed');
    }

    // Block potentially harmful operations
    const blockedOperations = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
    const containsBlocked = blockedOperations.some(op => queryUpper.includes(op));
    if (containsBlocked) {
      const foundOp = blockedOperations.find(op => queryUpper.includes(op));
      throw new Error(`Operation '${foundOp}' is not permitted`);
    }

    // Process JOIN queries separately
    if (queryUpper.includes('JOIN')) {
      return handleTableJoin(cleanedQuery, dataSource);
    }

    // Get table reference
    const tablePattern = cleanedQuery.match(/FROM\s+(\w+)/i);
    if (!tablePattern) {
      throw new Error('FROM clause is required');
    }

    const targetTable = tablePattern[1].toLowerCase();
    
    if (!dataSource[targetTable]) {
      throw new Error(`Table '${targetTable}' not found`);
    }

    let resultSet = [...dataSource[targetTable].rows];

    // Parse SELECT clause
    const selectPattern = cleanedQuery.match(/SELECT\s+(.+?)\s+FROM/i);
    const columnSelection = selectPattern ? selectPattern[1].trim() : '*';
    
    // Apply WHERE filtering
    const wherePattern = cleanedQuery.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+GROUP\s+BY|$)/i);
    if (wherePattern) {
      resultSet = filterRows(resultSet, wherePattern[1].trim());
    }

    // Handle aggregation queries
    if (queryUpper.includes('GROUP BY') || containsAggregation(columnSelection)) {
      return processAggregation(cleanedQuery, resultSet, columnSelection);
    }

    // Apply sorting
    const sortPattern = cleanedQuery.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (sortPattern) {
      const sortField = sortPattern[1].toLowerCase();
      const sortOrder = (sortPattern[2] || 'ASC').toUpperCase();
      resultSet = applySorting(resultSet, sortField, sortOrder);
    }

    // Project selected columns
    const selectedFields = extractColumns(columnSelection);
    resultSet = projectColumns(resultSet, selectedFields);

    return {
      success: true,
      columns: Object.keys(resultSet[0] || {}),
      rows: resultSet,
      rowCount: resultSet.length
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      columns: [],
      rows: [],
      rowCount: 0
    };
  }
};

const handleTableJoin = (queryText, dataSource) => {
  const queryUpper = queryText.toUpperCase();
  
  // Parse JOIN syntax
  const joinPattern = queryText.match(/(\w+)\s+JOIN\s+(\w+)\s+ON/i);
  if (!joinPattern) {
    throw new Error('Invalid JOIN syntax. Use: table1 JOIN table2 ON condition');
  }

  const firstTable = joinPattern[1].toLowerCase();
  const secondTable = joinPattern[2].toLowerCase();

  if (!dataSource[firstTable] || !dataSource[secondTable]) {
    throw new Error(`One or both tables not found: ${firstTable}, ${secondTable}`);
  }

  const leftTableData = dataSource[firstTable].rows;
  const rightTableData = dataSource[secondTable].rows;

  // Extract join condition
  const onPattern = queryText.match(/ON\s+(.+?)(?:\s+WHERE|\s+ORDER\s+BY|$)/i);
  if (!onPattern) {
    throw new Error('JOIN condition (ON clause) is required');
  }

  const joinCondition = onPattern[1].trim();
  const [leftCol, operator, rightCol] = parseJoinCondition(joinCondition);

  // Perform join operation
  const joinedResults = [];
  for (const leftRow of leftTableData) {
    for (const rightRow of rightTableData) {
      const leftValue = leftRow[leftCol.toLowerCase()];
      const rightValue = rightRow[rightCol.toLowerCase()];
      
      if (operator === '=' && leftValue === rightValue) {
        joinedResults.push({ ...leftRow, ...rightRow });
      }
    }
  }

  // Apply WHERE if present
  let finalResults = joinedResults;
  const wherePattern = queryText.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|$)/i);
  if (wherePattern) {
    finalResults = filterRows(finalResults, wherePattern[1].trim());
  }

  // Apply ORDER BY if present
  const sortPattern = queryText.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (sortPattern) {
    const sortField = sortPattern[1].toLowerCase();
    const sortOrder = (sortPattern[2] || 'ASC').toUpperCase();
    finalResults = applySorting(finalResults, sortField, sortOrder);
  }

  // Project columns
  const selectPattern = queryText.match(/SELECT\s+(.+?)\s+FROM/i);
  const columnSelection = selectPattern ? selectPattern[1].trim() : '*';
  const selectedFields = extractColumns(columnSelection);
  finalResults = projectColumns(finalResults, selectedFields);

  return {
    success: true,
    columns: Object.keys(finalResults[0] || {}),
    rows: finalResults,
    rowCount: finalResults.length
  };
};

const processAggregation = (queryText, dataRows, selectClause) => {
  const queryUpper = queryText.toUpperCase();
  const hasGrouping = queryUpper.includes('GROUP BY');
  
  // Identify aggregation functions
  const aggregationFunctions = {
    count: selectClause.match(/COUNT\((\w+|\*)\)/i),
    sum: selectClause.match(/SUM\((\w+)\)/i),
    avg: selectClause.match(/AVG\((\w+)\)/i),
    max: selectClause.match(/MAX\((\w+)\)/i),
    min: selectClause.match(/MIN\((\w+)\)/i)
  };

  if (hasGrouping) {
    const groupPattern = queryText.match(/GROUP\s+BY\s+(\w+)/i);
    const groupField = groupPattern[1].toLowerCase();
    
    // Group data by field
    const groupedData = {};
    for (const row of dataRows) {
      const groupKey = row[groupField];
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = [];
      }
      groupedData[groupKey].push(row);
    }

    // Calculate aggregates for each group
    const aggregatedResults = [];
    for (const [groupValue, groupRows] of Object.entries(groupedData)) {
      const resultRow = { [groupField]: groupValue };
      
      for (const [funcName, match] of Object.entries(aggregationFunctions)) {
        if (match) {
          const fieldName = match[1].toLowerCase();
          if (funcName === 'count') {
            resultRow[`${funcName}_${fieldName}`] = groupRows.length;
          } else if (funcName === 'sum') {
            resultRow[`sum_${fieldName}`] = groupRows.reduce((acc, r) => acc + (Number(r[fieldName]) || 0), 0);
          } else if (funcName === 'avg') {
            const total = groupRows.reduce((acc, r) => acc + (Number(r[fieldName]) || 0), 0);
            resultRow[`avg_${fieldName}`] = total / groupRows.length;
          } else if (funcName === 'max') {
            resultRow[`max_${fieldName}`] = Math.max(...groupRows.map(r => Number(r[fieldName]) || 0));
          } else if (funcName === 'min') {
            resultRow[`min_${fieldName}`] = Math.min(...groupRows.map(r => Number(r[fieldName]) || 0));
          }
        }
      }
      
      aggregatedResults.push(resultRow);
    }

    return {
      success: true,
      columns: Object.keys(aggregatedResults[0] || {}),
      rows: aggregatedResults,
      rowCount: aggregatedResults.length
    };
  } else {
    // Single aggregate result
    const resultRow = {};
    
    for (const [funcName, match] of Object.entries(aggregationFunctions)) {
      if (match) {
        const fieldName = match[1].toLowerCase();
        if (funcName === 'count') {
          resultRow[`${funcName}_${fieldName}`] = dataRows.length;
        } else if (funcName === 'sum') {
          resultRow[`sum_${fieldName}`] = dataRows.reduce((acc, r) => acc + (Number(r[fieldName]) || 0), 0);
        } else if (funcName === 'avg') {
          const total = dataRows.reduce((acc, r) => acc + (Number(r[fieldName]) || 0), 0);
          resultRow[`avg_${fieldName}`] = total / dataRows.length;
        } else if (funcName === 'max') {
          resultRow[`max_${fieldName}`] = Math.max(...dataRows.map(r => Number(r[fieldName]) || 0));
        } else if (funcName === 'min') {
          resultRow[`min_${fieldName}`] = Math.min(...dataRows.map(r => Number(r[fieldName]) || 0));
        }
      }
    }

    return {
      success: true,
      columns: Object.keys(resultRow),
      rows: [resultRow],
      rowCount: 1
    };
  }
};

const containsAggregation = (selectClause) => {
  const upper = selectClause.toUpperCase();
  return /COUNT|SUM|AVG|MAX|MIN/.test(upper);
};

const filterRows = (dataRows, whereExpression) => {
  return dataRows.filter(row => {
    const hasAnd = whereExpression.toUpperCase().includes(' AND ');
    const hasOr = whereExpression.toUpperCase().includes(' OR ');
    const conditions = whereExpression.split(/\s+AND\s+|\s+OR\s+/i);
    
    if (hasAnd) {
      return conditions.every(condition => evaluateCondition(row, condition.trim()));
    } else if (hasOr) {
      return conditions.some(condition => evaluateCondition(row, condition.trim()));
    } else {
      return evaluateCondition(row, whereExpression.trim());
    }
  });
};

const evaluateCondition = (rowData, conditionText) => {
  let conditionMatch = conditionText.match(/(\w+)\s*(=|!=|>|<|>=|<=)\s*(.+)/);
  if (!conditionMatch) {
    conditionMatch = conditionText.match(/(\w+)\s*(=|!=|>|<|>=|<=)\s*['"](.+)['"]/);
  }
  
  if (!conditionMatch) {
    return true;
  }
  
  const [, fieldName, comparisonOp, comparisonValue] = conditionMatch;
  const fieldValue = rowData[fieldName.toLowerCase()];
  const compareValue = isNaN(comparisonValue) ? comparisonValue.replace(/['"]/g, '').trim() : Number(comparisonValue);
  
  switch (comparisonOp) {
    case '=':
      return fieldValue == compareValue;
    case '!=':
      return fieldValue != compareValue;
    case '>':
      return Number(fieldValue) > Number(compareValue);
    case '<':
      return Number(fieldValue) < Number(compareValue);
    case '>=':
      return Number(fieldValue) >= Number(compareValue);
    case '<=':
      return Number(fieldValue) <= Number(compareValue);
    default:
      return true;
  }
};

const parseJoinCondition = (conditionText) => {
  const match = conditionText.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/);
  if (match) {
    return [match[2].toLowerCase(), '=', match[4].toLowerCase()];
  }
  throw new Error('Invalid JOIN condition format');
};

const extractColumns = (selectClause) => {
  if (selectClause === '*') {
    return '*';
  }
  
  return selectClause.split(',').map(col => {
    const aliasMatch = col.match(/\w+\.(\w+)|(\w+)\s+AS\s+(\w+)|(\w+)\.(\w+)\s+AS\s+(\w+)|(\w+)/i);
    if (aliasMatch) {
      return aliasMatch[1] || aliasMatch[2] || aliasMatch[4] || aliasMatch[7];
    }
    return col.trim().toLowerCase();
  });
};

const projectColumns = (dataRows, columnList) => {
  if (columnList === '*' || (Array.isArray(columnList) && columnList.length === 1 && columnList[0] === '*')) {
    return dataRows;
  }
  
  return dataRows.map(row => {
    const projectedRow = {};
    for (const col of columnList) {
      if (row[col.toLowerCase()] !== undefined) {
        projectedRow[col.toLowerCase()] = row[col.toLowerCase()];
      }
    }
    return projectedRow;
  });
};

const applySorting = (dataRows, sortField, sortDirection) => {
  const sortedRows = [...dataRows];
  sortedRows.sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (sortDirection === 'DESC') {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    } else {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    }
  });
  
  return sortedRows;
};

export { processSQLQuery as executeSQL };
