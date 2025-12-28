import mongoose from 'mongoose';

/**
 * Simple SQL to MongoDB Query Converter
 * Handles basic SELECT queries and converts them to MongoDB queries
 */

/**
 * Parse SQL SELECT query and convert to MongoDB query
 * Supports: SELECT, FROM, WHERE (basic conditions), JOIN (basic), ORDER BY
 */
export const executeSQLOnMongoDB = async (sqlQuery, assignmentData) => {
  try {
    const query = sqlQuery.trim();
    const upperQuery = query.toUpperCase();

    // Basic validation
    if (!upperQuery.startsWith('SELECT')) {
      throw new Error('Only SELECT queries are supported');
    }

    // Check for JOIN
    const hasJoin = /JOIN/i.test(query);
    
    if (hasJoin) {
      return await handleJoinQuery(query, assignmentData);
    }

    // Extract table name from FROM clause
    const fromMatch = query.match(/FROM\s+(\w+)/i);
    if (!fromMatch) {
      throw new Error('FROM clause is required');
    }

    const tableName = fromMatch[1].toLowerCase();
    
    // Check if table exists in assignment data
    if (!assignmentData.sampleData || !assignmentData.sampleData[tableName]) {
      throw new Error(`Table '${tableName}' not found`);
    }

    // Get MongoDB model for this table
    const Model = getOrCreateModel(tableName, assignmentData.sampleData[tableName]);

    // Extract columns to select
    const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
    const columns = selectMatch 
      ? selectMatch[1].split(',').map(col => col.trim().toLowerCase().replace(/.*\./, ''))
      : ['*']; // Select all if * is used

    // Build MongoDB query
    let mongoQuery = Model.find({});

    // Handle WHERE clause - extract everything between WHERE and ORDER BY (or end of query)
    let whereClause = null;
    const whereIndex = query.toUpperCase().indexOf('WHERE');
    if (whereIndex !== -1) {
      const afterWhere = query.substring(whereIndex + 5).trim();
      const orderByIndex = afterWhere.toUpperCase().indexOf('ORDER BY');
      if (orderByIndex !== -1) {
        whereClause = afterWhere.substring(0, orderByIndex).trim();
      } else {
        whereClause = afterWhere.trim();
      }
      
      if (whereClause) {
        const conditions = parseWhereClause(whereClause);
        mongoQuery = Model.find(conditions);
      }
    }

    // Handle ORDER BY clause
    const orderByMatch = query.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (orderByMatch) {
      const orderColumn = orderByMatch[1].toLowerCase();
      const orderDirection = (orderByMatch[2] || 'ASC').toUpperCase() === 'DESC' ? -1 : 1;
      mongoQuery = mongoQuery.sort({ [orderColumn]: orderDirection });
    }

    // Execute query
    let results = await mongoQuery.exec();

    // Handle column selection
    if (!columns.includes('*')) {
      results = results.map(doc => {
        const obj = doc.toObject();
        const selected = {};
        columns.forEach(col => {
          if (obj.hasOwnProperty(col)) {
            selected[col] = obj[col];
          }
        });
        return selected;
      });
    } else {
      results = results.map(doc => doc.toObject());
    }

    // Extract column names
    const resultColumns = results.length > 0 
      ? Object.keys(results[0])
      : (columns.includes('*') 
          ? (assignmentData.sampleData[tableName].schema?.map(s => s.name.toLowerCase()) || [])
          : columns);

    return {
      rows: results,
      rowCount: results.length,
      columns: resultColumns
    };
  } catch (error) {
    throw new Error(`SQL Execution Error: ${error.message}`);
  }
};

/**
 * Handle JOIN queries
 */
