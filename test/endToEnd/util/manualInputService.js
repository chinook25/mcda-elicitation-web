'use strict';

const _ = require('lodash');
const util = require('./util');

const TITLE = 'manual input';
const THERAPEUTIC_CONTEXT = 'end-to-end test';
const CRITERION1 = createCriterion('c1', 'favorable');
const CRITERION2 = createCriterion('c2', 'unfavorable');
const CRITERION1_ADD_DATA_SOURCE = '//*[@id="add-data-source-0"]';
const DATA_SOURCE1 = createDataSource('ref1');
const CRITERION2_ADD_DATA_SOURCE = '//*[@id="add-data-source-1"]';
const DATA_SOURCE2 = createDataSource('ref2');
const ALTERNATIVE1 = createAlternative('a1');
const ALTERNATIVE2 = createAlternative('a2');

function addCriterion(browser, criterion) {
  browser
    .click('#add-criterion-button')
    .setValue('#criterion-title-input', criterion.title)
    .setValue('#criterion-description-input', criterion.description)
    .click('#favorability-selector-' + criterion.favorability)
    .click('#add-criterion-confirm-button');
  return browser;
}

function addDataSource(browser, path, dataSource) {
  browser
    .useXpath()
    .click(path)
    .useCss()
    .setValue('#data-source-reference', dataSource.reference)
    .setValue('#data-source-url', dataSource.url)
    .click('#add-data-source-button');
  return browser;
}

function addAlternative(browser, alternative) {
  browser
    .click('#add-alternative-button')
    .setValue('#alternative-title', alternative.title)
    .click('#add-alternative-confirm-button');
}

function createCriterion(title, favorability) {
  return {
    title: title,
    description: 'description',
    favorability: favorability
  };
}

function createDataSource(reference) {
  return {
    reference: reference,
    url: 'http://url.com'
  };
}

function createAlternative(title) {
  return {title: title};
}

function createInputDefault(browser) {
  browser
    .waitForElementVisible('#create-workspace-button')
    .click('#create-workspace-button')
    .click('#manual-workspace-radio')
    .click('#add-workspace-button')
    .waitForElementVisible('#workspace-title');
  return browser;
}

function setValuesForRow(browser, rowNumber) {
  setValues(browser, rowNumber, 6);
  setValues(browser, rowNumber, 7);
}

function setValues(browser, rowNumber, columnNumber) {
  const path = '//tr[' + rowNumber + ']' + '/td[' + columnNumber + ']//a';
  browser.element(
    'xpath',
    path,
    _.partial(clickElement, browser, rowNumber, columnNumber)
  );
}

function clickElement(browser, rowNumber, columnNumber, element) {
  const elementId = util.getFirstProperty(element.value);
  const value = rowNumber + columnNumber;
  browser
    .elementIdClick(elementId)
    .useXpath()
    .setValue('//tr[' + rowNumber + ']/td[' + columnNumber + ']//input', value)
    .useCss()
    .click('#deterministic-results-tab');
}

module.exports = {
  addCriterion,
  addDataSource,
  addAlternative,
  createCriterion,
  createDataSource,
  createAlternative,
  createInputDefault,
  setValuesForRow,

  ALTERNATIVE1,
  ALTERNATIVE2,
  CRITERION1,
  CRITERION2,
  TITLE,
  THERAPEUTIC_CONTEXT,
  CRITERION1_ADD_DATA_SOURCE,
  DATA_SOURCE1,
  DATA_SOURCE2
};
