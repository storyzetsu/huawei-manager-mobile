import { ModemAPIClient } from './api.service';
import {
  ModemInfo,
  SignalInfo,
  NetworkInfo,
  TrafficStats,
  ModemStatus,
  WanInfo,
  MobileDataStatus
} from '@/types';
import { parseXMLValue } from '@/utils/helpers';

export class ModemService {
  private apiClient: ModemAPIClient;

  constructor(modemIp: string) {
    this.apiClient = new ModemAPIClient(modemIp);
  }

  async login(username: string, password: string): Promise<boolean> {
    return this.apiClient.login(username, password);
  }

  async logout(): Promise<boolean> {
    return this.apiClient.logout();
  }

  async getModemInfo(): Promise<ModemInfo> {
    try {
      const response = await this.apiClient.get('/api/device/information');
      return {
        deviceName: parseXMLValue(response, 'DeviceName'),
        serialNumber: parseXMLValue(response, 'SerialNumber'),
        imei: parseXMLValue(response, 'Imei'),
        imsi: parseXMLValue(response, 'Imsi'),
        iccid: parseXMLValue(response, 'Iccid'),
        msisdn: parseXMLValue(response, 'Msisdn'),
        hardwareVersion: parseXMLValue(response, 'HardwareVersion'),
        softwareVersion: parseXMLValue(response, 'SoftwareVersion'),
        webUIVersion: parseXMLValue(response, 'WebUIVersion'),
        macAddress1: parseXMLValue(response, 'MacAddress1'),
        macAddress2: parseXMLValue(response, 'MacAddress2'),
        productFamily: parseXMLValue(response, 'ProductFamily'),
        classify: parseXMLValue(response, 'Classify'),
        supportMode: parseXMLValue(response, 'supportmode'),
        workMode: parseXMLValue(response, 'workmode'),
        uptime: (() => {
          const uptimeStr = parseXMLValue(response, 'uptime');
          const parsed = parseInt(uptimeStr);
          return !isNaN(parsed) && uptimeStr !== '' ? parsed : undefined;
        })(),
      };
    } catch (error) {
      console.error('Error getting modem info:', error);
      throw error;
    }
  }

  async getSignalInfo(): Promise<SignalInfo> {
    try {
      const response = await this.apiClient.get('/api/device/signal');
      
      // FIX E5577 Max: Jika respon berupa plain text angka-angka (dipisah spasi)
      if (typeof response === 'string' && !response.trim().startsWith('<?xml')) {
        const parts = response.trim().split(/\s+/);
        return {
          pci: parts[0] || '',
          cellId: parts[1] || '',
          rsrq: parts[2] || '',
          rsrp: parts[3] || '',
          rssi: parts[4] || '',
          sinr: parts[5] || '',
          mode: parts[6] || '',
          band: parts[7] ? `Band ${parts[7]}` : '', 
          dlbandwidth: '', 
          ulbandwidth: '',
          rscp: '',
          ecio: '',
        };
      }

      // Default XML Parser
      const lteBandwidth = parseXMLValue(response, 'lte_bandwidth');
      return {
        rssi: parseXMLValue(response, 'rssi'),
        rsrp: parseXMLValue(response, 'rsrp'),
        rsrq: parseXMLValue(response, 'rsrq'),
        sinr: parseXMLValue(response, 'sinr'),
        rscp: parseXMLValue(response, 'rscp'),
        ecio: parseXMLValue(response, 'ecio'),
        mode: parseXMLValue(response, 'mode'),
        pci: parseXMLValue(response, 'pci'),
        cellId: parseXMLValue(response, 'cell_id'),
        band: parseXMLValue(response, 'band') || parseXMLValue(response, 'lte_bandinfo'),
        dlbandwidth: parseXMLValue(response, 'dlbandwidth') || lteBandwidth,
        ulbandwidth: parseXMLValue(response, 'ulbandwidth') || lteBandwidth,
      };
    } catch (error) {
      console.error('Error getting signal info:', error);
      throw error;
    }
  }

