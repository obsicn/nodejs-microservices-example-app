/* tracing.js */

// Required dependencies
const opentelemetry = require("@opentelemetry/sdk-node");
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new OTLPTraceExporter({}),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start()
