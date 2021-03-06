//@ts-nocheck

import {CURRENT_SCHEMA_VERSION} from '@shared/constants';
import IOldWorkspace from '@shared/interface/IOldWorkspace';
import IProblem from '@shared/interface/Problem/IProblem';
import {getDataSourcesById} from '@shared/util';
import _ from 'lodash';

/***** Changes
 * 1.0.0 Introduction of data sources
 * 1.1.0 Removal of the value tree
 * 1.2.0 Allow effect cells to contain distribution and effect
 *       Remove properties from data sources
 *       Fix legacy problem: remove scales from criteria and put them on data source(s)
 * 1.2.1 Adding text option for effects table cells
 * 1.2.2 Splitting the performance table entry performances, and making them a bit more strict
 * 1.3.0 Move unit of measurement to data source
 * 1.3.1 Remove favorability property if it is not boolean
 * 1.3.2 Remove null/undefined properties from data sources
 * 1.3.3 Remove alternative property from alternatives
 * 1.3.4 Add 'decimal' as scale option to input
 * 1.4.0 Add type to unit of measurement; Scales with null ranges updated to minus/plus infinity and are mandatory
 * 1.4.1 Add ranges
 * 1.4.2 Add possibility to make constrained normal distributions
 * 1.4.3 Allow numbers on text cells
 * 1.4.4 Set proportion, decimal unit of measurement to empty label
 * 1.4.5 Put id on alternatives and criteria
 * 1.4.6 Store effect input as decimals
 * 1.4.7 Move pvfs off problem onto default scenario
 * *****/

export function updateWorkspaceToCurrentSchema(
  workspace: IOldWorkspace
): IOldWorkspace {
  return {
    ...workspace,
    problem: updateProblemToCurrentSchema(workspace.problem)
  };
}

export function updateProblemToCurrentSchema(problem: IProblem) {
  let newProblem = _.cloneDeep(problem);
  if (!problem.schemaVersion) {
    newProblem = updateToVersion100(newProblem);
  }

  if (newProblem.schemaVersion === '1.0.0') {
    newProblem = updateToVersion110(newProblem);
  }

  if (newProblem.schemaVersion === '1.1.0') {
    newProblem = updateToVersion120(newProblem);
  }

  if (
    newProblem.schemaVersion === '1.2.0' ||
    newProblem.schemaVersion === '1.2.1'
  ) {
    newProblem.schemaVersion = '1.2.2';
  }

  if (newProblem.schemaVersion === '1.2.2') {
    newProblem = updateToVersion130(newProblem);
  }

  if (newProblem.schemaVersion === '1.3.0') {
    newProblem = updateToVersion131(newProblem);
  }

  if (newProblem.schemaVersion === '1.3.1') {
    newProblem = updateToVersion132(newProblem);
  }

  if (newProblem.schemaVersion === '1.3.2') {
    newProblem = updateToVersion133(newProblem);
  }

  if (newProblem.schemaVersion === '1.3.3') {
    newProblem.schemaVersion = '1.3.4';
  }

  if (newProblem.schemaVersion === '1.3.4') {
    newProblem = updateToVersion140(newProblem);
  }

  if (newProblem.schemaVersion === '1.4.0') {
    newProblem.schemaVersion = '1.4.1';
  }

  if (newProblem.schemaVersion === '1.4.1') {
    newProblem.schemaVersion = '1.4.2';
  }

  if (newProblem.schemaVersion === '1.4.2') {
    newProblem.schemaVersion = '1.4.3';
  }

  if (newProblem.schemaVersion === '1.4.3') {
    newProblem = updateToVersion144(newProblem);
  }

  if (newProblem.schemaVersion === '1.4.4') {
    newProblem = updateToVersion145(newProblem);
  }

  if (newProblem.schemaVersion === '1.4.5') {
    newProblem = updateToVersion146(newProblem);
  }

  if (newProblem.schemaVersion === '1.4.6') {
    newProblem = updateToVersion147(newProblem);
  }

  if (newProblem.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return newProblem;
  } else {
    throw `Configured current schema version (${CURRENT_SCHEMA_VERSION}) is not the same as the updated schema version (${newProblem.schemaVersion})`;
  }
}

