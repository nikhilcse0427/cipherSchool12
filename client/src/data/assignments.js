// Sample SQL Assignment Data
export const assignments = [
  {
    id: 1,
    title: "Basic SELECT Queries",
    description: "Learn to retrieve data from a single table",
    difficulty: "Easy",
    question: "Write a SQL query to retrieve all employees from the employees table.",
    expectedColumns: ["id", "name", "department", "salary"],
    sampleData: {
      employees: {
        schema: [
          { name: "id", type: "INTEGER" },
          { name: "name", type: "VARCHAR" },
          { name: "department", type: "VARCHAR" },
          { name: "salary", type: "DECIMAL" }
        ],
        rows: [
          { id: 1, name: "John Doe", department: "Engineering", salary: 75000 },
          { id: 2, name: "Jane Smith", department: "Marketing", salary: 65000 },
          { id: 3, name: "Bob Johnson", department: "Engineering", salary: 80000 },
          { id: 4, name: "Alice Williams", department: "Sales", salary: 60000 },
          { id: 5, name: "Charlie Brown", department: "Engineering", salary: 70000 }
        ]
      }
    }
  },
  {
    id: 2,
    title: "Filtering with WHERE",
    description: "Use WHERE clause to filter data",
    difficulty: "Easy",
    question: "Write a SQL query to find all employees in the Engineering department with a salary greater than 70000.",
    expectedColumns: ["id", "name", "department", "salary"],
    sampleData: {
      employees: {
        schema: [
          { name: "id", type: "INTEGER" },
          { name: "name", type: "VARCHAR" },
          { name: "department", type: "VARCHAR" },
          { name: "salary", type: "DECIMAL" }
        ],
        rows: [
          { id: 1, name: "John Doe", department: "Engineering", salary: 75000 },
          { id: 2, name: "Jane Smith", department: "Marketing", salary: 65000 },
          { id: 3, name: "Bob Johnson", department: "Engineering", salary: 80000 },
          { id: 4, name: "Alice Williams", department: "Sales", salary: 60000 },
          { id: 5, name: "Charlie Brown", department: "Engineering", salary: 70000 }
        ]
      }
    }
  },
  {
    id: 3,
    title: "Sorting Results",
    description: "Use ORDER BY to sort query results",
    difficulty: "Easy",
    question: "Write a SQL query to retrieve all employees ordered by salary in descending order.",
    expectedColumns: ["id", "name", "department", "salary"],
    sampleData: {
      employees: {
        schema: [
          { name: "id", type: "INTEGER" },
          { name: "name", type: "VARCHAR" },
          { name: "department", type: "VARCHAR" },
          { name: "salary", type: "DECIMAL" }
        ],
        rows: [
          { id: 1, name: "John Doe", department: "Engineering", salary: 75000 },
          { id: 2, name: "Jane Smith", department: "Marketing", salary: 65000 },
          { id: 3, name: "Bob Johnson", department: "Engineering", salary: 80000 },
          { id: 4, name: "Alice Williams", department: "Sales", salary: 60000 },
          { id: 5, name: "Charlie Brown", department: "Engineering", salary: 70000 }
        ]
      }
    }
  },
  {
    id: 4,
    title: "JOIN Operations",
    description: "Join multiple tables to combine data",
    difficulty: "Medium",
    question: "Write a SQL query to retrieve employee names along with their department names. Join the employees table with the departments table.",
    expectedColumns: ["employee_name", "department_name"],
    sampleData: {
      employees: {
        schema: [
          { name: "id", type: "INTEGER" },
          { name: "name", type: "VARCHAR" },
          { name: "department_id", type: "INTEGER" },
          { name: "salary", type: "DECIMAL" }
        ],
        rows: [
          { id: 1, name: "John Doe", department_id: 1, salary: 75000 },
          { id: 2, name: "Jane Smith", department_id: 2, salary: 65000 },
          { id: 3, name: "Bob Johnson", department_id: 1, salary: 80000 },
          { id: 4, name: "Alice Williams", department_id: 3, salary: 60000 }
        ]
      },
      departments: {
        schema: [
          { name: "id", type: "INTEGER" },
          { name: "name", type: "VARCHAR" },
          { name: "location", type: "VARCHAR" }
        ],
        rows: [
          { id: 1, name: "Engineering", location: "Building A" },
          { id: 2, name: "Marketing", location: "Building B" },
          { id: 3, name: "Sales", location: "Building C" }
        ]
      }
    }
  },
  {
    id: 5,
    title: "Aggregate Functions",
    description: "Use COUNT, SUM, AVG functions",
    difficulty: "Medium",
    question: "Write a SQL query to find the average salary for each department.",
    expectedColumns: ["department", "avg_salary"],
    sampleData: {
      employees: {
        schema: [
          { name: "id", type: "INTEGER" },
          { name: "name", type: "VARCHAR" },
          { name: "department", type: "VARCHAR" },
          { name: "salary", type: "DECIMAL" }
        ],
        rows: [
          { id: 1, name: "John Doe", department: "Engineering", salary: 75000 },
          { id: 2, name: "Jane Smith", department: "Marketing", salary: 65000 },
          { id: 3, name: "Bob Johnson", department: "Engineering", salary: 80000 },
          { id: 4, name: "Alice Williams", department: "Sales", salary: 60000 },
          { id: 5, name: "Charlie Brown", department: "Engineering", salary: 70000 },
          { id: 6, name: "Diana Prince", department: "Marketing", salary: 70000 }
        ]
      }
    }
  }
];

