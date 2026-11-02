metadata = {
  systemName: "com.k2.example",
  displayName: "Example Broker",
  description: "An example broker that accesses JSONPlaceholder."
};
ondescribe = async function({ configuration: t }) {
  postSchema({
    objects: {
      todo: {
        displayName: "TODO",
        description: "Manages a TODO list",
        properties: {
          id: {
            displayName: "ID",
            type: "number"
          },
          userId: {
            displayName: "User ID",
            type: "number"
          },
          title: {
            displayName: "Title",
            type: "string"
          },
          completed: {
            displayName: "Completed",
            type: "boolean"
          }
        },
        methods: {
          get: {
            displayName: "Get TODO",
            type: "read",
            inputs: ["id"],
            outputs: ["id", "userId", "title", "completed"]
          },
          getParams: {
            displayName: "Get TODO",
            type: "read",
            parameters: {
              pid: {
                displayName: "param1",
                description: "Description Of Param 1",
                type: "number"
              }
            },
            requiredParameters: ["pid"],
            outputs: ["id"]
          }
        }
      }
    }
  });
};
onexecute = async function({
  objectName: t,
  methodName: a,
  parameters: r,
  properties: e,
  configuration: s,
  schema: o
}) {
  switch (t) {
    case "todo":
      await i(a, e, r);
      break;
    default:
      throw new Error("The object " + t + " is not supported.");
  }
};
async function i(t, a, r) {
  switch (t) {
    case "get":
      await n(a);
      break;
    case "getParams":
      await d(r);
      break;
    default:
      throw new Error("The method " + t + " is not supported.");
  }
}
function n(t) {
  return new Promise((a, r) => {
    var e = new XMLHttpRequest();
    if (e.onreadystatechange = function() {
      try {
        if (e.readyState !== 4) return;
        if (e.status !== 200)
          throw new Error("Failed with status " + e.status);
        var s = JSON.parse(e.responseText);
        postResult({
          id: s.id,
          userId: s.userId,
          title: s.title,
          completed: s.completed
        }), a();
      } catch (o) {
        r(o);
      }
    }, typeof t.id != "number")
      throw new Error('properties["id"] is not of type number');
    e.open(
      "GET",
      "https://jsonplaceholder.typicode.com/todos/" + encodeURIComponent(t.id)
    ), e.setRequestHeader("test", "test value"), e.send();
  });
}
function d(t) {
  return new Promise((a, r) => {
    try {
      postResult({
        id: t.pid
      }), a();
    } catch (e) {
      r(e);
    }
  });
}
//# sourceMappingURL=index.js.map
