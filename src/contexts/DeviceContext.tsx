import { createContext, useContext, ReactNode } from "react";
import { useDevice } from "@/hooks/useDevice";

interface DeviceContextValue {
  deviceId: string | null | undefined;
  deviceName: string | null;
  recoveryCode: string | null;
  isLoading: boolean;
  needsRegistration: boolean;
  registerDevice: (name: string) => Promise<any>;
  recoverDevice: (code: string) => Promise<any>;
}

const DeviceContext = createContext<DeviceContextValue>({
  deviceId: null,
  deviceName: null,
  recoveryCode: null,
  isLoading: true,
  needsRegistration: false,
  registerDevice: async () => {},
  recoverDevice: async () => {},
});

export const useDeviceContext = () => useContext(DeviceContext);

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const { device, isLoading, needsRegistration, registerDevice, recoverDevice, deviceId } = useDevice();

  return (
    <DeviceContext.Provider
      value={{
        deviceId,
        deviceName: device?.full_name || null,
        recoveryCode: device?.recovery_code || null,
        isLoading,
        needsRegistration,
        registerDevice,
        recoverDevice,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};
