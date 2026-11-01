export { };

declare module '*.glb';
declare module '*.png';

declare module 'meshline' {
    export const MeshLineGeometry: { new(...args: unknown[]): unknown };
    export const MeshLineMaterial: { new(...args: unknown[]): unknown };
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            meshLineGeometry: unknown;
            meshLineMaterial: unknown;
        }
    }
}

declare global {
    interface Window {
        google?: {
            accounts?: {
                id?: {
                    initialize: (config: { client_id: string; callback: (response: unknown) => void }) => void;
                    renderButton: (container: HTMLElement, options: { theme?: string; size?: string; width?: number | string; shape?: string; text?: string }) => void;
                };
            };
        };
    }
}