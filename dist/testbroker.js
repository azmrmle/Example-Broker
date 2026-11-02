
metadata = {
  systemName: "com.k2.testbroker",
  displayName: "Test JSSP Broker",
  description: "Simple test broker for K2"
};

ondescribe = function () {
  postSchema({
    objects: {
      test: {
        displayName: "Test",
        description: "Simple test object",
        properties: {
          message: {
            displayName: "Message",
            type: "string"
          }
        },
        methods: {
          get: {
            displayName: "Get Message",
            type: "read",
            outputs: ["message"]
          }
        }
      }
    }
  });
};

onexecute = function (context) {
  if (context.objectName === "test" &&
      context.methodName === "get") {
    postResult({
      message: "Hello from K2 JSSP!"
    });
  } else {
    throw new Error("Unsupported method");
  }
};