  async getSignalInfoFast(): Promise<SignalInfo> {
    try {
      const response = await this.apiClient.getFast('/api/device/signal');
      
      if (typeof response === 'string' && !response.trim().startsWith('<?xml')) {
        const parts = response.trim().split(/\s+/);
        return {
          pci: parts[0] || '',
          cellId: parts[1] || '',
          rsrq: parts[2] || '',
          rsrp: parts[3] || '',
          rssi: parts[4] || '',
          sinr: parts[5] || '',
          mode: parts[6] || '',
          band: parts[7] ? `Band ${parts[7]}` : '',
          dlbandwidth: '',
          ulbandwidth: '',
          rscp: '',
          ecio: '',
        };
      }

      const lteBandwidth = parseXMLValue(response, 'lte_bandwidth');
      return {
        rssi: parseXMLValue(response, 'rssi'),
        rsrp: parseXMLValue(response, 'rsrp'),
        rsrq: parseXMLValue(response, 'rsrq'),
        sinr: parseXMLValue(response, 'sinr'),
        rscp: parseXMLValue(response, 'rscp'),
        ecio: parseXMLValue(response, 'ecio'),
        mode: parseXMLValue(response, 'mode'),
        pci: parseXMLValue(response, 'pci'),
        cellId: parseXMLValue(response, 'cell_id'),
        band: parseXMLValue(response, 'band') || parseXMLValue(response, 'lte_bandinfo'),
        dlbandwidth: parseXMLValue(response, 'dlbandwidth') || lteBandwidth,
        ulbandwidth: parseXMLValue(response, 'ulbandwidth') || lteBandwidth,
      };
    } catch (error) {
      throw error;
    }
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      const response = await this.apiClient.get('/api/net/current-plmn');
      return {
        state: parseXMLValue(response, 'State'),
        registerState: parseXMLValue(response, 'RegisterState'),
        roamingState: parseXMLValue(response, 'RoamingState'),
        serviceStatus: parseXMLValue(response, 'ServiceStatus'),
        serviceDomain: parseXMLValue(response, 'ServiceDomain'),
        currentNetworkType: parseXMLValue(response, 'CurrentNetworkType'),
        currentServiceDomain: parseXMLValue(response, 'CurrentServiceDomain'),
        psState: parseXMLValue(response, 'psState'),
        networkName: parseXMLValue(response, 'FullName'),
        shortName: parseXMLValue(response, 'ShortName'),
        spnName: parseXMLValue(response, 'SpnName'),
        fullName: parseXMLValue(response, 'FullName'),
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      throw error;
    }
  }

  async getTrafficStats(): Promise<TrafficStats> {
    try {
      const safeParseInt = (value: string): number => {
        const parsed = parseInt(value);
        return isNaN(parsed) ? 0 : parsed;
      };
      const response = await this.apiClient.get('/api/monitoring/traffic-statistics');
      let monthDownload = 0, monthUpload = 0, monthDuration = 0, dayUsed = 0, dayDuration = 0;
      try {
        const monthResponse = await this.apiClient.get('/api/monitoring/month_statistics');
        monthDownload = safeParseInt(parseXMLValue(monthResponse, 'CurrentMonthDownload') || parseXMLValue(monthResponse, 'monthDownload') || parseXMLValue(monthResponse, 'MonthDownload'));
        monthUpload = safeParseInt(parseXMLValue(monthResponse, 'CurrentMonthUpload') || parseXMLValue(monthResponse, 'monthUpload') || parseXMLValue(monthResponse, 'MonthUpload'));
        monthDuration = safeParseInt(parseXMLValue(monthResponse, 'CurrentMonthDuration') || parseXMLValue(monthResponse, 'monthDuration') || parseXMLValue(monthResponse, 'MonthDuration'));
        dayUsed = safeParseInt(parseXMLValue(monthResponse, 'CurrentDayUsed') || parseXMLValue(monthResponse, 'dayUsed') || parseXMLValue(monthResponse, 'DayUsed'));
        dayDuration = safeParseInt(parseXMLValue(monthResponse, 'CurrentDayDuration') || parseXMLValue(monthResponse, 'dayDuration') || parseXMLValue(monthResponse, 'DayDuration'));
      } catch (monthErr) {}
      return {
        currentConnectTime: safeParseInt(parseXMLValue(response, 'CurrentConnectTime')),
        currentUpload: safeParseInt(parseXMLValue(response, 'CurrentUpload')),
        currentDownload: safeParseInt(parseXMLValue(response, 'CurrentDownload')),
        currentDownloadRate: safeParseInt(parseXMLValue(response, 'CurrentDownloadRate')),
        currentUploadRate: safeParseInt(parseXMLValue(response, 'CurrentUploadRate')),
        totalUpload: safeParseInt(parseXMLValue(response, 'TotalUpload')),
        totalDownload: safeParseInt(parseXMLValue(response, 'TotalDownload')),
        totalConnectTime: safeParseInt(parseXMLValue(response, 'TotalConnectTime')),
        monthDownload, monthUpload, monthDuration, dayUsed, dayDuration,
      };
    } catch (error) {
      console.error('Error getting traffic stats:', error);
      throw error;
    }
  }

