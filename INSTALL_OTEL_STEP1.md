# INSTALLING OPENTELEMETRY STEP 1

## v1 - Add auto-instrumentation to your code

  - Follow the steps below for each nodejs component, ie `/web` and `/service`

  - Update `package.json` file to add OpenTelemetry dependencies, add libraries below
  Go to each component folder and install OpenTelemetry required modules
  ```bash
  npm install @opentelemetry/sdk-node @opentelemetry/api @opentelemetry/auto-instrumentations-node
  ```

  - In each component `/src` folder, create a `tracing.js` file with code below
  ```java
  const opentelemetry = require("@opentelemetry/sdk-node");
  const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");

  const sdk = new opentelemetry.NodeSDK({
    traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
    instrumentations: [getNodeAutoInstrumentations()]
  });

  sdk.start()
  ```

  - Update the start script to add `tracing.js` as Requirement
    - edit file `nodemon.json` and replace `node ./src/index.js` by
    ```
    node --require ./src/tracing.js ./src/index.js
    ```

  - Rebuild your application containers with
  ```bash
  docker-compose up --build
  ```

  - Test again your application going to http://localhost:4000 and http://localhost:4001/api/data
    - you should see a json trace file in the logs of each component, like:
    ```
        {web              |   traceId: '96c2e7afc176f9ac78c19a5ea37fda35',
        web               |   parentId: 'c0e5186081aa61b2',
        ...
        web               |   status: { code: 0 },
        web               |   events: []
        web               | }
    ```