function updateToVersion100(problem) {
  let newProblem = _.cloneDeep(problem);
  newProblem.criteria = _.mapValues(problem.criteria, createNewCriterion);
  newProblem.performanceTable = createNewPerformanceTable(newProblem);
  newProblem.schemaVersion = '1.0.0';
  return newProblem;
}

function updateToVersion110(problem) {
  let newProblem = _.cloneDeep(problem);
  if (newProblem.valueTree) {
    newProblem.criteria = putFavorabilityOnCriteria(problem);
    delete newProblem.valueTree;
  }
  newProblem.schemaVersion = '1.1.0';
  return newProblem;
}

function updateToVersion120(problem) {
  let newProblem = _.cloneDeep(problem);
  newProblem.criteria = moveCriterionScaleToDataSource(newProblem);
  newProblem.criteria = removeObsoletePropertiesFromDataSource(newProblem);
  newProblem.performanceTable = movePerfomancesToDistribution(newProblem);
  newProblem.schemaVersion = '1.2.0';
  return newProblem;
}

function movePerfomancesToDistribution(problem) {
  return _.map(problem.performanceTable, function (entry) {
    let newEntry = _.cloneDeep(entry);
    newEntry.performance = {
      distribution: newEntry.performance
    };
    return newEntry;
  });
}

function moveCriterionScaleToDataSource(problem) {
  return _.mapValues(problem.criteria, function (criterion) {
    criterion.dataSources = _.map(criterion.dataSources, function (dataSource) {
      if (!dataSource.scale && criterion.scale) {
        dataSource.scale = criterion.scale;
      }
      return dataSource;
    });
    delete criterion.scale;
    return criterion;
  });
}

function removeObsoletePropertiesFromDataSource(problem) {
  return _.mapValues(problem.criteria, function (criterion) {
    criterion.dataSources = _.map(criterion.dataSources, function (dataSource) {
      delete dataSource.inputType;
      delete dataSource.inputMethod;
      delete dataSource.dataType;
      delete dataSource.parameterOfInterest;
      delete dataSource.oldId;
      return dataSource;
    });
    return criterion;
  });
}

function putFavorabilityOnCriteria(problem) {
  return _.mapValues(problem.criteria, function (criterion, criterionId) {
    let newCriterion = _.cloneDeep(criterion);
    if (problem.valueTree.children[0].criteria) {
      newCriterion.isFavorable = _.includes(
        problem.valueTree.children[0].criteria,
        criterionId
      );
    } else {
      newCriterion.isFavorable = _.includes(
        _.flatten(_.map(problem.valueTree.children[0].children, 'criteria'))
      );
    }
    return newCriterion;
  });
}

function createNewPerformanceTable(problem) {
  return _.map(problem.performanceTable, function (tableEntry) {
    let newEntry = _.cloneDeep(tableEntry);
    if (tableEntry.criterionUri) {
      newEntry.criterion = tableEntry.criterionUri;
      delete newEntry.criterionUri;
    }
    newEntry.dataSource =
      problem.criteria[newEntry.criterion].dataSources[0].id;
    return newEntry;
  });
}

function createNewCriterion(criterion) {
  let newCriterion = _.pick(criterion, [
    'title',
    'description',
    'unitOfMeasurement'
  ]);
  let dataSource = createDataSource(criterion);
  newCriterion.dataSources = [dataSource];
  return newCriterion;
}

function createDataSource(criterion) {
  let dataSource = _.pick(criterion, [
    'pvf',
    'source',
    'sourceLink',
    'strengthOfEvidence',
    'uncertainties',
    'scale'
  ]);
  dataSource.id = generateUuid();
  return dataSource;
}

function updateToVersion130(problem) {
  let newProblem = _.cloneDeep(problem);
  newProblem.criteria = _.mapValues(problem.criteria, function (criterion) {
    let newCriterion = _.cloneDeep(criterion);
    newCriterion.dataSources = _.map(
      criterion.dataSources,
      function (dataSource) {
        let newDataSource = _.cloneDeep(dataSource);
        if (criterion.unitOfMeasurement !== undefined) {
          newDataSource.unitOfMeasurement = criterion.unitOfMeasurement;
        }
        return newDataSource;
      }
    );
    delete newCriterion.unitOfMeasurement;
    return newCriterion;
  });
  newProblem.schemaVersion = '1.3.0';
  return newProblem;
}

