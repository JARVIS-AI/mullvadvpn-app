import { ElectronApplication } from 'playwright';

import { startApp, StartAppResponse } from '../utils';

interface StartMockedAppResponse extends StartAppResponse {
  mockIpcHandle: MockIpcHandle;
  sendMockIpcResponse: SendMockIpcResponse;
}

export const startAppWithMocking = async (): Promise<StartMockedAppResponse> => {
  const startAppResult = await startApp('build/test/e2e/setup/main.js');
  const mockIpcHandle = generateMockIpcHandle(startAppResult.app);
  const sendMockIpcResponse = generateSendMockIpcResponse(startAppResult.app);

  return {
    ...startAppResult,
    mockIpcHandle,
    sendMockIpcResponse,
  }
};

type MockIpcHandleProps<T> = {
  channel: string;
  response: T;
};

export type MockIpcHandle = ReturnType<typeof generateMockIpcHandle>;

export const generateMockIpcHandle = (electronApp: ElectronApplication) => {
  return async <T>({ channel, response }: MockIpcHandleProps<T>): Promise<void> => {
    await electronApp.evaluate(
      ({ ipcMain }, { channel, response }) => {
        ipcMain.removeHandler(channel);
        ipcMain.handle(channel, () => {
          return Promise.resolve({
            type: 'success',
            value: response,
          });
        });
      },
      { channel, response },
    );
  };
};

type SendMockIpcResponseProps<T> = {
  channel: string;
  response: T;
};

export type SendMockIpcResponse = ReturnType<typeof generateMockIpcHandle>;

export const generateSendMockIpcResponse = (electronApp: ElectronApplication) => {
  return async <T>({ channel, response }: SendMockIpcResponseProps<T>) => {
    await electronApp.evaluate(
      ({ webContents }, { channel, response }) => {
        webContents.getAllWebContents()[0].send(channel, response);
      },
      { channel, response },
    );
  };
};
