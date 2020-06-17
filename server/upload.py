#!/usr/bin/env python3
import os
import subprocess
import glob

token = { "php": "4fc97c5dc10c681a87c5eb6178c60a0025299e44"}
project = 1
user = "php"
dir_path = "/home/banana/PHP/files"


def get_files_str():
    files_list = []
    src_list = glob.glob("%s/*.xlsx" % dir_path)
#    print(src_list)
    if not src_list:
        return
    for src_file in src_list:
        fstr = '-F files=@%s' % src_file
        files_list.append(fstr)

    o = subprocess.check_call("curl %s -F project=%d http://webpnp.sh.intel.com/api/report/ -H 'Authorization: Token  %s' " % (' '.join(files_list), project, token[user]), shell=True)
    print(o)
    if o == 0:
        print("backup files")
        for src_file in src_list:
            os.rename(src_file, os.path.join('/home/banana/PHP/bak', os.path.basename(src_file)))

if __name__ == '__main__':
    get_files_str()
