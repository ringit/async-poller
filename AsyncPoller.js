export const POLLING_CANCELLED_ERROR_MESSAGE = 'cancelled';
export const POLLING_MAX_ATTEMPTS_ERROR_MESSAGE = 'max_attempts_reached';

export default class AsyncPoller {
  action;
  doneCondition;
  intervalMs;
  maxAttempts;
  attemptCount = 1;
  mapper = (result) => result;
  cancelCondition = () => false;

  do(action) {
    this.action = action;
    return this;
  }

  until(doneCondition) {
    this.doneCondition = doneCondition;
    return this;
  }

  while(notDoneCondition) {
    this.doneCondition = (result) => !notDoneCondition(result);
    return this;
  }

  maxAttempt(maxAttempts) {
    this.maxAttempts = maxAttempts;
    return this;
  }

  untilCancelled() {
    this.doneCondition = () => false;
    return this;
  }

  every(intervalMs) {
    this.intervalMs = intervalMs;
    return this;
  }

  map(mapper) {
    this.mapper = mapper;
    return this;
  }

  cancelledOn(cancelCondition) {
    this.cancelCondition = cancelCondition;
    return this;
  }

  async poll() {
    if (
      !this.action ||
      !(this.doneCondition || this.whenList.length) ||
      !this.intervalMs
    ) {
      throw new Error('not initialized');
    }

    this._checkCancelled();
    let result = await this._doAction();
    while (!this.doneCondition(result)) {
      if (this.maxAttempts && this.attemptCount > this.maxAttempts) {
        throw new Error(POLLING_MAX_ATTEMPTS_ERROR_MESSAGE);
      }

      await sleep(this.intervalMs);

      this._checkCancelled();
      result = await this._doAction();
      this.attemptCount++;
    }
    return result;
  }

  cancel() {
    this.cancelCondition = () => true;
  }

  _checkCancelled() {
    if (this.cancelCondition()) {
      throw new Error(POLLING_CANCELLED_ERROR_MESSAGE);
    }
  }

  async _doAction() {
    const unmappedResult = await this.action();
    return this.mapper(unmappedResult);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
