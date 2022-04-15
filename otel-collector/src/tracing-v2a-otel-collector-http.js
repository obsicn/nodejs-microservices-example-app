/* tracing.js */

// Require dependencies
const opentelemetry = require("@opentelemetry/sdk-node");
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new OTLPTraceExporter({}),
//  traceExporter: new OTLPTraceExporter({url: 'http://otel-collector:4318/v1/traces'}),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start()
