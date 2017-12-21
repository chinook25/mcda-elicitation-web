'use strict';
define(['lodash'],
  function(_) {
    var dependencies = ['$scope', '$stateParams',
      'SwingWeightingService',
      'currentScenario',
      'taskDefinition'
    ];
    var SwingWeightingController = function($scope, $stateParams,
      SwingWeightingService,
      currentScenario,
      taskDefinition) {
      $scope.isPrecise = true;
      var sliderOptions = {
        floor: 1,
        ceil: 100,
        translate: function(value) {
          return value + '%';
        }
      };

      function getValues(criteria) {
        return _.reduce(criteria, function(accum, criterion, key) {
          accum[key] = 100;
          return accum;
        }, {});
      }

      function toBackEnd(mostImportantCriterion) {
        return function(value, key) {
          return {
            type: 'exact swing',
            ratio: 1 / (value / 100),
            criteria: [mostImportantCriterion, key]
          };
        };
      }
      SwingWeightingService.initWeightingScope($scope,
        $stateParams,
        currentScenario,
        taskDefinition,
        sliderOptions,
        getValues,
        'Precise swing weighting',
        toBackEnd);
    };
    return dependencies.concat(SwingWeightingController);
  });