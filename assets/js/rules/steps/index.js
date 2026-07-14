(function() {
  var getStepConfigRenderer = /*#__PURE__*/ function(type) {
    var sourceSteps = window.RuleSteps?.sourceSteps || {};
    var transformSteps1 = window.RuleSteps?.transformSteps1 || {};
    var transformSteps2 = window.RuleSteps?.transformSteps2 || {};
    var formatSteps = window.RuleSteps?.formatSteps || {};
    var advancedSteps = window.RuleSteps?.advancedSteps || {};

    var renderers = {
      source: sourceSteps.renderSourceStep,
      fill: sourceSteps.renderFillStep,
      union: sourceSteps.renderUnionStep,

      filter: transformSteps1.renderFilterStep,
      filterEqual: transformSteps1.renderFilterStep,
      filterContain: transformSteps1.renderFilterStep,
      filterRange: transformSteps1.renderFilterStep,
      topN: transformSteps1.renderFilterStep,
      aggregate: transformSteps1.renderAggregateStep,
      formula: transformSteps1.renderFormulaStep,
      virtual: transformSteps1.renderVirtualStep,

      join: transformSteps2.renderJoinStep,
      distinct: transformSteps2.renderDistinctStep,
      condition: transformSteps2.renderConditionStep,
      group: transformSteps2.renderGroupStep,
      constant: transformSteps2.renderConstantStep,
      text: transformSteps2.renderTextStep,
      runningTotal: transformSteps2.renderRunningTotalStep,
      percentOfTotal: transformSteps2.renderPercentOfTotalStep,
      movingAverage: transformSteps2.renderMovingAverageStep,
      fillNA: transformSteps2.renderFillNAStep,
      normalize: transformSteps2.renderNormalizeStep,
      valueNormalize: transformSteps2.renderValueNormalizeStep,

      round: formatSteps.renderRoundStep,
      concat: formatSteps.renderConcatStep,
      substring: formatSteps.renderSubstringStep,
      date: formatSteps.renderDateStep,
      math: formatSteps.renderMathStep,
      rank: formatSteps.renderRankStep,
      diff: formatSteps.renderDiffStep,
      ratio: formatSteps.renderRatioStep,

      crossMatch: advancedSteps.renderCrossMatchStep,
      intersect: advancedSteps.renderCrossMatchStep,
      sort: advancedSteps.renderSortStep,
      limit: advancedSteps.renderLimitStep,
      lookup: advancedSteps.renderLookupStep,
      keepDuplicate: advancedSteps.renderKeepDuplicateStep,
      keepUnique: advancedSteps.renderKeepUniqueStep,
    };

    return renderers[type] || null;
  };

  var renderStepConfig = /*#__PURE__*/ function(step, ctx) {
    var renderer = getStepConfigRenderer(step.type);
    if (!renderer) return null;
    return renderer(step, ctx);
  };

  window.RuleSteps = window.RuleSteps || {};
  window.RuleSteps.getStepConfigRenderer = getStepConfigRenderer;
  window.RuleSteps.renderStepConfig = renderStepConfig;
})();
