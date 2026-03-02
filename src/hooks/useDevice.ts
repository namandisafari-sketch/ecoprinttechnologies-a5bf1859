import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEVICE_KEY = "sw_device_id";
const FINGERPRINT_KEY = "sw_device_fingerprint";

interface DeviceProfile {
  id: string;
  device_fingerprint: string;
  full_name: string;
  recovery_code: string;
  device_type: string | null;
  user_agent: string | null;
  ip_address: string | null;
  screen_width: number | null;
  screen_height: number | null;
  platform: string | null;
  language: string | null;
  connection_type: string | null;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function getConnectionType(): string | null {
  const nav = navigator as any;
  return nav.connection?.effectiveType || nav.connection?.type || null;
}

function parsePhoneBrandModel(ua: string): { brand: string | null; model: string | null } {
  // Try to extract Android device brand/model from UA string
  const androidMatch = ua.match(/;\s*([^;)]+)\s+Build\//);
  if (androidMatch) {
    const parts = androidMatch[1].trim().split(/\s+/);
    return { brand: parts[0] || null, model: parts.slice(1).join(" ") || parts[0] || null };
  }
  // iPhone
  if (/iPhone/.test(ua)) return { brand: "Apple", model: "iPhone" };
  if (/iPad/.test(ua)) return { brand: "Apple", model: "iPad" };
  if (/Macintosh/.test(ua)) return { brand: "Apple", model: "Mac" };
  return { brand: null, model: null };
}

async function fetchRealIP(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

async function collectDeviceMetadata() {
  const { brand, model } = parsePhoneBrandModel(navigator.userAgent);
  const ip = await fetchRealIP();
  return {
    device_type: getDeviceType(),
    user_agent: navigator.userAgent,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    platform: navigator.platform || null,
    language: navigator.language || null,
    connection_type: getConnectionType(),
    phone_brand: brand,
    phone_model: model,
    ip_address: ip,
  };
}

function generateFingerprint(): string {
  return "fp_" + crypto.randomUUID().replace(/-/g, "");
}

function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function useDevice() {
  const [device, setDevice] = useState<DeviceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  // Load device on mount
  useEffect(() => {
    loadDevice();
  }, []);

  const loadDevice = async () => {
    setIsLoading(true);
    try {
      const fingerprint = localStorage.getItem(FINGERPRINT_KEY);
      if (!fingerprint) {
        setNeedsRegistration(true);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("device_fingerprint", fingerprint)
        .maybeSingle();

      if (error || !data) {
        // Fingerprint exists locally but not in DB — re-register
        setNeedsRegistration(true);
      } else {
        localStorage.setItem(DEVICE_KEY, data.id);
        setDevice(data as DeviceProfile);

        // Refresh metadata (IP, brand, model, etc.) on each visit
        collectDeviceMetadata().then((metadata) => {
          supabase
            .from("devices")
            .update(metadata)
            .eq("id", data.id)
            .select()
            .single()
            .then(({ data: updated }) => {
              if (updated) setDevice(updated as DeviceProfile);
            });
        });
      }
    } catch {
      setNeedsRegistration(true);
    } finally {
      setIsLoading(false);
    }
  };

  const registerDevice = useCallback(async (fullName: string): Promise<DeviceProfile> => {
    const fingerprint = generateFingerprint();
    const recoveryCode = generateRecoveryCode();
    const metadata = await collectDeviceMetadata();

    const { data, error } = await supabase
      .from("devices")
      .insert({
        device_fingerprint: fingerprint,
        full_name: fullName,
        recovery_code: recoveryCode,
        ...metadata,
      })
      .select()
      .single();

    if (error || !data) throw new Error("Failed to register device");

    localStorage.setItem(FINGERPRINT_KEY, fingerprint);
    localStorage.setItem(DEVICE_KEY, data.id);
    const profile = data as DeviceProfile;
    setDevice(profile);
    setNeedsRegistration(false);
    return profile;
  }, []);

  const recoverDevice = useCallback(async (code: string): Promise<DeviceProfile> => {
    const { data: oldDevice, error } = await supabase
      .from("devices")
      .select("*")
      .eq("recovery_code", code.toUpperCase().trim())
      .maybeSingle();

    if (error || !oldDevice) throw new Error("Invalid recovery code");

    const newFingerprint = generateFingerprint();
    const metadata = await collectDeviceMetadata();
    const { data: updated, error: updateError } = await supabase
      .from("devices")
      .update({ device_fingerprint: newFingerprint, ...metadata })
      .eq("id", oldDevice.id)
      .select()
      .single();

    if (updateError || !updated) throw new Error("Recovery failed");

    localStorage.setItem(FINGERPRINT_KEY, newFingerprint);
    localStorage.setItem(DEVICE_KEY, updated.id);
    const profile = updated as DeviceProfile;
    setDevice(profile);
    setNeedsRegistration(false);
    return profile;
  }, []);

  return {
    device,
    isLoading,
    needsRegistration,
    registerDevice,
    recoverDevice,
    deviceId: device?.id || localStorage.getItem(DEVICE_KEY),
  };
}
