// dočasné, odstraní ho plán B
export const notImplemented = (name: string) => async (): Promise<never> => { throw new Error(`${name}: implementuje plán B`); };
