
export interface SystemStats {
  temp: number;
  memory: {
    used: number;
    total: number;
  };
  disk: {
    used: number;
    total: number;
  };
  wifi: {
    ssid: string;
    signal: number;
  };
}

export interface PerformanceData {
  name: string;
  cpu: number;
}

export interface GroupedError {
  message: string;
  count: number;
  firstTimestamp: string;
}
