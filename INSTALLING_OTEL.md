# INSTALLING OPENTELEMETRY

## Explaining the different version of files

You will find files in different versions in this repository

  - `v0` are the original files without any Otel instrumentation
  - `v1` are files with Otel Instrumentation sending output (traces or metrics) to console logs
  - `v2` are files with Otel Instrumentation sending output to otel-collector
    - `v2a` is using on HTTP protocol for sending traces
    - `v2b` is using on GRPC protocol for sending traces
  - `v3` are files with Otel Instrumentation sending output to otel-collector (using grpc), and otel-Collector sending them to different backends (Jaeger and Lightstep)
  - `v4` are files when we add custom attributes, log events, and new spans to the auto-instrumentation
  - `v5` are files when we add metrics
  - `v6` are files when we add custom metrics to the auto-instrumentation

If you don't find files in a specific version, it may just be because this file is not impacted by the new features we are adding


## v1 - Add auto-instrumentation to your code

  - Follow the steps below for each nodejs component, ie `/web` and `/service`

  - Update `package.json`file to add OpenTelemetry dependencies, add libraries below
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
    ```json
    {
web               |   traceId: '96c2e7afc176f9ac78c19a5ea37fda35',
web               |   parentId: 'c0e5186081aa61b2',
...
web               |   status: { code: 0 },
web               |   events: []
web               | }
  ```


## v2a - Add OpenTelemetry collector (http)

- Edit `docker-compose.yml` file in root folder
  - add an OpenTelemetry collector container using lines below (note we will use the collector from contrib community as it contains more receivers, processors and exporters)
```yaml
otel-collector:
  image: otel/opentelemetry-collector-contrib:0.40.0
  container_name: otel-collector
  ports:
    # This is default port for listening to GRPC protocol
    - 4317:4317
    # This is default port for listening to HTTP protocol
    - 4318:4318
    # This is default port for zpages debugging
    - 55679:55679
  volumes:
    - ./otel-collector/conf:/etc/otel
```

- Edit again the `docker-compose.yml` file to set nodeJS modules to export to our new OpenTelemetry Collector
  - in the `environment` section for each nodeJS container, add the variables below (an alternative would be to put these properties directly in `tracing.js` code)
```yaml
#environment:
  - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
  - OTEL_RESOURCE_ATTRIBUTES=service.name=<web or service depending on the container>
```

- Create a file `config.yaml` in folder `/otel-collector/conf`

- Edit the file and put content below
```yaml
extensions:
  # This extension is used to provide a debugging zpages traces_endpoint
  # see https://github.com/open-telemetry/opentelemetry-collector/blob/main/extension/zpagesextension/README.md for more details
  zpages:
    endpoint: 0.0.0.0:55679

receivers:
  # Default receiver to collect trace and metrics received from grpc and http protocols
  # Default is port 4317 for grpc and 4318 for http
  otlp:
    protocols:
      grpc:
      http:

processors:
  # Recommended processor to proceed sending of traces or metrics in batch mode (requires less resources)
  batch:

exporters:
  # Debugging exporter directly to system log
  logging:
    loglevel: debug

service:
  pipelines:
    # Simple trace pipeline that will send all traces received from otlp protocol to the logs in batch mode
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]

  # Activate the extension that will allow us to debug this configuration from the collector web interface on port 55679 by default
  extensions: [zpages]
```

- For sending traces using http protocol

- Go to each component (web and service), and install the module to export traces to collector through otlp protocol by running
```bash
npm install @opentelemetry/exporter-trace-otlp-http
```

