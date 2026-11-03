
metadata = {
    systemName: "com.k2.docxretriever",
    displayName: "DOCX Retriever",
    description: "Check and retrieve DOCX metadata from K2 IIS",
    configuration: {
        allowedOrigin: {
            displayName: "Allowed DOCX Origin",
            type: "string",
            required: true,
            value: "https://stqnintexk2.strateqlab.com"
        }
    }
};

ondescribe = async function ({ configuration }) {
    postSchema({
        objects: {
            document: {
                displayName: "DOCX Document",
                properties: {
                    documentURL: {
                        displayName: "Document URL",
                        type: "string"
                    },
                    httpStatus: {
                        displayName: "HTTP Status",
                        type: "number"
                    },
                    contentType: {
                        displayName: "Content Type",
                        type: "string"
                    },
                    byteCount: {
                        displayName: "Byte Count",
                        type: "number"
                    },
                    resultStatus: {
                        displayName: "Result Status",
                        type: "string"
                    },
                    message: {
                        displayName: "Message",
                        type: "string"
                    }
                },
                methods: {
                    checkDocument: {
                        displayName: "Check Document",
                        type: "read",
                        inputs: ["documentURL"],
                        requiredInputs: ["documentURL"],
                        outputs: [
                            "documentURL",
                            "httpStatus",
                            "contentType",
                            "byteCount",
                            "resultStatus",
                            "message"
                        ]
                    }
                }
            }
        }
    });
};

onexecute = async function ({
    objectName,
    methodName,
    properties,
    configuration
}) {
    if (objectName !== "document" ||
        methodName !== "checkDocument") {
        throw new Error("Unsupported method");
    }

    var url = String(properties.documentURL || "");
    var allowedOrigin = String(
        configuration.allowedOrigin || ""
    ).replace(/\/$/, "");

    // Restrict document retrieval to the approved IIS location.
    var prefix = allowedOrigin + "/GeneratedDocs/";

    if (!allowedOrigin ||
        url.indexOf(prefix) !== 0 ||
        url.indexOf("@") !== -1 ||
        url.indexOf("#") !== -1 ||
        url.indexOf("\\") !== -1 ||
        url.indexOf("..") !== -1 ||
        !/\.docx(?:\?.*)?$/i.test(url)) {
        throw new Error("Document URL is not allowed");
    }

    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;

            try {
                var status = xhr.status;
                var type = xhr.getResponseHeader(
                    "Content-Type"
                ) || "";

                var count = 0;
                var message = "";
                var resultStatus = "FAILED";

                if (status >= 200 && status < 300) {
                    var response = xhr.response;

                    if (response &&
                        typeof response.byteLength === "number") {
                        count = response.byteLength;
                        resultStatus = "SUCCESS";
                        message = "Binary response received";
                    } else {
                        message =
                            "Binary ArrayBuffer response unavailable";
                    }
                } else {
                    message = "HTTP request failed: " + status;
                }

                postResult({
                    documentURL: url,
                    httpStatus: status,
                    contentType: type,
                    byteCount: count,
                    resultStatus: resultStatus,
                    message: message
                });

                resolve();
            } catch (err) {
                reject(err);
            }
        };

        xhr.onerror = function () {
            reject(new Error("DOCX HTTP request failed"));
        };

        xhr.ontimeout = function () {
            reject(new Error("DOCX request timed out"));
        };

        try {
            xhr.open("HEAD", url, true);
            xhr.timeout = 30000;
            xhr.send();
        } catch (err) {
            reject(err);
        }
    });
};
