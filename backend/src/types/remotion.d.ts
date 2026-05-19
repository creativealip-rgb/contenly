declare module '@remotion/renderer' {
  export function renderMedia(options: any): Promise<void>;
  export function renderStill(options: any): Promise<void>;
  export function selectComposition(options: any): Promise<any>;
}
