interface Config {
    /**
     * element Id
     */
    target: string;
    triggerKey: string;
    defaultPredictValue?: string;
    predict: (sm: SmartComposer) => Promise<string | void> | string;
}
declare class SmartComposer {
    config: Config;
    target: HTMLInputElement | HTMLTextAreaElement;
    predicted: string;
    valueBeforePredict: string;
    isPredicating: boolean;
    composerInput: HTMLInputElement | HTMLTextAreaElement;
    constructor(config: Config);
    get isReady(): boolean;
    get currentValue(): string;
    get composerValue(): string;
    get valueAfterPredict(): string;
    getTarget(): void;
    attach(): void;
    clear(): void;
    insertPredictValue(value: string): void;
    callPredict(): Promise<any>;
    private dispatchChangeOnTarget;
    private insertComposerWithStyles;
    private checkParentPosition;
    private handleKeyDown;
    private handleInput;
    private attachElementEvent;
}
export default SmartComposer;
