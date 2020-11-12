interface Config {
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
    return this.target?.value;
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
    console.log('clear');
    this.composerInput.value = '';
    this.predicted = '';
    this.isPredicating = false;
  }

  insertPredictValue(value: string) {
    this.predicted = value;
    if (this.predicted) {
      console.log(this.target.value, this.predicted);
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
      if (this.isPredicating) {
        e.preventDefault();
        this.target.value = this.valueBeforePredict + this.predicted;
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

module.exports = SmartComposer;

function hexToRGB(hex: string, alpha: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else {
    return `rgba(${r}, ${g}, ${b})`;
  }
}