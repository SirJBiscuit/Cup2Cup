import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  platform: string;
  userAgent: string;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => getDeviceInfo());

  function getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Check for mobile devices
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Screen size breakpoints
    const isMobileScreen = screenWidth < 768;
    const isTabletScreen = screenWidth >= 768 && screenWidth < 1024;
    
    // Combine checks for more accurate detection
    const isMobile = (isMobileUA && isMobileScreen) || (isTouchDevice && isMobileScreen);
    const isTablet = (isMobileUA && isTabletScreen) || (isTouchDevice && isTabletScreen && !isMobile);
    const isDesktop = !isMobile && !isTablet;
    
    const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
    
    // Detect platform
    let platform = 'unknown';
    if (/android/i.test(userAgent)) platform = 'android';
    else if (/iphone|ipad|ipod/i.test(userAgent)) platform = 'ios';
    else if (/mac/i.test(userAgent)) platform = 'macos';
    else if (/win/i.test(userAgent)) platform = 'windows';
    else if (/linux/i.test(userAgent)) platform = 'linux';
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenWidth,
      screenHeight,
      orientation,
      platform,
      userAgent,
    };
  }

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        setDeviceInfo(getDeviceInfo());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
};