async function handleJoinQuery(query, assignmentData) {
  // Extract tables from FROM and JOIN clauses
  const fromMatch = query.match(/FROM\s+(\w+)/i);
  const joinMatch = query.match(/JOIN\s+(\w+)\s+ON\s+(.+)/i);
  
  if (!fromMatch || !joinMatch) {
    throw new Error('Invalid JOIN syntax. Use: SELECT ... FROM table1 JOIN table2 ON condition');
  }

  const table1Name = fromMatch[1].toLowerCase();
  const table2Name = joinMatch[1].toLowerCase();
  const joinCondition = joinMatch[2].trim();

  // Get models
  if (!assignmentData.sampleData[table1Name] || !assignmentData.sampleData[table2Name]) {
    throw new Error(`One or both tables not found: ${table1Name}, ${table2Name}`);
  }

  const Model1 = getOrCreateModel(table1Name, assignmentData.sampleData[table1Name]);
  const Model2 = getOrCreateModel(table2Name, assignmentData.sampleData[table2Name]);

  // Get all data from both tables
  const data1 = await Model1.find({}).exec();
  const data2 = await Model2.find({}).exec();

  // Parse join condition (e.g., "employees.department_id = departments.id")
  const conditionMatch = joinCondition.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
  if (!conditionMatch) {
    throw new Error('Invalid JOIN condition format. Use: table1.column = table2.column');
  }

  const [, table1Alias, col1, table2Alias, col2] = conditionMatch;
  const actualCol1 = table1Alias.toLowerCase() === table1Name ? col1.toLowerCase() : col2.toLowerCase();
  const actualCol2 = table2Alias.toLowerCase() === table2Name ? col2.toLowerCase() : col1.toLowerCase();

  // Perform join
  const joinedResults = [];
  data1.forEach(row1 => {
    const row1Obj = row1.toObject();
    data2.forEach(row2 => {
      const row2Obj = row2.toObject();
      if (row1Obj[actualCol1] === row2Obj[actualCol2]) {
        // Merge rows
        const merged = { ...row1Obj };
        Object.keys(row2Obj).forEach(key => {
          if (key !== actualCol2) {
            merged[key] = row2Obj[key];
          }
        });
        joinedResults.push(merged);
      }
    });
  });

  // Extract columns to select
  const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
  let filteredResults = joinedResults;
  
  if (selectMatch) {
    const columns = selectMatch[1].split(',').map(col => {
      const trimmed = col.trim().toLowerCase();
      return trimmed.includes('.') ? trimmed.split('.')[1] : trimmed;
    });

    filteredResults = joinedResults.map(row => {
      const selected = {};
      columns.forEach(col => {
        if (row.hasOwnProperty(col)) {
          selected[col] = row[col];
        }
      });
      return selected;
    });
  }

  // Handle ORDER BY for JOIN queries
  const orderByMatch = query.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (orderByMatch) {
    const orderColumn = orderByMatch[1].toLowerCase();
    const orderDirection = (orderByMatch[2] || 'ASC').toUpperCase() === 'DESC' ? -1 : 1;
    filteredResults.sort((a, b) => {
      const aVal = a[orderColumn];
      const bVal = b[orderColumn];
      if (aVal === bVal) return 0;
      return aVal > bVal ? orderDirection : -orderDirection;
    });
  }

  const resultColumns = filteredResults.length > 0 
    ? Object.keys(filteredResults[0])
    : (selectMatch 
        ? selectMatch[1].split(',').map(col => {
            const trimmed = col.trim().toLowerCase();
            return trimmed.includes('.') ? trimmed.split('.')[1] : trimmed;
          })
        : []);

  return {
    rows: filteredResults,
    rowCount: filteredResults.length,
    columns: resultColumns
  };
}

/**
 * Parse WHERE clause into MongoDB conditions
 */
