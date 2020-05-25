"use strict";

const si = require('systeminformation');

/*
* Get information of test environment
*/
async function genDeviceInfo(browserInfo, gpuDriverVer) {

  // Get GPU info
  const gpuData = await si.graphics();
  const gpuModel = gpuData.controllers[0].model;
  const gpuInfo = gpuModel + " (" + gpuDriverVer + ")";

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

  // Generate device info as HTML

    const tableRows = [
      {
        name: "CPU",
        info: cpuInfo,
      },
      {
        name: "GPU",
        info: gpuInfo,
      },
      {
        name: "Memory",
        info: memSize,
      },
      {
        name: "Hardware",
        info: hwInfo,
      },
      {
        name: "OS",
        info: osInfo,
      },
      {
        name: "Browser",
        info: browserInfo,
      },
    ];
    let table = "<table>";
    for (const row of tableRows) {
      table += "<tr><td>" + row.name + "</td><td>" + row.info + "</td></tr>";
    }

  return Promise.resolve(table + "</table>");
};

module.exports = genDeviceInfo;