function updateToVersion131(problem) {
  let newProblem = _.cloneDeep(problem);
  newProblem.criteria = _.mapValues(problem.criteria, function (criterion) {
    let newCriterion = _.cloneDeep(criterion);
    if (criterion.isFavorable === undefined || criterion.isFavorable === null) {
      delete newCriterion.isFavorable;
    }
    return newCriterion;
  });
  newProblem.schemaVersion = '1.3.1';
  return newProblem;
}

function updateToVersion132(problem) {
  let newProblem = _.cloneDeep(problem);
  newProblem.criteria = _.mapValues(problem.criteria, function (criterion) {
    let newCriterion = _.cloneDeep(criterion);
    newCriterion.dataSources = _.map(
      criterion.dataSources,
      function (dataSource) {
        let properties = _.keys(dataSource);
        let newDataSource = _.reduce(
          properties,
          function (accum, property) {
            if (dataSource[property]) {
              accum[property] = dataSource[property];
            }
            return accum;
          },
          {}
        );
        return newDataSource;
      }
    );
    return newCriterion;
  });
  newProblem.schemaVersion = '1.3.2';
  return newProblem;
}

function updateToVersion133(problem) {
  let newProblem = _.cloneDeep(problem);
  newProblem.alternatives = _.mapValues(
    problem.alternatives,
    function (alternative) {
      return _.pick(alternative, ['title']);
    }
  );
  newProblem.schemaVersion = '1.3.3';
  return newProblem;
}

function updateToVersion140(problem) {
  let newProblem = _.cloneDeep(problem);
  newProblem.criteria = _.mapValues(problem.criteria, (criterion) => {
    let newCriterion = _.cloneDeep(criterion);
    newCriterion.dataSources = _.map(criterion.dataSources, (dataSource) => {
      let newDataSource = _.cloneDeep(dataSource);
      newDataSource.unitOfMeasurement = {
        type: getUnitType(dataSource),
        label: dataSource.unitOfMeasurement ? dataSource.unitOfMeasurement : ''
      };
      newDataSource.scale = getScale(dataSource.scale);
      return newDataSource;
    });
    return newCriterion;
  });

  newProblem.performanceTable = updatePerformanceTable140(newProblem);
  newProblem.schemaVersion = '1.4.0';
  return newProblem;
}

function updatePerformanceTable140(problem) {
  let dataSources = getDataSourcesById(problem.criteria);
  return _.map(
    problem.performanceTable,
    _.partial(getUpToDateEntry, dataSources)
  );
}

function getUpToDateEntry(dataSources, entry) {
  if (doesEntryNeedUpdating(entry, dataSources[entry.dataSource])) {
    entry.performance.distribution.input = {
      value: entry.performance.distribution.value,
      scale: 'percentage'
    };
    entry.performance.distribution.value =
      entry.performance.distribution.value / 100;
  }
  return entry;
}

function doesEntryNeedUpdating(entry, dataSource) {
  return (
    entry.dataSource === dataSource.id &&
    dataSource.unitOfMeasurement.type === 'percentage' &&
    !entry.performance.effect &&
    entry.performance.distribution.type === 'exact' &&
    !entry.performance.distribution.input
  );
}

function getUnitType(dataSource) {
  if (
    dataSource.unitOfMeasurement === '%' &&
    _.isEqual(dataSource.scale, [0, 100])
  ) {
    return 'percentage';
  } else if (
    dataSource.unitOfMeasurement === 'Proportion' &&
    _.isEqual(dataSource.scale, [0, 1])
  ) {
    return 'decimal';
  } else {
    return 'custom';
  }
}

function getScale(scale) {
  if (scale) {
    return scale;
  } else {
    return [-Infinity, Infinity];
  }
}