function parseWhereClause(whereClause) {
  const conditions = {};
  
  // Handle simple conditions: column = value, column > value, etc.
  const operators = [
    { pattern: /(\w+)\s*=\s*['"]?([^'"]+)['"]?/i, op: '$eq' },
    { pattern: /(\w+)\s*!=\s*['"]?([^'"]+)['"]?/i, op: '$ne' },
    { pattern: /(\w+)\s*>\s*['"]?([^'"]+)['"]?/i, op: '$gt' },
    { pattern: /(\w+)\s*<\s*['"]?([^'"]+)['"]?/i, op: '$lt' },
    { pattern: /(\w+)\s*>=\s*['"]?([^'"]+)['"]?/i, op: '$gte' },
    { pattern: /(\w+)\s*<=\s*['"]?([^'"]+)['"]?/i, op: '$lte' },
    { pattern: /(\w+)\s+LIKE\s+['"](.+)['"]/i, op: '$regex' }
  ];

  for (const { pattern, op } of operators) {
    const match = whereClause.match(pattern);
    if (match) {
      const column = match[1].toLowerCase();
      let value = match[2];

      // Convert numeric strings to numbers
      if (!isNaN(value) && value.trim() !== '') {
        value = Number(value);
      }

      if (op === '$regex') {
        // Convert SQL LIKE to MongoDB regex
        const regexPattern = value.replace(/%/g, '.*').replace(/_/g, '.');
        conditions[column] = { $regex: regexPattern, $options: 'i' };
      } else {
        conditions[column] = { [op]: value };
      }
      break;
    }
  }

  // Handle AND conditions
  if (whereClause.includes(' AND ')) {
    const andParts = whereClause.split(' AND ');
    const andConditions = {};
    andParts.forEach(part => {
      const parsed = parseWhereClause(part.trim());
      Object.assign(andConditions, parsed);
    });
    return andConditions;
  }

  // Handle OR conditions (simplified)
  if (whereClause.includes(' OR ')) {
    const orParts = whereClause.split(' OR ');
    const orConditions = orParts.map(part => parseWhereClause(part.trim()));
    return { $or: orConditions };
  }

  return conditions;
}

/**
 * Get or create MongoDB model for a table
 */
const modelCache = {};

function getOrCreateModel(tableName, tableData) {
  if (modelCache[tableName]) {
    return modelCache[tableName];
  }

  // Create schema from table data
  const schemaDefinition = {};
  if (tableData.schema) {
    tableData.schema.forEach(col => {
      schemaDefinition[col.name.toLowerCase()] = {
        type: mapSQLTypeToMongoType(col.type),
        required: col.constraints?.includes('NOT NULL') || false
      };
    });
  } else if (tableData.rows && tableData.rows.length > 0) {
    // Infer schema from sample data
    const firstRow = tableData.rows[0];
    Object.keys(firstRow).forEach(key => {
      const value = firstRow[key];
      schemaDefinition[key.toLowerCase()] = {
        type: typeof value === 'number' ? Number : String
      };
    });
  }

  const schema = new mongoose.Schema(schemaDefinition, { collection: `assignment_${tableName}` });
  const Model = mongoose.model(`Assignment_${tableName}`, schema);
  modelCache[tableName] = Model;

  // Insert sample data if collection is empty
  insertSampleData(Model, tableData.rows || []);

  return Model;
}

/**
 * Map SQL types to MongoDB types
 */
function mapSQLTypeToMongoType(sqlType) {
  const upperType = sqlType.toUpperCase();
  if (upperType.includes('INT')) return Number;
  if (upperType.includes('DECIMAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) return Number;
  if (upperType.includes('BOOL')) return Boolean;
  if (upperType.includes('DATE')) return Date;
  return String;
}

/**
 * Insert sample data into MongoDB collection
 */
async function insertSampleData(Model, rows) {
  try {
    const count = await Model.countDocuments();
    if (count === 0 && rows.length > 0) {
      // Convert rows to lowercase keys
      const documents = rows.map(row => {
        const doc = {};
        Object.keys(row).forEach(key => {
          doc[key.toLowerCase()] = row[key];
        });
        return doc;
      });
      await Model.insertMany(documents);
    }
  } catch (error) {
    console.error(`Error inserting sample data for ${Model.modelName}:`, error.message);
  }
}

