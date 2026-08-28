var PAGE_TITLE = '{{TITLE}}';
var SHEET_ID_PROPERTY = '{{SHEET_PROPERTY}}';
var SHEET_TAB = 'Data';
var CACHE_KEY = '{{STORAGE_KEY}}_items_v1';
var CACHE_SECONDS = 600;

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  try {
    template.dataTag = buildDataTag(getItems(!!(e && e.parameter && e.parameter.refresh)), false);
  } catch (error) {
    console.error(PAGE_TITLE + ' failed to load data: ' + error);
    template.dataTag = buildDataTag([], true);
  }
  return template.evaluate()
    .setTitle(PAGE_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getItems(refresh) {
  var cache = CacheService.getScriptCache();
  if (!refresh) {
    var cached = cache.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  }

  var sheetId = PropertiesService.getScriptProperties().getProperty(SHEET_ID_PROPERTY);
  if (!sheetId) throw new Error('Script Property ' + SHEET_ID_PROPERTY + ' is not set.');
  var response = Sheets.Spreadsheets.Values.get(sheetId, "'" + SHEET_TAB + "'", {
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'SERIAL_NUMBER'
  });
  var rows = response.values || [];
  if (rows.length < 2) return [];

  var columns = headerMap(rows[0]);
  if (!('title' in columns)) throw new Error('The sheet needs a Title column.');
  var items = [];
  for (var index = 1; index < rows.length; index++) {
    var item = parseRow(rows[index], columns);
    if (item) items.push(item);
  }

  var serialized = JSON.stringify(items);
  try { cache.put(CACHE_KEY, serialized, CACHE_SECONDS); } catch (error) {
    console.warn('Cache write skipped: ' + error);
  }
  return JSON.parse(serialized);
}

function headerMap(row) {
  var allowed = { date: 'date', title: 'title', category: 'category', summary: 'summary', link: 'link' };
  var map = {};
  row.forEach(function (value, index) {
    var normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (allowed[normalized] && !(allowed[normalized] in map)) map[allowed[normalized]] = index;
  });
  return map;
}

function parseRow(row, columns) {
  function text(field) {
    return field in columns ? String(row[columns[field]] == null ? '' : row[columns[field]]).trim() : '';
  }
  var title = text('title');
  if (!title || /^title$/i.test(title)) return null;
  return {
    date: safeDate('date' in columns ? row[columns.date] : ''),
    title: title,
    category: text('category'),
    summary: text('summary'),
    link: /^https?:\/\//i.test(text('link')) ? text('link') : ''
  };
}

function safeDate(value) {
  if (typeof value === 'number' && isFinite(value) && value > 0) {
    return Utilities.formatDate(new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000), 'UTC', 'yyyy-MM-dd');
  }
  var parsed = new Date(String(value || ''));
  return isNaN(parsed.getTime()) ? '' : Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function buildDataTag(items, hasError) {
  var payload = 'window.__ITEMS__=' + JSON.stringify(items).replace(/<\//g, '<\\/') +
    ';window.__ERROR__=' + (hasError ? 'true' : 'false') + ';';
  return '<script>' + payload + '<' + '/script>';
}

function setup() {
  var sheetId = PropertiesService.getScriptProperties().getProperty(SHEET_ID_PROPERTY);
  if (!sheetId) throw new Error('Set Script Property ' + SHEET_ID_PROPERTY + ' first.');
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'onSheetEdit') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(sheetId).onEdit().create();
}

function onSheetEdit() {
  CacheService.getScriptCache().remove(CACHE_KEY);
}
