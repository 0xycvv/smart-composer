interface Config {
  /**
   * element Id
   */
  target: string;
  triggerKey: string;
  defaultPredictValue?: string;
  predict: (sm: SmartComposer) => Promise<string | void> | string;
}

const isWritableElement = (
  node: Node | HTMLElement,
): node is HTMLInputElement | HTMLTextAreaElement =>
  node instanceof HTMLInputElement ||
  node instanceof HTMLTextAreaElement;

class SmartComposer {
  config: Config;
  target: HTMLInputElement | HTMLTextAreaElement;
  predicted: string;
  valueBeforePredict: string;
  isPredicating: boolean = false;
  composerInput: HTMLInputElement | HTMLTextAreaElement;
  constructor(config: Config) {
    if (!config.target) {
      throw new Error('config.target must be provided.');
    }
    this.config = config;
    this.getTarget();
  }

  get isReady() {
    return !!this.target;
  }

  get currentValue() {
    return this.target && this.target.value;
  }

  get composerValue() {
    return this.composerInput.value;
  }

  get valueAfterPredict() {
    const [, ...after] = this.currentValue.split(
      this.config.triggerKey,
    );
    return after.join('');
  }

  getTarget() {
    const target = document.getElementById(this.config.target);
    if (isWritableElement(target)) {
      this.target = target;
    }
  }

  attach() {
    if (!this.isReady) {
      this.getTarget();
    }
    if (this.isReady) {
      const clone = this.target.cloneNode(false);
      if (isWritableElement(clone)) {
        clone.id = '';
        this.composerInput = clone;
        const canInsert = this.checkParentPosition();
        if (canInsert) {
          this.insertComposerWithStyles();
          this.attachElementEvent();
        } else {
          const wrapper = document.createElement('div');
          wrapper.style.position = 'relative';
          this.target.parentNode.insertBefore(wrapper, this.target);
          wrapper.appendChild(this.target);
          this.insertComposerWithStyles();
          this.attachElementEvent();
        }
      }
    }
  }

  clear() {
    this.composerInput.value = '';
    this.predicted = '';
    this.isPredicating = false;
  }

  insertPredictValue(value: string) {
    this.predicted = value;
    if (this.predicted) {
      this.composerInput.value =
        this.valueBeforePredict + this.predicted;
    } else {
      this.clear();
    }
  }

  async callPredict() {
    if (typeof this.config.predict !== 'function') {
      return;
    }
    if (this.config.predict instanceof Promise) {
      return this.config.predict(this);
    }
    return Promise.resolve(this.config.predict(this));
  }

  private dispatchChangeOnTarget(value: string = '') {
    // trigger react on change with native setter
    try {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        // @ts-ignore
        window[this.target.constructor.name].prototype,
        'value',
      ).set;
      nativeInputValueSetter.call(this.target, value);
    } catch (error) {
      this.target.value = value;
    }
    const event = new Event('input', { bubbles: true });
    this.target.dispatchEvent(event);
  }

  private insertComposerWithStyles() {
    this.target.parentElement.insertBefore(
      this.composerInput,
      this.target,
    );
    const { color } = getComputedStyle(this.composerInput);
    this.composerInput.style.position = 'absolute';
    this.composerInput.style.color = color
      .replace(')', ', 0.6)')
      .replace('rgb', 'rgba');
    this.composerInput.style.pointerEvents = 'none';
    this.composerInput.value = '';
    this.composerInput.placeholder = '';
    this.composerInput.setAttribute('aria-hidden', 'true');
    this.target.style.position = 'relative';
    this.target.style.background = 'transparent';
    this.target.setAttribute('aria-readonly', 'true');
  }

  private checkParentPosition() {
    const parentStyle = getComputedStyle(this.target.parentElement);
    const childrenCount = this.target.parentElement.childElementCount;
    if (parentStyle.position === 'relative' && childrenCount === 1) {
      return true;
    }
    return false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Backspace') {
      this.insertPredictValue.call(this, '');
      this.isPredicating = false;
    }
    if (e.key === 'Tab') {
      if (this.isPredicating && this.predicted) {
        e.preventDefault();
        this.dispatchChangeOnTarget(
          this.valueBeforePredict + this.predicted,
        );
        this.clear();
      }
    }
  }

  private handleInput(e: InputEvent) {
    if (this.isPredicating) {
      if (!this.composerInput.value.startsWith(this.target.value)) {
        this.callPredict().then((res) => {
          if (res) {
            this.insertPredictValue(res);
          } else {
            this.clear();
          }
        });
      }
    } else if (e.data === this.config.triggerKey) {
      this.isPredicating = true;
      this.valueBeforePredict = this.target.value;
      if (this.config.defaultPredictValue) {
        this.insertPredictValue(this.config.defaultPredictValue);
      } else {
        this.callPredict().then((res) => {
          if (res) {
            this.insertPredictValue(res);
          } else {
            this.clear();
          }
        });
      }
    }
  }

  private attachElementEvent() {
    this.target.addEventListener(
      'keydown',
      // @ts-ignore
      this.handleKeyDown.bind(this),
    );
    this.target.addEventListener(
      'input',
      // @ts-ignore
      this.handleInput.bind(this),
    );
  }
}

export default SmartComposer;

module.exports = SmartComposer;
