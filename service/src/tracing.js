/* tracing.js */

// Require dependencies
const opentelemetry = require("@opentelemetry/sdk-node");
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new OTLPTraceExporter({}),
//  traceExporter: new OTLPTraceExporter({url: 'grpc://otel-collector:4317'}),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start()
