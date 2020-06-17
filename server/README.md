# Introduction
This upload.py is used for uploading the excels on `~/PHP/files` to WebPnP Test Report site. It should be on the remote server and executed by other Node.js modules remotely.

# Usage
The upload.py is executed remotely `../src/excel.js` and we rarely run it manually.
If you do want to use it, make sure it's at `~/PHP` directory of remote server defined in the `result_server` field of `../config.json`. There should be excel files in the `~/PHP/files` directory. Then you can use it, run:
`
$ cd ~/PHP
$ ./upload.py
`
All the excel data will be uploaded to the WebPnP Test Report site (http://webpnp.sh.intel.com)
