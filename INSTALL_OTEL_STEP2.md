# INSTALLING OPENTELEMETRY STEP 2

For this step, you have 2 different options to connect between OTel SDK and the collector, either using HTTP or GRPC protocol.

Should you use GRPC or HTTP?

It depends on your tools/framework support: if possible use GRPC as it is http/v2 and more performant, but some tools or framework still don't support it well (ex: GCP Cloud run containers) or sometimes you have gateways or firewalls that forbids GRPC.


## v2a - Add OpenTelemetry collector (HTTP)

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
    - by
    ```java
    traceExporter: new OTLPTraceExporter({}),
    ```
      (you can put the collector URL as property here instead of using environment variables in docker-compose, simply replace `{}` by `{url: 'http://otel-collector:4318/v1/traces'}`

- Rebuild and restart you docker-compose
```bash
docker-compose up --build
```

- Test standalone your collector by sending him a trace
  - from `./otel-collector` folder, run
  ```bash
  curl -iv -H "Content-Type: application/json" http://127.0.0.1:4318/v1/traces -d @./test/small_data.json
  ```
  - both in the otel-collector container console and in page http://127.0.0.1:55679/debug/tracez, you should see a new trace appearing

- Now test again your application on pages http://127.0.0.1:4000 and http://127.0.0.1:4000/api/data
  - you should also see trace appearing in your collector console


## v2b - Add OpenTelemetry collector (GRPC)

- Instructions are very similar to the one for HTTP, except you replace everywhere `http` by `grpc`

- Beware of the following exceptions:
  - you don't have to update the collector `config.yaml` as we expose receivers for both protocols

  - the port for GRPC is 4317 (it replaces 4318 for http)

  - for nodeJS, install module `@opentelemetry/exporter-trace-otlp-grpc`
  ```bash
  npm install @opentelemetry/exporter-trace-otlp-grpc
  ```

  - if you want to put url in your code, you should use
  ```
  {url: 'grpc://otel-collector:4317'}``` (no more `/v1/traces`)
  ```

  - for example, in docker-compose, the endpoint variable is now
```yaml
    - OTEL_EXPORTER_OTLP_ENDPOINT=grpc://otel-collector:4317
```

- Once done, don't forget to rebuild and restart you docker-compose
```
docker-compose up --build
```
