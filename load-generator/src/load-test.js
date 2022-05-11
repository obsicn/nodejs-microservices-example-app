import http from 'k6/http';
/*
import { check } from 'k6';
import { sleep } from 'k6';
*/
/*
// SIMPLE OPTIONS
export let options = {
  vus: 5,
  duration: duration,
};

// STAGE OPTIONS
export let options = {
  stages: [
        // Ramp-up from 1 to 10 VUs in 5s
        { duration: "5s", target: 10 },
        // Stay at rest on 10 VUs for 1min
        { duration: "1m", target: 10 },
        // Ramp-down from 5 to 0 VUs for 5s
        { duration: "5s", target: 0 }
  ]
};
*/
const duration = __ENV.DURATION;

export let options = {
  scenarios: {
    api_scenario: {
      exec: 'testAPI',
      executor: 'constant-vus',
      vus: 1,
      duration: duration,
    },
    rain_scenario: {
      exec: 'testWeather',
      env: { WEATHER: 'rain' },
      executor: 'constant-vus',
      vus: 1,
      duration: duration,
    },
    snow_scenario: {
      exec: 'testWeather',
      env: { WEATHER: 'snow' },
      executor: 'constant-vus',
      vus: 1,
      duration: duration,
    },
    sun_scenario: {
      exec: 'testWeather',
      env: { WEATHER: 'sun' },
      executor: 'constant-vus',
      vus: 1,
      duration: duration,
    },
  },
};

export function testWeather() {
  console.info(`Running test http://${__ENV.TARGET_HOST}:${__ENV.TARGET_PORT}?weather=${__ENV.WEATHER}`)
  return http.get(`http://${__ENV.TARGET_HOST}:${__ENV.TARGET_PORT}?weather=${__ENV.WEATHER}`);
}

export function testAPI() {
  console.info(`Running test http://${__ENV.TARGET_HOST}:${__ENV.TARGET_PORT}/api/data`)
  return http.get(`http://${__ENV.TARGET_HOST}:${__ENV.TARGET_PORT}/api/data`);
}

/*
export default function () {
  let res = testAPI();
}
*/
