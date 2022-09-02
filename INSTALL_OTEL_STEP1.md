# INSTALLING OPENTELEMETRY STEP 1

# AUTO-INSTRUMENTATION

In this step, we will auto-instrument our nodeJS application to collect traces and send all this information directly to the log each component of our application.


## Add auto-instrumentation to your code

- In `/opentelemetry/src` folder, create a `tracing.js` file with code below
```java
const opentelemetry = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start()
```

- Edit `docker-compose.yml` file to add this `tracing.js` library to each of our service containers
  - in the `volumes` section for each nodeJS container (`web` and `service`), add the line below
  ```yaml
  #volumes:
    - ./opentelemetry/src/tracing.js:/usr/src/app/src/tracing.js:z
  ```

- Follow the steps below for each nodejs component, ie `/web` and `/service`

  - Update `package.json` file to add OpenTelemetry dependencies:
  ```json
  "dependencies": {
    "@opentelemetry/api": "^1.0.4",
    "@opentelemetry/auto-instrumentations-node": "^0.28.0",
    "@opentelemetry/sdk-node": "^0.28.0",
    ...
  }
  ```

  - Update the start script to add `tracing.js` as Requirement
    - edit file `nodemon.json` and replace `node ./src/index.js` by
    ```
    node --require ./src/tracing.js ./src/index.js
    ```


## Rebuild and test

- Rebuild your application containers with
```bash
docker-compose up --build
```

- Test again your application going to http://localhost:4000 and http://localhost:4000/api/data
  - you should see a json trace file in the logs of each component, like:
  ```
      {web              |   traceId: '96c2e7afc176f9ac78c19a5ea37fda35',
      web               |   parentId: 'c0e5186081aa61b2',
      ...
      web               |   status: { code: 0 },
      web               |   events: []
      web               | }
  ```
