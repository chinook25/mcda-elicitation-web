'use strict';
define(['lodash', 'jquery'],
  function(_, $) {
    var dependencies = [
      '$stateParams',
      'OrderingService',
      'PartialValueFunctionService',
      'PreferencesService',
      'TaskDependencies',
      'WorkspaceSettingsService'
    ];
    var IndividualScenarioDirective = function(
      $stateParams,
      OrderingService,
      PartialValueFunctionService,
      PreferencesService,
      TaskDependencies,
      WorkspaceSettingsService
    ) {
      return {
        restrict: 'E',
        scope: {
          aggregateState: '=',
          editMode: '=',
          scenario: '=',
          tasks: '='
        },
        templateUrl: './individualScenarioDirective.html',
        link: function(scope) {
          scope.isPVFDefined = isPVFDefined;
          scope.isAccessible = isAccessible;
          scope.resetWeights = resetWeights;

          scope.pvfCoordinates = {};
          init();
          scope.$on('elicit.settingsChanged', resetPvfCoordinates);

          function init() {
            scope.criteriaHavePvf = doAllCriteriaHavePvf();
            scope.isOrdinal = isWeightingOrdinal();
            resetPvfCoordinates();
          }

          function isPVFDefined(dataSource) {
            return dataSource.pvf && dataSource.pvf.type;
          }

          function doAllCriteriaHavePvf() {
            return !_.find(scope.aggregateState.problem.criteria, function(criterion) {
              return !isPVFDefined(criterion.dataSources[0]);
            });
          }

          function isWeightingOrdinal() {
            return _.some(scope.scenario.state.prefs, function(pref) {
              return pref.type === 'ordinal';
            });
          }

          function isAccessible(task) {
            return TaskDependencies.isAccessible(task, scope.aggregateState);
          }

          function createIsSafe() {
            return _.reduce(scope.tasks, function(accum, task) {
              accum[task.id] = isTaskSafe(task.id);
              return accum;
            }, {});
          }

          function isTaskSafe(taskId) {
            var state = {
              problem: scope.problem,
              prefs: scope.problem.preferences
            };
            var safe = TaskDependencies.isSafe(scope.tasks[taskId], state);
            safe.tooltip = willReset(safe);
            return safe;
          }

          function willReset(safe) {
            var resets = safe.resets.map(function(reset) {
              return TaskDependencies.definitions[reset].title;
            }).join(', ').replace(/,([^,]*)$/, ' & $1');
            return resets ? 'Saving this preference will reset: ' + resets : null;
          }

          function resetWeights() {
            scope.scenario.state.prefs = [];
            scope.importance = PreferencesService.buildImportance(scope.criteria, scope.scenario.state.prefs);
            scope.scenario.$save($stateParams, updateView);
          }

          function updateView() {
            scope.$emit('elicit.resultsAccessible');
            scope.problem.preferences = [];
            scope.isSafe = createIsSafe();
            $('div.tooltip:visible').hide();
            $('#resetWeightsButton').removeClass('open');
          }

          function resetPvfCoordinates() {
            scope.problem = WorkspaceSettingsService.usePercentage() ? scope.aggregateState.percentified.problem : scope.aggregateState.dePercentified.problem;
            reloadOrderings();
            scope.pvfCoordinates = PartialValueFunctionService.getPvfCoordinates(scope.problem.criteria);
            scope.isSafe = createIsSafe();
          }

          function reloadOrderings() {
            OrderingService.getOrderedCriteriaAndAlternatives(scope.problem, $stateParams).then(function(orderings) {
              scope.alternatives = orderings.alternatives;
              scope.criteria = orderings.criteria;
              var preferences = scope.scenario.state.prefs;
              scope.importance = PreferencesService.buildImportance(scope.criteria, preferences);
            });
          }
        }
      };
    };
    return dependencies.concat(IndividualScenarioDirective);
  });