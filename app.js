const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
var isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertToResponse = (eachData) => {
  return {
    id: eachData.id,
    todo: eachData.todo,
    priority: eachData.priority,
    status: eachData.status,
    category: eachData.category,
    dueDate: eachData.due_date,
  };
};

const hasStatus = (status) => {
  return status !== undefined;
};

const hasPriority = (priority) => {
  return priority !== undefined;
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategory = (category) => {
  return category !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
app.get("/todos/", async (request, response) => {
  let getTodoQuery;
  const { search_q, priority, status, category } = request.query;
  switch (true) {
    case hasStatus(status):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
                SELECT *
                FROM
                todo
                WHERE
                 status='${status}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachData) => convertToResponse(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(priority):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
                    SELECT *
                    FROM 
                    todo
                    WHERE
                      priority='${priority}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachData) => convertToResponse(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                    SELECT *
                    FROM 
                    todo
                    WHERE
                      priority='${priority}'
                      AND status='${status}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachData) => convertToResponse(eachData)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                    SELECT *
                    FROM 
                    todo
                    WHERE
                      category='${category}'
                      AND status='${status}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachData) => convertToResponse(eachData)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategory(category):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
                    SELECT *
                    FROM 
                    todo
                    WHERE
                      category='${category}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachData) => convertToResponse(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `
                    SELECT *
                    FROM 
                    todo
                    WHERE
                      category='${category}'
                      AND priority='${priority}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachData) => convertToResponse(eachData)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodoQuery = `
                    SELECT *
                    FROM 
                    todo
                    WHERE
                      todo LIKE '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachData) => convertToResponse(eachData)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `
            SELECT *
            FROM
            todo
            WHERE
              id=${todoId};`;
  data = await db.get(getQuery);
  response.send(convertToResponse(data));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isValid(new Date(date), "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getQuery = `
                SELECT
                *
                FROM
                todo
                WHERE
                  due_date='${newDate}';`;
    const data = await db.all(getQuery);
    response.send(data.map((eachData) => convertToResponse(eachData)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (isValid(new Date(dueDate), "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const addTodoQuery = `
            INSERT INTO
             todo(id,todo,priority,status,category,due_date)
             VALUES
             (
                 '${id}','${todo}','${priority}','${status}','${category}','${newDate}'
             );`;
          const dbResponse = await db.run(addTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const previousQuery = `
            SELECT *
            FROM 
            todo
            WHERE
              id=${todoId};`;
  const preTodo = await db.get(previousQuery);
  const {
    todo = preTodo.todo,
    priority = preTodo.priority,
    status = preTodo.status,
    category = preTodo.category,
    dueDate = preTodo.due_date,
  } = request.body;

  let updateQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateQuery = `
                        UPDATE todo
                        SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
                        WHERE
                          id=${todoId};`;
        await db.run(updateQuery);
        console.log("saikumar");
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateQuery = `
                        UPDATE todo
                        SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
                        WHERE
                          id=${todoId};`;
        await db.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateColumn = "Status";
        updateQuery = `
                        UPDATE todo
                        SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
                        WHERE
                          id=${todoId};`;
        await db.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Status";
      updateQuery = `
                        UPDATE todo
                        SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
                        WHERE
                          id=${todoId};`;
      await db.run(updateQuery);
      response.send("Todo Updated");
      break;
    case requestBody.dueDate !== undefined:
      if (isValid(new Date(dueDate), "yyyy-MM-dd")) {
        updateQuery = `
                        UPDATE todo
                        SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
                        WHERE
                          id=${todoId};`;
        await db.run(updateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
            DELETE 
            FROM
            todo
            WHERE
             id='${todoId}';`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
