/**
 * @param {import('sinon').SinonStub} stub
 * @returns {import('zx').$};
 */
// @ts-expect-error
export const convertSinonStubToZX = stub => stub;