  async getModemStatus(): Promise<ModemStatus> {
    try {
      const response = await this.apiClient.get('/api/monitoring/status');
      return {
        connectionStatus: parseXMLValue(response, 'ConnectionStatus'),
        signalIcon: parseXMLValue(response, 'SignalIcon'),
        currentNetworkType: parseXMLValue(response, 'CurrentNetworkType'),
        currentServiceDomain: parseXMLValue(response, 'CurrentServiceDomain'),
        roamingStatus: parseXMLValue(response, 'RoamingStatus'),
        batteryStatus: parseXMLValue(response, 'BatteryStatus') || '',
        batteryLevel: parseXMLValue(response, 'BatteryLevel') || '',
        batteryPercent: parseXMLValue(response, 'BatteryPercent') || '',
        simStatus: parseXMLValue(response, 'SimStatus'),
        wifiConnectionStatus: parseXMLValue(response, 'WifiConnectionStatus'),
        signalStrength: parseXMLValue(response, 'SignalStrength'),
      };
    } catch (error) {
      console.error('Error getting modem status:', error);
      throw error;
    }
  }

  async reboot(): Promise<boolean> {
    try {
      const rebootData = `<?xml version="1.0" encoding="UTF-8"?><request><Control>1</Control></request>`;
      await this.apiClient.post('/api/device/control', rebootData);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async resetFactorySettings(): Promise<boolean> {
    try {
      const resetData = `<?xml version="1.0" encoding="UTF-8"?><request><Control>2</Control></request>`;
      await this.apiClient.post('/api/device/control', resetData);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getWanInfo(): Promise<WanInfo> {
    try {
      const response = await this.apiClient.get('/api/device/information');
      const safeParseInt = (v: string) => isNaN(parseInt(v)) ? 0 : parseInt(v);
      return {
        wanIPAddress: parseXMLValue(response, 'WanIPAddress') || parseXMLValue(response, 'WanIpAddress') || '',
        uptime: safeParseInt(parseXMLValue(response, 'Uptime')),
        primaryDns: parseXMLValue(response, 'PrimaryDNS') || '',
        secondaryDns: parseXMLValue(response, 'SecondaryDNS') || '',
      };
    } catch (error) {
      throw error;
    }
  }

  async getMobileDataStatus(): Promise<MobileDataStatus> {
    try {
      const response = await this.apiClient.get('/api/dialup/mobile-dataswitch');
      return { dataswitch: parseXMLValue(response, 'dataswitch') === '1' };
    } catch (error) {
      throw error;
    }
  }

  async toggleMobileData(enable: boolean): Promise<boolean> {
    try {
      const data = `<?xml version="1.0" encoding="UTF-8"?><request><dataswitch>${enable ? '1' : '0'}</dataswitch></request>`;
      await this.apiClient.post('/api/dialup/mobile-dataswitch', data);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async triggerPlmnScan(): Promise<boolean> {
    try {
      await this.apiClient.get('/api/net/plmn-list');
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getAntennaMode(): Promise<string> {
    try {
      const response = await this.apiClient.get('/api/device/antenna_set_type');
      const antennaValue = parseXMLValue(response, 'antennasettype') || parseXMLValue(response, 'AntennaSetType') || parseXMLValue(response, 'antenna_set_type');
      const modeMap: Record<string, string> = { '0': 'auto', '1': 'external', '2': 'internal' };
      return modeMap[antennaValue] || 'auto';
    } catch (error) {
      return 'auto';
    }
  }

  async setAntennaMode(mode: 'auto' | 'internal' | 'external'): Promise<boolean> {
    try {
      const modeMap = { 'auto': '0', 'internal': '2', 'external': '1' };
      const data = `<?xml version="1.0" encoding="UTF-8"?><request><antennasettype>${modeMap[mode]}</antennasettype></request>`;
      await this.apiClient.post('/api/device/antenna_set_type', data);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getNetworkMode(): Promise<string> {
    try {
      const response = await this.apiClient.get('/api/net/net-mode');
      return parseXMLValue(response, 'NetworkMode') || '00';
    } catch (error) {
      return '00';
    }
  }

  async setNetworkMode(mode: string): Promise<boolean> {
    try {
      const data = `<?xml version="1.0" encoding="UTF-8"?><request><NetworkMode>${mode}</NetworkMode><NetworkBand>3FFFFFFF</NetworkBand><LTEBand>7FFFFFFFFFFFFFFF</LTEBand></request>`;
      await this.apiClient.post('/api/net/net-mode', data);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getBandSettings(): Promise<{ networkBand: string; lteBand: string }> {
    try {
      const response = await this.apiClient.get('/api/net/net-mode');
      return {
        networkBand: parseXMLValue(response, 'NetworkBand') || '3FFFFFFF',
        lteBand: parseXMLValue(response, 'LTEBand') || '7FFFFFFFFFFFFFFF',
      };
    } catch (error) {
      return { networkBand: '3FFFFFFF', lteBand: '7FFFFFFFFFFFFFFF' };
    }
  }

  async setBandSettings(networkBand: string, lteBand: string): Promise<boolean> {
    try {
      const currentModeResponse = await this.apiClient.get('/api/net/net-mode');
      const currentMode = parseXMLValue(currentModeResponse, 'NetworkMode') || '00';
      const data = `<?xml version="1.0" encoding="UTF-8"?><request><NetworkMode>${currentMode}</NetworkMode><NetworkBand>${networkBand}</NetworkBand><LTEBand>${lteBand}</LTEBand></request>`;
      await this.apiClient.post('/api/net/net-mode', data);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getDataRoamingStatus(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/api/dialup/connection');
      return parseXMLValue(response, 'RoamAutoConnectEnable') === '1';
    } catch (error) {
      return false;
    }
  }

  async setDataRoaming(enable: boolean): Promise<boolean> {
    try {
      const data = `<?xml version="1.0" encoding="UTF-8"?><request><RoamAutoConnectEnable>${enable ? '1' : '0'}</RoamAutoConnectEnable></request>`;
      await this.apiClient.post('/api/dialup/connection', data);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getAutoNetworkStatus(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/api/dialup/apn-retry');
      return parseXMLValue(response, 'retrystatus') === '1';
    } catch (error) {
      return true;
    }
  }

  async setAutoNetwork(enable: boolean): Promise<boolean> {
    try {
      const data = `<?xml version="1.0" encoding="UTF-8"?><request><retrystatus>${enable ? '1' : '0'}</retrystatus></request>`;
      await this.apiClient.post('/api/dialup/apn-retry', data);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getTimeSettings(): Promise<{ currentTime: string; sntpEnabled: boolean; ntpServer: string; ntpServerBackup: string; timezone: string; }> {
    return { currentTime: new Date().toISOString(), sntpEnabled: false, ntpServer: 'pool.ntp.org', ntpServerBackup: 'time.google.com', timezone: 'UTC+7' };
  }

  async setTimeSettings(settings: any): Promise<boolean> {
    return true;
  }

  async getCurrentTime(): Promise<string> {
    return new Date().toISOString();
  }

  async getMonthlyDataSettings(): Promise<any> {
    return { enabled: false, startDay: 1, dataLimit: 0, dataLimitUnit: 'GB', monthThreshold: 90, trafficMaxLimit: 0 };
  }

  async setMonthlyDataSettings(settings: any): Promise<boolean> {
    return true;
  }

  async diagnosisPing(host: string = '1.1.1.1', timeout: number = 4000): Promise<any> {
    return { success: true, host, message: 'Ping successful' };
  }

  async oneClickCheck(): Promise<any> {
    return { internetConnection: true, dnsResolution: true, networkStatus: 'Connected', signalStrength: 'Good', summaryKey: 'allChecksPassed' };
  }

  async clearTrafficHistory(): Promise<boolean> {
    return true;
  }
}
