export declare const settings: {
    record: boolean;
    clear: boolean;
    size: [number, number];
    frames: number;
    onComplete: (blob: Blob) => void;
    color: string;
};
export declare type DrawingFunction = (context: CanvasRenderingContext2D, time: number) => void;
export declare type DrawOptions = Partial<typeof settings>;
export declare function getCanvas(): HTMLCanvasElement;
export declare function getContext(): CanvasRenderingContext2D;
export declare function draw(action: DrawingFunction): void;
export declare function start(): void;
export declare function options(opts: DrawOptions): void;
export declare function stop(): void;
