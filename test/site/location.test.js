import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocation, DEFAULT_LOCATION } from '../../site/js/logic/location.js';

const towns = [{ county: '臺北市', towns: ['中正區', '大安區'] }, { county: '新北市', towns: ['五股區'] }];
test('resolveLocation keeps a valid saved location', () => assert.deepEqual(resolveLocation({county:'新北市',town:'五股區'}, towns), {county:'新北市',town:'五股區'}));
test('resolveLocation falls back to default for unknown names', () => {
  assert.deepEqual(resolveLocation({county:'台北市',town:'中正區'}, towns), DEFAULT_LOCATION);
  assert.deepEqual(resolveLocation({county:'臺北市',town:'五股區'}, towns), DEFAULT_LOCATION);
  assert.deepEqual(resolveLocation(null, towns), DEFAULT_LOCATION);
  assert.deepEqual(resolveLocation('garbage', towns), DEFAULT_LOCATION);
});
