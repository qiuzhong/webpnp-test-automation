"use strict";

const si = require('systeminformation');
const getOtherInfo = require('./get_other_info.js');

/*
* Get information of device info
*/
async function getDeviceInfo() {
  const otherInfo = await getOtherInfo();
  const chromeVersion = otherInfo.chromeVersion;
  const gpuDriverVersion = otherInfo.gpuDriverVersion;

  console.log('********** Get all device info **********');
  // Get GPU info
  const gpuData = await si.graphics();
  const gpuModel = gpuData.controllers[0].model;
  const gpuInfo = gpuModel + " (" + gpuDriverVersion + ")";

  // Get CPU info
  const cpuData = await si.cpu();
  const cpuInfo = cpuData.manufacturer + " " + cpuData.brand;

  // Get memory info
  const memData = await si.mem();
  const memSize = Math.round(memData.total/1024/1024/1024) + "G";

  // Get hardware info
  const hwData = await si.system();
  const hwInfo = hwData.manufacturer + " " + hwData.version;

  // Get OS info
  const osData = await si.osInfo();
  const osInfo = osData.distro + " (" + osData.release + ")";

  // Generate device info object
  const deviceInfo = {
    "cpu": cpuInfo,
    "gpu": gpuInfo,
    "memory": memSize,
    "hardware": hwInfo,
    "OS": osInfo,
    "Browser": "Chrome_" + chromeVersion
  };
  console.log(deviceInfo);

  return Promise.resolve(deviceInfo);
};

module.exports = getDeviceInfo;