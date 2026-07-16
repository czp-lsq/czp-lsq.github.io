// engine/parser.js - Excel 模板解析器 (TemplateParser)
// 主入口文件，引用各子模块并保持向后兼容性

const TemplateParser = {
  colLetters: FieldFinder.colLetters.bind(FieldFinder),
  normalizeText: XMarker.normalizeText.bind(XMarker),
  getAllXChars: XMarker.getAllXChars.bind(XMarker),
  getXCharRegex: XMarker.getXCharRegex.bind(XMarker),
  getXCharClass: XMarker.getXCharClass.bind(XMarker),
  countXChars: XMarker.countXChars.bind(XMarker),
  countXGroups: XMarker.countXGroups.bind(XMarker),
  extractXGroupContexts: XMarker.extractXGroupContexts.bind(XMarker),
  isTextMarker: TextMarker.isTextMarker.bind(TextMarker),
  isNumberMarker: NumberMarker.isNumberMarker.bind(NumberMarker),
  isMarker: FieldFinder.isMarker.bind(FieldFinder),
  findMergedCells: MergedCell.findMergedCells.bind(MergedCell),
  getCellValue: MergedCell.getCellValue.bind(MergedCell),
  isMergedCell: MergedCell.isMergedCell.bind(MergedCell),
  findFields: FieldFinder.findFields.bind(FieldFinder),
};

window.TemplateParser = TemplateParser;