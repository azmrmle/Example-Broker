
metadata = {
    systemName: "com.k2.cloudconvertpdf",
    displayName: "CloudConvert PDF",
    description: "DOCX to PDF using CloudConvert Base64 API",
    configuration: {
        CloudConvertApiKey: {
            displayName: "CloudConvert API Key",
            type: "string",
            required: true
        },
        CloudConvertBaseUrl: {
            displayName: "CloudConvert API Base URL",
            type: "string",
            required: true,
            value: "https://api.cloudconvert.com/v2"
        }
    }
};

ondescribe = async function ({ configuration }) {
    postSchema({
        objects: {
            converter: {
                displayName: "CloudConvert Converter",
                properties: {
                    fileName: {
                        displayName: "File Name",
                        type: "string"
                    },
                    base64Content: {
                        displayName: "Base64 Content",
                        type: "string"
                    },
                    jobId: {
                        displayName: "Job ID",
                        type: "string"
                    },
                    jobStatus: {
                        displayName: "Job Status",
                        type: "string"
                    },
                    pdfUrl: {
                        displayName: "PDF URL",
                        type: "string"
                    },
                    pdfFileName: {
                        displayName: "PDF File Name",
                        type: "string"
                    },
                    errorMessage: {
                        displayName: "Error Message",
                        type: "string"
                    }
                },
                methods: {
                    createJob: {
                        displayName: "Create Conversion Job",
                        type: "read",
                        inputs: [
                            "fileName",
                            "base64Content"
                        ],
                        requiredInputs: [
                            "fileName",
                            "base64Content"
                        ],
                        outputs: [
                            "jobId",
                            "jobStatus",
                            "errorMessage"
                        ]
                    },
                    getResult: {
                        displayName: "Get Conversion Result",
                        type: "read",
                        inputs: ["jobId"],
                        requiredInputs: ["jobId"],
                        outputs: [
                            "jobId",
                            "jobStatus",
                            "pdfUrl",
                            "pdfFileName",
                            "errorMessage"
                        ]
                    }
                }
            }
        }
    });
};

// Send JSON HTTP requests through JSSP.
function sendRequest(method, url, apiKey, body) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return;
            }

            var status = xhr.status;
            var response;

            try {
                response = JSON.parse(xhr.responseText || "{}");
            } catch (e) {
                reject(new Error(
                    "Invalid JSON response. HTTP " + status
                ));
                return;
            }

            if (status < 200 || status >= 300) {
                var detail = response.message ||
                    (response.error && response.error.message) ||
                    "API request failed";

                reject(new Error(
                    "CloudConvert HTTP " + status +
                    ": " + String(detail)
                ));
                return;
            }

            resolve(response);
        };

        xhr.onerror = function () {
            reject(new Error(
                "CloudConvert network request failed"
            ));
        };

        xhr.ontimeout = function () {
            reject(new Error(
                "CloudConvert API request timed out"
            ));
        };

        try {
            xhr.open(method, url, true);
            xhr.timeout = 60000;

            xhr.setRequestHeader(
                "Authorization",
                "Bearer " + apiKey
            );

            xhr.setRequestHeader(
                "Accept",
                "application/json"
            );

            if (body !== null) {
                xhr.setRequestHeader(
                    "Content-Type",
                    "application/json"
                );
            }

            xhr.send(
                body === null ? null : JSON.stringify(body)
            );
        } catch (e) {
            reject(e);
        }
    });
}

onexecute = async function ({
    objectName,
    methodName,
    properties,
    configuration
}) {
    if (objectName !== "converter") {
        throw new Error("Unsupported object");
    }

    var apiKey = String(
        configuration.CloudConvertApiKey || ""
    );

    var baseUrl = String(
        configuration.CloudConvertBaseUrl || ""
    ).replace(/\/+$/, "");

    if (!apiKey) {
        throw new Error(
            "CloudConvert API key is not configured"
        );
    }

    // Only allow the intended CloudConvert endpoints.
    var allowedUrls = [
        "https://api.cloudconvert.com/v2",
        "https://sandbox.api.cloudconvert.com/v2",
        "https://eu-central.api.cloudconvert.com/v2",
        "https://us-east.api.cloudconvert.com/v2"
    ];

    if (allowedUrls.indexOf(baseUrl) === -1) {
        throw new Error(
            "Unapproved CloudConvert API endpoint"
        );
    }

    if (methodName === "createJob") {

        var fileName = String(
            properties.fileName || ""
        );

        var base64 = String(
            properties.base64Content || ""
        ).trim();

        // Keep this POC limited to small DOCX files.
        if (!/^[a-zA-Z0-9_.-]+\.docx$/i.test(fileName) ||
            fileName.indexOf("..") !== -1) {
            throw new Error("Invalid DOCX file name");
        }

        if (!base64 ||
            base64.length > 14000000 ||
            base64.length % 4 !== 0 ||
            !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
            throw new Error(
                "Invalid or oversized Base64 input"
            );
        }

        var body = {
            tasks: {
                "import-docx": {
                    operation: "import/base64",
                    filename: fileName,
                    file: base64
                },
                "convert-pdf": {
                    operation: "convert",
                    input: "import-docx",
                    input_format: "docx",
                    output_format: "pdf"
                },
                "export-pdf": {
                    operation: "export/url",
                    input: "convert-pdf"
                }
            }
        };

        var result = await sendRequest(
            "POST",
            baseUrl + "/jobs",
            apiKey,
            body
        );

        postResult({
            jobId: result.data.id || "",
            jobStatus: result.data.status || "",
            errorMessage: ""
        });

        return;
    }

    if (methodName === "getResult") {

        var jobId = String(
            properties.jobId || ""
        ).trim();

        if (!/^[a-zA-Z0-9-]{1,100}$/.test(jobId)) {
            throw new Error("Invalid Job ID");
        }

        var result = await sendRequest(
            "GET",
            baseUrl + "/jobs/" +
                encodeURIComponent(jobId),
            apiKey,
            null
        );

        var data = result.data || {};
        var tasks = data.tasks || [];

        var pdfUrl = "";
        var pdfFileName = "";
        var errorMessage = "";

        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];

            if (task.status === "error") {
                errorMessage = String(
                    task.message || task.code ||
                    "Conversion task failed"
                );
            }

            if (task.operation === "export/url" &&
                task.status === "finished" &&
                task.result &&
                task.result.files &&
                task.result.files.length > 0) {

                pdfUrl = task.result.files[0].url || "";
                pdfFileName =
                    task.result.files[0].filename || "";
            }
        }

        postResult({
            jobId: data.id || jobId,
            jobStatus: data.status || "",
            pdfUrl: pdfUrl,
            pdfFileName: pdfFileName,
            errorMessage: errorMessage
        });

        return;
    }

    throw new Error("Unsupported method");
};
