# nodejs-microservices-example

Example of Node.js microservices setup using Docker, Docker-Compose and OpenTelemetry.

This is inspired from project: https://github.com/ashleydavis/nodejs-microservices-example

Need to build a microservices application? Learn how to do this with [Bootstrapping Microservices](http://bit.ly/2o0aDsP).


## Requirements

- You should have [Docker Desktop](https://www.docker.com/products/docker-desktop) installed.


## Starting the microservices application

Follow the steps in this section to boot the microservices application for development using Docker.

Change directory to the microservices application:

```bash
cd nodejs-microservices-example
```

Use Docker Compose to start the microservices application:

```bash
docker compose up
```

To build after you change code:

```bash
docker compose up --build
```


## Useful URLs for test

- Web page is available at: http://127.0.0.1:4000

- You can also query it with: http://127.0.0.1:4000?weather=XXX
  - take `sun`, `rain` or `snow` as weather value

- An example REST API is also available: http://127.0.0.1:4001/api/data

- The Mongodb database is available: (mongodb://127.0.0.1:4002)

Once deployed:

- The opentelemetry zpages for debugging are available:
  - http://127.0.0.1:55679/debug/servicez
  - http://127.0.0.1:55679/debug/tracez

- The jaeger tracing is available: http://127.0.0.1:16686

- The lightstep tracing and metrics are available: http://app.lightstep.com
  - you should first create a free account from https://app.lightstep.com/signup/developer


## Installing OpenTelemetry

You can follow the step by step approach below to install OpenTelemetry and instrument the application

If you want to rollback your files to initial application with no instrumentation, you can do it by using this release
- [v0](https://github.com/dimitrisfinas/nodejs-microservices-example/releases/tag/V0.1.0) are the original files without any Otel instrumentation


### Step 1 - Add auto-instrumentation to your code

In this step, you will auto-instrument the NodeJS application with Otel libraries and send traces output to each component console logs

- Follow instructions in file [INSTALL_OTEL_STEP1.md](/INSTALL_OTEL_STEP1.md)

- For solution, you can download release [v1](https://github.com/dimitrisfinas/nodejs-microservices-example/releases/tag/V1.0.0)


### Step 2 - Send traces to OpenTelemetry Collector

In this step, you will redirect the traces output collected before to an OpenTelemetry Collector and understand how to debug Collector behavior using console and zpages

- Follow instructions in file [INSTALL_OTEL_STEP2.md](/INSTALL_OTEL_STEP2.md)

- For solution, you can download release
  - [v2a](https://github.com/dimitrisfinas/nodejs-microservices-example/releases/tag/V2.0.0a) is using HTTP protocol to forward traces
  - [v2b](https://github.com/dimitrisfinas/nodejs-microservices-example/releases/tag/V2.0.0b) is using GRPC protocol to forward traces



### Step 3 - Send traces from Collector to External backends

In this step, we will redirect the traces output from Otel-collector to external backends (Jaeger deployed locally and Lightstep in SaaS)

- Follow instructions in file [INSTALL_OTEL_STEP3.md](/INSTALL_OTEL_STEP3.md)

- For solution, you can download release [v3](https://github.com/dimitrisfinas/nodejs-microservices-example/releases/tag/V3.0.0)


### Step 4 - Add custom attributes, log events and spans

In this step, we will add some manual instrumentation in addition to auto-instrumentation.
We will add some custom attributes, log events and also create new spans.

- Follow instructions in file [INSTALL_OTEL_STEP4.md](/INSTALL_OTEL_STEP4.md)

- For solution, you can download release [v4](https://github.com/dimitrisfinas/nodejs-microservices-example/releases/tag/V4.0.0)


### Step 5 - Add resources metrics
(TBD)


### Step 6 - Add custom metrics to your traces
(TBD)


## Resources

OpenTelemetry for nodeJS
- https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/

Official OpenTelemetry Collector containers in docker hub
- https://hub.docker.com/r/otel/opentelemetry-collector
- https://hub.docker.com/r/otel/opentelemetry-collector-contrib

OpenTelemetry Collector Github Project
- https://github.com/open-telemetry/opentelemetry-collector
- https://github.com/open-telemetry/opentelemetry-collector-contrib

OpenTelemetry NodeJS Github project
- https://github.com/open-telemetry/opentelemetry-js

OpenTelemetry eLearning video (1h10min)
- https://www.youtube.com/watch?v=r8UvWSX3KA8

For more information regarding original project, please refer to file [ORIGINAL_README.md](https://github.com/dimitrisfinas/nodejs-microservices-example/blob/master/ORIGINAL_README.md)


## Troubleshoot

- getting error `"error": "Permanent error: rpc error: code = Internal desc = unexpected HTTP status code received from server: 400 (Bad Request); malformed header: missing HTTP content-type"` when sending spans to Lightstep

  => check value of your LIGHTSTEP_ACCESS_TOKEN with `echo $LIGHTSTEP_ACCESS_TOKEN`

  => if not set, initialize it with `export LIGHTSTEP_ACCESS_TOKEN=<YOUR_VALUE>` then deploy again with `docker-compose up`
