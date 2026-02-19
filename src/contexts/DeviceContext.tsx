import { createContext, useContext, ReactNode } from "react";
import { useDevice } from "@/hooks/useDevice";
import DeviceRegistrationDialog from "@/components/device/DeviceRegistrationDialog";

interface DeviceContextValue {
  deviceId: string | null | undefined;
  deviceName: string | null;
  recoveryCode: string | null;
  isLoading: boolean;
}

const DeviceContext = createContext<DeviceContextValue>({
  deviceId: null,
  deviceName: null,
  recoveryCode: null,
  isLoading: true,
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
      }}
    >
      {children}
      <DeviceRegistrationDialog
        open={!isLoading && needsRegistration}
        onRegister={registerDevice}
        onRecover={recoverDevice}
      />
    </DeviceContext.Provider>
  );
};
