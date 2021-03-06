import {OurError} from '@shared/interface/IError';
import {apply, AsyncResultCallback, waterfall} from 'async';
import _ from 'lodash';
import pg, {PoolClient} from 'pg';
import logger from './logger';
let pool: pg.Pool;

export default function DB(connectionInfo: pg.PoolConfig) {
  pool = !pool ? new pg.Pool(connectionInfo) : pool;

  logger.debug('db pool: ' + JSON.stringify(connectionInfo, null, 2));

  function startTransaction(
    client: PoolClient,
    done: (release?: any) => void,
    callback: (
      error: OurError,
      client: PoolClient,
      done: (release?: any) => void
    ) => void
  ): void {
    logger.debug('START TRANSACTION');
    client.query('START TRANSACTION', function (error: OurError) {
      callback(error, client, done);
    });
  }

  function commit(
    client: PoolClient,
    done: (release?: any) => void,
    results: any[],
    callback: (
      error: OurError,
      client: PoolClient,
      done: (release?: any) => void,
      results: any[]
    ) => void
  ): void {
    logger.debug('COMMIT');
    client.query('COMMIT', (error: OurError): void => {
      callback(error, client, done, results);
    });
  }

  function rollback(client: PoolClient, done: (release?: any) => void): void {
    logger.debug('ROLLBACK');
    client.query('ROLLBACK', (error: OurError): void => {
      done(error);
    });
  }

  function runInTransaction(
    functionsToExecute: (
      client: PoolClient,
      callback: (error: OurError, result?: any) => void
    ) => void,
    callback: AsyncResultCallback<any, OurError>
  ): void {
    pool.connect(
      (
        error: OurError,
        client: PoolClient,
        done: (release?: any) => void
      ): void => {
        if (error) {
          logger.error(error);
          callback(error);
        } else {
          waterfall(
            [
              apply(startTransaction, client, done),
              _.partial(executeFunctions, functionsToExecute),
              commit
            ],
            _.partial(waterfallCallback, callback)
          );
        }
      }
    );
  }

  function waterfallCallback(
    callback: (error: OurError, result?: any) => void,
    error: OurError,
    client?: PoolClient,
    done?: any,
    result?: any
  ): void {
    if (error) {
      logger.error(error);
      rollback(client, done);
      callback(error);
    } else {
      done();
      callback(null, result);
    }
  }

  function executeFunctions(
    functionsToExecute: (
      client: PoolClient,
      callback: (error: OurError, result: any) => void
    ) => void,
    client: PoolClient,
    done: (release?: any) => void,
    callback: (
      error: OurError,
      client: PoolClient,
      done: (release?: any) => void,
      result: any
    ) => void
  ): void {
    functionsToExecute(client, (error: OurError, result: any): void => {
      callback(error, client, done, result);
    });
  }

  function query(
    text: string,
    values: any,
    callback: (error: OurError, result?: any) => void
  ): void {
    logger.debug('db.query; text: ' + text + ' values: ' + values);
    pool.connect((error, client, done): void => {
      if (error) {
        logger.error(error);
        callback(error);
        done();
      } else {
        client.query(text, values, (error, result): void => {
          done();
          callback(error, result);
        });
      }
    });
  }

  function endConnection() {
    pool.end();
  }
  return {
    // Takes a function work(client, workCallback), where workCallback(error,
    // result). The work will be run in a transaction, and if workCallback is
    // called with an error, the transaction is aborted. Otherwise, the
    // transaction is committed.
    //
    // If the transaction completed, callback(error, result) will be called
    // with the result of work, otherwise with an error.
    runInTransaction: runInTransaction,
    query: query,
    endConnection: endConnection
  };
}