- Go to each component `/src` folder and update `tracing.js` code with code below
  - import a new const, by adding line
  ```java
  const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
  ```
  (at the beginning of the file where all const are defined)

  - Replace the console exporter
    - replace `traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),`
    - by `traceExporter: new OTLPTraceExporter({}),`
      (you can put the collector URL as property here instead of using environment variables in docker-compose, simply replace `{}` by `{url: 'http://otel-collector:4318/v1/traces'}`

- Rebuild and restart you docker-compose `docker-compose up --build`

- Test standalone your collector by sending him a trace
  - from `./otel-collector` folder, run
  ```bash
  curl -iv -H "Content-Type: application/json" http://127.0.0.1:4318/v1/traces -d @./test/small_data.json
  ```
  - both in the otel-collector container console and in page http://127.0.0.1:55679/debug/tracez, you should see a new trace appearing

- Now test again your application on pages http://127.0.0.1:4000 and http://127.0.0.1:4000/api/data
  - you should also see trace appearing in your collector console


## v2b - Add OpenTelemetry collector (grpc)

- Instructions are very similar to the one for http, except you replace everywhere `http` by `grpc`

- Beware of the following exceptions:
  - you don't have to update the collector `config.yaml` as we expose receivers for both protocols

  - the port for grpc is 4317 (it replaces 4318 for http)

  - for nodeJS, install module `@opentelemetry/exporter-trace-otlp-grpc`
  ```bash
  npm install @opentelemetry/exporter-trace-otlp-grpc
  ```

  - if you want to put url in your code, you should use
  ```
  {url: 'grpc://otel-collector:4317'}``` (no more `/v1/traces`)
  ```

  - for example, in docker-compose, the endpoint variable is now
```
    - OTEL_EXPORTER_OTLP_ENDPOINT=grpc://otel-collector:4317
```

  - should you use grpc or http? It depends on your tools/framework support. if possible use grpc as it is http/v2 and more performant, but some tools or framework still don't support it well (ex: GCP Cloud run containers)

- Once done, don't forget to rebuild and restart you docker-compose `docker-compose up --build`


## v3 - Add backends

Here, we will add a local and a remote backend behind the collector in order to provide gui and analysis tools to our traces.

- Edit the collector `config.yaml` file
  - in the `exporters:` section, add the following
```yaml
exporters:
  logging:
    loglevel: debug

  # configuring otlp to Lightstep public satellites
  otlp/lightstep:
    endpoint: ingest.lightstep.com:443
    headers:
      "lightstep-access-token": "${LIGHTSTEP_ACCESS_TOKEN}"
    tls:
      insecure: false
      insecure_skip_verify: true
#      cert_file: file.cert
#      key_file: file.key
#      ca_file:

  # configure collector to send data to jaeger
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true
```

  - in the `services:` section, edit your `traces:` pipeline with the following
```
pipelines:
  traces:
    receivers: [otlp]
    processors: [batch]
    exporters: [logging, jaeger, otlp/lightstep]
```
  - save you updates

- Edit the `docker-compose.yml` file
  - add the jaeger container
```
jaeger:
  image: jaegertracing/all-in-one:1.30
  container_name: jaeger
  ports:
    - 14250:14250
    - 16686:16686
```

  - add an environment variable for your otel collector container
```
environment:
  - LIGHTSTEP_ACCESS_TOKEN=${LIGHTSTEP_ACCESS_TOKEN}
```

- On the shell windows where you run your docker-compose command, export the value of you LIGHTSTEP_ACCESS_TOKEN:
```bash
export LIGHTSTEP_ACCESS_TOKEN=<YOUR_VALUE>
```

- Restart you docker-compose (no need to rebuild as we don't change code)
```bash
docker-compose up
```

- Test again you application with http://localhost:4000 and http://localhost:4001/Api/data and look at results in
  - zpages: http://127.0.0.1:55679/debug/tracez
  - jaeger: http://localhost:16686/search
  - lightstep: https://app.lightstep.com/<your_project>/explorer


## v4 - Add custom attributes and log events

- Edit `docker-compose.yml` file, for each line `- OTEL_RESOURCE_ATTRIBUTES=service.name=<yourServiceName>`, add a new attribute `service.version=4.0.0` with a comma separator, so lines become something like
```
- OTEL_RESOURCE_ATTRIBUTES=service.name=<yourServiceName>,service.version=4.0.0
```

- In `/src` folder of the web component, update file `index.js` file with code below:
    - Add the OpenTelemetry library by putting this at top of your code
    ```java
    const api = require('@opentelemetry/api');
    ```

    - in the `main()` function, in the `app.get("/", (req, res) => {` part, add code to create custom attributes
```java
// access the current span from active context
let activeSpan = api.trace.getSpan(api.context.active());
// add an attribute
activeSpan.setAttribute('nbLoop', nbLoop);
activeSpan.setAttribute('weather', weather);
```

- In the `main()` function, in the `app.get("/api/data", (req, res) => {` part, add code to create custom log events
```java
  // access the current span from active context
  let activeSpan = api.trace.getSpan(api.context.active());
  // log an event and include some structured data.
  activeSpan.addEvent(`Running on http://${HOST}:${PORT}`);
```

- Replace the `generateWork` function with code below
```java
async function generateWork(nb) {
  for (let i = 0; i < Number(nb); i++) {
    let span = tracer.startSpan(`Looping ${i}`);
    // log an event and include some structured data.
    span.addEvent(`*** DOING SOMETHING ${i}`);
    // wait for 50ms to simulate some work
    await sleep(50);
    span.end();
  }
}
```


## v5 - Add resources metrics


## v6 - Add custom metrics to your traces



## Resources

OpenTelemetry for nodeJS
https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/

Official OpenTelemetry Collector containers in docker hub
https://hub.docker.com/r/otel/opentelemetry-collector
https://hub.docker.com/r/otel/opentelemetry-collector-contrib

OpenTelemetry Collector Github Project
https://github.com/open-telemetry/opentelemetry-collector
https://github.com/open-telemetry/opentelemetry-collector-contrib

OpenTelemetry NodeJS Github project
https://github.com/open-telemetry/opentelemetry-js

OpenTelemetry eLearning



## Troubleshoot

- getting error `"error": "Permanent error: rpc error: code = Internal desc = unexpected HTTP status code received from server: 400 (Bad Request); malformed header: missing HTTP content-type"` when sending spans to Lightstep
  => check value of your LIGHTSTEP_ACCESS_TOKEN with `echo $LIGHTSTEP_ACCESS_TOKEN`
  => if not set, initialize it with `export LIGHTSTEP_ACCESS_TOKEN=<YOUR_VALUE>` then deploy again with `docker-compose up`
