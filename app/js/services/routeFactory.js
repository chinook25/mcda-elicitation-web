'use strict';
define(function(require) {
  var angular = require('angular');
  var Config = require('mcda/config');
  var _ = require('lodash');

  var dependencies = [];

  var MCDARouteProvider = function() {
    return {
      buildRoutes: function($stateProvider, parentState, baseTemplatePath) {

        var scenarioState = {
          name: parentState + '.scenario',
          url: '/problems/:problemId/scenarios/:id',
          templateUrl: baseTemplatePath + 'scenario.html',
          controller: 'ScenarioController',
          resolve: {
            scenarios: function($stateParams, ScenarioResource) {
              return ScenarioResource.query(_.omit($stateParams, 'id'));
            },
            problems: function($stateParams, SubProblemResource) {
              return SubProblemResource.query(_.omit($stateParams, 'problemId'));
            }
          }
        };

        var children = Config.tasks.available.map(function(task) {
          var templateUrl = baseTemplatePath + task.templateUrl;
          return {
            name: task.id,
            parent: scenarioState,
            url: task.url ? task.url : '/' + task.id,
            templateUrl: templateUrl,
            controller: task.controller,
            resolve: {
              currentScenario: function($stateParams, ScenarioResource) {
                return ScenarioResource.get($stateParams).$promise;
              },
              taskDefinition: function(TaskDependencies) {
                return TaskDependencies.extendTaskDefinition(task);
              }, 
              currentProblem: function($stateParams, SubProblemResource){
                return SubProblemResource.get($stateParams).$promise;
              }
            }
          };
        });

        $stateProvider.state(scenarioState);
        children.forEach(function(child) {
          $stateProvider.state(child);
        });

      },
      $get: function() {}
    };
  };

  return angular.module('elicit.routeFactory', dependencies).provider('MCDARoute', MCDARouteProvider);
});
