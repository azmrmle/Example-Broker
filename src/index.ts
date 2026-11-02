import "@k2oss/k2-broker-core";

metadata = {
  systemName: "com.k2.example",
  displayName: "Example Broker",
  description: "An example broker that accesses JSONPlaceholder.",
};

ondescribe = async function ({ configuration }): Promise<void> {
  postSchema({
    objects: {
      todo: {
        displayName: "TODO",
        description: "Manages a TODO list",
        properties: {
          id: {
            displayName: "ID",
            type: "number",
          },
          userId: {
            displayName: "User ID",
            type: "number",
          },
          title: {
            displayName: "Title",
            type: "string",
          },
          completed: {
            displayName: "Completed",
            type: "boolean",
          },
        },
        methods: {
          get: {
            displayName: "Get TODO",
            type: "read",
            inputs: ["id"],
            outputs: ["id", "userId", "title", "completed"],
          },
          getParams: {
            displayName: "Get TODO",
            type: "read",
            parameters: {
              pid: {
                displayName: "param1",
                description: "Description Of Param 1",
                type: "number",
              },
            },
            requiredParameters: ["pid"],
            outputs: ["id"],
          },
        },
      },
    },
  });
};

onexecute = async function ({
  objectName,
  methodName,
  parameters,
  properties,
  configuration,
  schema,
}): Promise<void> {
  switch (objectName) {
    case "todo":
      await onexecuteTodo(methodName, properties, parameters);
      break;
    default:
      throw new Error("The object " + objectName + " is not supported.");
  }
};

async function onexecuteTodo(
  methodName: string,
  properties: SingleRecord,
  parameters: SingleRecord
): Promise<void> {
  switch (methodName) {
    case "get":
      await onexecuteTodoGet(properties);
      break;
    case "getParams":
      await onexecuteTodoGetWithParams(parameters);
      break;
    default:
      throw new Error("The method " + methodName + " is not supported.");
  }
}

function onexecuteTodoGet(properties: SingleRecord): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      try {
        if (xhr.readyState !== 4) return;
        if (xhr.status !== 200)
          throw new Error("Failed with status " + xhr.status);

        var obj = JSON.parse(xhr.responseText);
        postResult({
          id: obj.id,
          userId: obj.userId,
          title: obj.title,
          completed: obj.completed,
        });
        resolve();
      } catch (e) {
        reject(e);
      }
    };

    if (typeof properties["id"] !== "number")
      throw new Error('properties["id"] is not of type number');
    xhr.open(
      "GET",
      "https://jsonplaceholder.typicode.com/todos/" +
        encodeURIComponent(properties["id"])
    );
    xhr.setRequestHeader("test", "test value");
    xhr.send();
  });
}

function onexecuteTodoGetWithParams(parameters: SingleRecord): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      postResult({
        id: parameters["pid"],
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}
