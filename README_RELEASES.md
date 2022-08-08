# RELEASES DESCRIPTION

## Explaining the different version of files

You will find files in different versions in this repository

  - `v0` are the original files without any Otel instrumentation
  - `v1` are files with Otel Instrumentation sending output (traces or metrics) to console logs
  - `v2` are files when we add custom attributes, log events, and new spans to the auto-instrumentation
  - `v3` are files with Otel Instrumentation sending output to otel-collector
    - `v3a` is using on HTTP protocol for sending traces
    - `v3b` is using on GRPC protocol for sending traces
  - `v4` are files with Otel Instrumentation sending output to otel-collector (using grpc), and otel-Collector sending them to different backends (Jaeger and Lightstep)
  - `v5` are files when we add metrics
  - `v6` are files when we add custom metrics to the auto-instrumentation

If you don't find files in a specific version, it may just be because this file is not impacted by the new features we are adding
