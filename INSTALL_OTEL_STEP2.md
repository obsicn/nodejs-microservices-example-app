# INSTALLING OPENTELEMETRY STEP 2

# CUSTOM ATTRIBUTES, EVENTS AND SPANS

In this step, we will add to our spans custom attributes and log events.
We will also create custom spans.


## Add custom attributes using environment variables

- Edit `docker-compose.yml` file, go to the environment section of services `web` and `service`

- For each service, add an environment variable `OTEL_RESOURCE_ATTRIBUTES` with value a list of comma separated `<key>=<value>`
- Example:
```yaml
  web:
    environment:
     - OTEL_RESOURCE_ATTRIBUTES=service.name=web,service.version=2.0.0
```


## Add custom attributes in code

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


## Add log events

- In the `main()` function, in the `app.get("/api/data", (req, res) => {` part, add code to create custom log events
```java
  // access the current span from active context
  let activeSpan = api.trace.getSpan(api.context.active());
  // log an event and include some structured data.
  activeSpan.addEvent('Running on http://${HOST}:${PORT}');
```


## Create spans

- Replace the `generateWork` function with code below
```java
async function generateWork(nb) {
  for (let i = 0; i < Number(nb); i++) {
    // create a new span
    // if not put as arg, current span is automatically used as parent
    // and the span you create automatically become the current one
    let span = tracer.startSpan(`Looping ${i}`);
    // log an event and include some structured data. This replace the logger to file
    span.addEvent(`*** DOING SOMETHING ${i}`);
    // wait for 50ms to simulate some work
    await sleep(50);
    // don't forget to always end the span to flush data out
    span.end();
  }
}
```


## Test

- As you didn't add any new library, you don't need to rebuild or redeploy to take into account your change, you can directly test it

- Test again you application with http://localhost:4000 and http://localhost:4000/api/data and look at results in
  - zpages: http://127.0.0.1:55679/debug/tracez
  - jaeger: http://localhost:16686/search
  - lightstep: https://app.lightstep.com/<your_project>/explore

- Look at attributes list of the `GET` operations to see your added attributes

- Now, you can filter your search based on the new `weather` attributes with any value `sun`, `rain`or `snow`

- You can also group your traces based on `weather` in order to see differences in response time or error status
