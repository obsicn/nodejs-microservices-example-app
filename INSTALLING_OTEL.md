# INSTALLING OPENTELEMETRY

## Explaining the different version of files

You will find files in different versions in this repository

  - `v0` are the original files without any Otel instrumentation
  - `v1` are files with Otel Instrumentation sending output (traces or metrics) to console logs
  - `v2` are files with Otel Instrumentation sending output to otel-collector
    - `v2a` is using on HTTP protocol for sending traces
    - `v2b` is using on GRPC protocol for sending traces
  - `v3` are files with Otel Instrumentation sending output to otel-collector, and otel-Collector sending them to different backends (Jaeger and Lightstep)


## v1 - Add auto-instrumentation to your code

  - Follow the steps below for each nodejs component, ie `/web` and `/service`

  - Go to each component folder and install OpenTelemetry required modules
  ```
  npm install @opentelemetry/sdk-node @opentelemetry/api
  npm install @opentelemetry/auto-instrumentations-node
  ```

  - Add in each folder a `tracing.js` file with code below
  ```
  const opentelemetry = require("@opentelemetry/sdk-node");
  const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");

  const sdk = new opentelemetry.NodeSDK({
    traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
    instrumentations: [getNodeAutoInstrumentations()]
  });

  sdk.start()
  ```

  - Update the start script to add `tracing.js` as Requirement
    - edit file `nodemon.json` and replace `node ./src/index.js` by `node --require ./src/tracing.js ./src/index.js`

  - Rebuild your application containers with `docker-compose up --build`

  - Test again your application going to http://localhost:4000 and http://localhost:4001/api/data
    - You should see a Json trace file in the logs of each component, like:
    ```
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
```
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
```
#environment:
  - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
  - OTEL_RESOURCE_ATTRIBUTES=service.name=<web or service depending on the container>
```

- Create a file `config.yaml` in folder `/otel-collector/conf`

- Edit the file and put content below
```
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

- Go to each component (web and service), and install the module to export traces to collector through otlp protocol by running `npm install @opentelemetry/exporter-trace-otlp-http`

- Go to each component `/src` folder and update `tracing.js` code with code below
  - import a new const, by adding line
  `const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');`
  (at the beginning of the file where all const are defined)

  - replace the console exporter
    - replace `traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),`
    - by `traceExporter: new OTLPTraceExporter({}),`
      (you can put the collector URL as property here instead of using environment variables in docker-compose, simply replace `{}` by `{url: 'http://otel-collector:4318/v1/traces'}`

- Rebuild and restart you docker-compose `docker-compose up --build`

- Test standalone your collector by sending him a trace
  - from `./otel-collector` folder, run `curl -iv -H "Content-Type: application/json" http://127.0.0.1:4318/v1/traces -d @./test/small_data.json`
  - Both in the otel-collector container console and in page http://127.0.0.1:55679/debug/tracez, you should see a new trace appearing

- Now test again your application on pages http://127.0.0.1:4000 and http://127.0.0.1:4000/api/data
  - you should also see trace appearing in your collector console


## v2b - Add OpenTelemetry collector (grpc)

- Instructions are very similar to the one for http, except you replace everywhere `http` by `grpc`

- beware of the following exceptions:
  - you don't have to update the collector `config.yaml` as we expose receivers for both protocols
  - the port for grpc is 4317 (it replaces 4318 for http)
  - for nodeJS, install module `@opentelemetry/exporter-trace-otlp-grpc` and if you want to put url in your code, you should use `{url: 'grpc://otel-collector:4317'}` (no more `/v1/traces`)

  - for example, in docker-compose, the endpoint variable is now

    `- OTEL_EXPORTER_OTLP_ENDPOINT=grpc://otel-collector:4317`

  - Should you use grpc or http? It depends on your tools/framework support. if possible use grpc as it is http/v2 and more performant, but some tools or framework still don't support it well (ex: GCP Cloud run containers)


## v3 - Add back-ends

- OpenTelemetry instrumentation was added with below changes
  - installing opentelemetry libraries for `web`and `service`
  - Add jaeger and opentelemetry collector contrib container in `docker-compose.yml` file
  - Add `/otel-collector` folder with collector configuration file and source file for auto-instrumentation
  - Add auto-instrumentation of nodejs code each time the runtime is started by updating `nodemon.json` file (see https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/)
  - Start the containers with build option the first time `docker-compose up --build`


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