function updateToVersion144(problem) {
  let newProblem = _.cloneDeep(problem);
  newProblem.criteria = _.mapValues(newProblem.criteria, function (criterion) {
    let newCriterion = _.cloneDeep(criterion);
    newCriterion.dataSources = _.map(
      newCriterion.dataSources,
      function (dataSource) {
        if (dataSource.unitOfMeasurement.type === 'decimal') {
          let newDataSource = _.cloneDeep(dataSource);
          newDataSource.unitOfMeasurement.label = '';
          return newDataSource;
        } else {
          return dataSource;
        }
      }
    );
    return newCriterion;
  });
  newProblem.schemaVersion = '1.4.4';
  return newProblem;
}

function updateToVersion145(problem) {
  const criteria = _.mapValues(problem.criteria, (criterion, id) => {
    return {...criterion, id: id};
  });
  const alternatives = _.mapValues(problem.alternatives, (alternative, id) => {
    return {...alternative, id: id};
  });
  return {
    ...problem,
    alternatives: alternatives,
    criteria: criteria,
    schemaVersion: '1.4.5'
  };
}

function updateToVersion146(problem) {
  const isDataSourcePercentageMap = buildDataSourcePercentageMap(
    problem.criteria
  );

  const performanceTable = buildPerformanceTable(
    problem.performanceTable,
    isDataSourcePercentageMap
  );

  return {
    ...problem,
    performanceTable: performanceTable,
    schemaVersion: '1.4.6'
  };
}

function updateToVersion147(problem) {
  const updatedProblem = omitPvfs(problem);
  return {
    ...updatedProblem,
    schemaVersion: '1.4.7'
  };
}

function buildDataSourcePercentageMap(criteria) {
  return _(criteria)
    .flatMap((criterion) => {
      return _.map(criterion.dataSources, (dataSource) => {
        return [
          dataSource.id,
          dataSource.unitOfMeasurement.type === 'percentage'
        ];
      });
    })
    .fromPairs()
    .value();
}

function buildPerformanceTable(performanceTable, isDataSourcePercentageMap) {
  return _.map(performanceTable, (entry) => {
    if (isInputPercentified(isDataSourcePercentageMap, entry)) {
      const inputBase = buildInputBase(entry);
      if (
        'value' in entry.performance.effect.input &&
        'lowerBound' in entry.performance.effect.input
      ) {
        return buildValueCIInput(inputBase, entry);
      } else if ('value' in entry.performance.effect.input) {
        return buildValueInput(entry);
      } else {
        return buildRangeInput(inputBase, entry);
      }
    } else {
      return entry;
    }
  });
}

function buildInputBase(entry) {
  return {
    lowerBound: entry.performance.effect.input.lowerBound / 100,
    upperBound: entry.performance.effect.input.upperBound / 100
  };
}

function buildValueCIInput(inputBase, entry) {
  const input = {
    ...inputBase,
    value: entry.performance.effect.input.value / 100
  };
  return {
    ...entry,
    performance: buildPerformanceWithInput(entry, input)
  };
}

function buildValueInput(entry) {
  const input = {
    ...entry.performance.effect.input,
    value: entry.performance.effect.input.value / 100
  };
  return {
    ...entry,
    performance: buildPerformanceWithInput(entry, input)
  };
}

function buildRangeInput(inputBase, entry) {
  return {
    ...entry,
    performance: buildPerformanceWithInput(entry, inputBase)
  };
}

function isInputPercentified(isDataSourcePercentageMap, entry) {
  return (
    isDataSourcePercentageMap[entry.dataSource] &&
    'effect' in entry.performance &&
    'input' in entry.performance.effect &&
    ('lowerBound' in entry.performance.effect.input ||
      'value' in entry.performance.effect.input)
  );
}

function buildPerformanceWithInput(entry, input) {
  return {
    ...entry.performance,
    effect: {...entry.performance.effect, input: input}
  };
}

function omitPvfs(uploadProblem) {
  return {
    ...uploadProblem,
    criteria: omitPvfsFromCriteria(uploadProblem.criteria)
  };
}

function omitPvfsFromCriteria(uploadCriteria) {
  return _.mapValues(uploadCriteria, (uploadCriterion) => {
    return {
      ...uploadCriterion,
      dataSources: omitPvfsFromDataSources(uploadCriterion.dataSources)
    };
  });
}

function omitPvfsFromDataSources(uploadDataSources) {
  return _.map(uploadDataSources, (uploadDataSource) =>
    _.omit(uploadDataSource, 'pvf')
  );
}
