import assert from 'node:assert/strict';
import {
  formatMarketPulseProxyPrice,
  getMarketPulseDetailLabel,
  getMarketPulsePriceUnit,
  getMarketPulseShortLabel,
  protectMarketPulsePriceKeysValue,
  protectMarketPulseQuickViewValue,
} from '../src/commands/marketPulsePresentation.ts';

assert.equal(getMarketPulseShortLabel('nasdaq'), 'QQQ');
assert.equal(getMarketPulseShortLabel('sp500'), 'SPY');
assert.equal(getMarketPulseShortLabel('dowjones'), 'DIA');

assert.equal(getMarketPulseDetailLabel('nasdaq'), 'Proxy Nasdaq / QQQ');
assert.equal(getMarketPulseDetailLabel('sp500'), 'Proxy S&P 500 / SPY');
assert.equal(getMarketPulseDetailLabel('dowjones'), 'Proxy Dow Jones / DIA');

assert.equal(getMarketPulsePriceUnit('nasdaq'), '$US');
assert.equal(getMarketPulsePriceUnit('sp500'), '$US');
assert.equal(getMarketPulsePriceUnit('dowjones'), '$US');
assert.equal(getMarketPulsePriceUnit('gold'), 'pts');

assert.equal(formatMarketPulseProxyPrice('nasdaq', 123.45), '123,45 $US');
assert.equal(formatMarketPulseProxyPrice('sp500', 234.56), '234,56 $US');
assert.equal(formatMarketPulseProxyPrice('dowjones', 345.67), '345,67 $US');
assert.equal(formatMarketPulseProxyPrice('gold', 2400), null);

const quickView = protectMarketPulseQuickViewValue('**Indices US** : Nasdaq +0.01% · S&P500 -0.02% · Dow Jones +0.03%');
assert.equal(quickView, '**Proxies US** : QQQ +0.01% · SPY -0.02% · DIA +0.03%');

const priceKeys = protectMarketPulsePriceKeysValue(
  ['📊 Nasdaq : 123,45 pts · +0.01%', '🇺🇸 S&P500 : 234,56 pts · -0.02%', '📊 Dow Jones : 345,67 pts · +0.03%'].join('\n'),
);
assert.equal(
  priceKeys,
  [
    '📊 Proxy Nasdaq / QQQ : 123,45 $US · +0.01%',
    '🇺🇸 Proxy S&P 500 / SPY : 234,56 $US · -0.02%',
    '📊 Proxy Dow Jones / DIA : 345,67 $US · +0.03%',
  ].join('\n'),
);
