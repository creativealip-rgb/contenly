declare module 'puppeteer-extra' {
    import { Browser, Page, LaunchOptions } from 'puppeteer';
    export function launch(options?: LaunchOptions): Promise<Browser>;
    export function addPlugin(plugin: any): void;
    export function use(plugin: any): void;
}

declare module 'puppeteer-extra-plugin-stealth' {
    export default function StealthPlugin(): any;
}
